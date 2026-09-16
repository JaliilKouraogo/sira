"use client";

/**
 * Back-office — recherche et liste des utilisateurs [T §21.2].
 *
 * Les filtres sont portés par l'URL (`?q=`, `?role=`) : une recherche
 * d'administration se partage entre modérateurs sans avoir à réexpliquer les
 * critères. En export statique, `AdminUsersDirectoryFromUrl` lit l'adresse
 * dans le navigateur ; `AdminUsersDirectory` sans filtre sert de rendu de repli.
 *
 * Direction épurée : pas de carte autour du tableau, un filet en guise de
 * séparation, et une densité de texte serrée propre à un outil interne.
 */

import { useSearchParams } from "next/navigation";
import { route } from "@/lib/base-path";
import { AdminActions } from "./admin-actions";
import { Table, Td, TdMuted, Tr, fullName, initialsOf } from "./admin-kit";
import { IconSearch } from "./icons";
import { IllustrationNoResults } from "./illustrations";
import { Avatar, Badge, Button, EmptyState, Field, Input, Select, formatDate } from "./ui";
import { getAllUsers } from "@/data/queries";
import { USER_ROLES, USER_ROLE_LABEL, type UserRole } from "@/lib/enums";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function isRole(value: string | undefined): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

/** Lit la recherche et le rôle dans l'adresse. À rendre sous un `<Suspense>`. */
export function AdminUsersDirectoryFromUrl() {
  const params = useSearchParams();
  return <AdminUsersDirectory q={params.get("q") ?? undefined} role={params.get("role") ?? undefined} />;
}

export function AdminUsersDirectory({ q, role: roleParam }: { q?: string; role?: string }) {
  const query = typeof q === "string" ? q : "";
  const role = isRole(roleParam) ? roleParam : undefined;

  const users = getAllUsers()
    .filter((u) => (role ? u.role === role : true))
    .filter((u) => (query ? norm(`${u.firstName} ${u.lastName} ${u.email} ${u.phone ?? ""}`).includes(norm(query)) : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      {/* ---- Recherche ---- */}
      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Rechercher</h2>
        <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
          Nom, adresse e-mail ou numéro de téléphone
        </p>
        <form
          key={`${query}|${role ?? ""}`}
          method="get"
          action={route("/admin/utilisateurs")}
          className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px_auto] sm:items-end"
        >
          <Field label="Recherche" htmlFor="q">
            <Input id="q" name="q" type="search" defaultValue={query} placeholder="Awa, @sira.bf, +226…" />
          </Field>
          <Field label="Rôle" htmlFor="role">
            <Select id="role" name="role" defaultValue={role ?? ""}>
              <option value="">Tous les rôles</option>
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {USER_ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit">
            <IconSearch size={16} />
            Filtrer
          </Button>
        </form>
      </section>

      {/* ---- Résultats ---- */}
      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">
            {users.length} compte{users.length > 1 ? "s" : ""}
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
            {role ? `Filtré sur le rôle « ${USER_ROLE_LABEL[role]} »` : "Aucun filtre de rôle"}
          </p>
        </div>
        {users.length === 0 ? (
          <EmptyState
            icon={<IllustrationNoResults size={170} accent="var(--color-zone-admin)" />}
            title="Aucun compte ne correspond"
            description="Élargissez la recherche ou retirez le filtre de rôle."
          />
        ) : (
          <Table head={["Utilisateur", "Rôle", "Vérification", "2FA", "Inscription", "Actions"]} minWidth={880}>
            {users.map((user) => (
              <Tr key={user.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar initials={initialsOf(user)} size={32} rounded="full" />
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-medium">{fullName(user)}</p>
                      <p className="truncate text-[12.5px] text-[var(--color-text-muted)]">{user.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <Badge tone={user.role === "admin" ? "primary" : "neutral"}>{USER_ROLE_LABEL[user.role]}</Badge>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone={user.emailVerifiedAt ? "success" : "warning"}>
                      {user.emailVerifiedAt ? "E-mail vérifié" : "E-mail à vérifier"}
                    </Badge>
                    {user.phone ? (
                      <Badge tone={user.phoneVerifiedAt ? "success" : "neutral"}>
                        {user.phoneVerifiedAt ? "Téléphone vérifié" : "Téléphone non vérifié"}
                      </Badge>
                    ) : null}
                  </div>
                </Td>
                <Td>
                  <Badge tone={user.twoFactorEnabled ? "success" : "neutral"}>
                    {user.twoFactorEnabled ? "Activée" : "Inactive"}
                  </Badge>
                </Td>
                <TdMuted>{formatDate(user.createdAt)}</TdMuted>
                <Td>
                  <AdminActions
                    subject={`le compte de ${fullName(user)}`}
                    actions={[
                      { label: "Voir", variant: "outline" },
                      { label: "Suspendre", variant: "danger" },
                    ]}
                  />
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </section>
    </>
  );
}
