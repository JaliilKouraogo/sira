/**
 * Back-office — utilisateurs [T §21.2].
 *
 * Les filtres sont portés par l'URL : une recherche d'administration se
 * partage entre modérateurs sans avoir à réexpliquer les critères.
 *
 * Compatible export statique : la page ne lit pas l'adresse. `?q=` et
 * `?role=` sont appliqués dans le navigateur par `AdminUsersDirectoryFromUrl`,
 * rendu sous `<Suspense>` ; la liste sans filtre sert de rendu de repli.
 *
 * Direction épurée : pas de carte autour du tableau, un filet en guise de
 * séparation, et une densité de texte serrée propre à un outil interne.
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminUsersDirectory, AdminUsersDirectoryFromUrl } from "@/components/admin-users-directory";
import { formatInt } from "@/components/admin-kit";
import { PageHeader, Stat } from "@/components/ui";
import { getAllUsers } from "@/data/queries";

export const metadata: Metadata = {
  title: "Utilisateurs | Administration SIRA",
};

export default function AdminUsersPage() {
  const all = getAllUsers();
  const twoFactorCount = all.filter((u) => u.twoFactorEnabled).length;
  const unverifiedCount = all.filter((u) => !u.emailVerifiedAt).length;

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        description="Tous les comptes de la plateforme, quel que soit leur rôle. L'administration consulte, suspend ou réactive un compte ; elle ne modifie jamais le contenu d'un profil à la place de son titulaire."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Comptes" value={formatInt(all.length)} hint="Tous rôles confondus" />
        <Stat
          label="Double authentification active"
          value={formatInt(twoFactorCount)}
          hint={`sur ${all.length} comptes`}
        />
        <Stat
          label="E-mail non vérifié"
          value={formatInt(unverifiedCount)}
          hint="Accès limité tant que l'adresse n'est pas confirmée"
        />
      </div>

      <Suspense fallback={<AdminUsersDirectory />}>
        <AdminUsersDirectoryFromUrl />
      </Suspense>
    </>
  );
}
