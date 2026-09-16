/**
 * Back-office — candidats [T §21.2].
 *
 * Vue d'exploitation, pas de fiche commerciale : l'administration suit la
 * complétude, le plan et l'activité, sans entrer dans le contenu des
 * candidatures, qui relève du candidat et du recruteur.
 *
 * Direction épurée : filets plutôt que cartes, chiffres clés neutres, et la
 * couleur réservée aux puces de statut.
 */

import type { Metadata } from "next";
import { AdminActions } from "@/components/admin-actions";
import {
  BarChart,
  PREPARATION_TONE,
  Table,
  Td,
  TdMuted,
  Tr,
  formatInt,
  formatPercent,
  fullName,
  initialsOf,
} from "@/components/admin-kit";
import { Alert, Avatar, Badge, PageHeader, Progress, Stat, formatDate, relativeDays } from "@/components/ui";
import {
  getAllUsers,
  getApplications,
  getCandidateProfile,
  getSubscription,
  getUserById,
} from "@/data/queries";
import {
  PLAN_LABEL,
  PREPARATION_STATUSES,
  PREPARATION_STATUS_LABEL,
  PROFILE_VISIBILITY_LABEL,
} from "@/lib/enums";

export const metadata: Metadata = {
  title: "Candidats | Administration SIRA",
};

export default function AdminCandidatesPage() {
  const profile = getCandidateProfile();
  const applications = getApplications();
  const subscription = getSubscription();
  const candidateUsers = getAllUsers().filter((u) => u.role === "candidate");

  /** Un seul profil complet existe en démonstration : il porte les compteurs. */
  const rows = candidateUsers.map((user) => {
    const own = user.id === profile.userId ? profile : undefined;
    const apps = own ? applications : [];
    const lastActivity = apps.reduce((latest, a) => (a.updatedAt > latest ? a.updatedAt : latest), user.createdAt);
    return { user, profile: own, apps, lastActivity };
  });

  const sent = applications.filter((a) => a.preparationStatus === "envoyee");
  const averageCompletion =
    rows.length === 0
      ? 0
      : rows.reduce((sum, r) => sum + (r.profile?.completionScore ?? 0), 0) / rows.length;

  const byPreparation = PREPARATION_STATUSES.map((status) => ({
    label: PREPARATION_STATUS_LABEL[status],
    value: applications.filter((a) => a.preparationStatus === status).length,
  })).filter((row) => row.value > 0);

  return (
    <>
      <PageHeader
        title="Candidats"
        description="Suivi des profils candidats : complétude, plan, volume de candidatures et dernière activité. Les données nominatives ne sont consultables que pour un motif d'exploitation ou de modération."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Candidats inscrits" value={formatInt(candidateUsers.length)} />
        <Stat label="Complétude moyenne" value={formatPercent(averageCompletion, 0)} />
        <Stat label="Candidatures préparées" value={formatInt(applications.length)} />
        <Stat label="Candidatures envoyées" value={formatInt(sent.length)} />
      </div>

      {/* ---- Profils ---- */}
      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Profils candidats</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">Triés par dernière activité</p>
        </div>
        <Table
          head={["Candidat", "Profil", "Complétude", "Plan", "Candidatures", "Dernière activité", "Actions"]}
          minWidth={960}
        >
          {rows.map(({ user, profile: p, apps, lastActivity }) => (
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
              <Td className="max-w-[260px]">
                {p ? (
                  <>
                    <p className="truncate text-[13px]">{p.headline}</p>
                    <p className="mt-0.5 truncate text-[12.5px] text-[var(--color-text-muted)]">
                      {p.city} · {p.domain} · {p.experienceYears} ans
                    </p>
                  </>
                ) : (
                  <span className="text-[13px] text-[var(--color-text-muted)]">Profil non renseigné</span>
                )}
              </Td>
              <Td className="min-w-[140px]">
                <div className="flex items-center gap-2">
                  <Progress value={p?.completionScore ?? 0} className="w-20" label="Complétude du profil" />
                  <span className="text-[12.5px] tabular-nums text-[var(--color-text-muted)]">
                    {p?.completionScore ?? 0} %
                  </span>
                </div>
              </Td>
              <Td>
                <Badge tone={(p?.plan ?? "candidat_gratuit") === "candidat_premium" ? "accent" : "neutral"}>
                  {PLAN_LABEL[p?.plan ?? "candidat_gratuit"]}
                </Badge>
              </Td>
              <Td>
                <span className="text-[13.5px] tabular-nums">{apps.length}</span>
                <span className="ml-1 text-[12.5px] text-[var(--color-text-muted)]">
                  dont {apps.filter((a) => a.preparationStatus === "envoyee").length} envoyée(s)
                </span>
              </Td>
              <TdMuted>{relativeDays(lastActivity)}</TdMuted>
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
      </section>

      {/* ---- Répartition et confidentialité ---- */}
      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">
            Candidatures par état de préparation
          </h2>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
            Axe candidat du double état : préparation d&apos;un côté, examen recruteur de l&apos;autre
          </p>
          <div className="mt-4">
            <BarChart items={byPreparation} tone="info" />
          </div>
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {PREPARATION_STATUSES.map((s) => (
              <li key={s}>
                <Badge tone={PREPARATION_TONE[s]}>{PREPARATION_STATUS_LABEL[s]}</Badge>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Confidentialité et abonnement</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
            Ce que l&apos;administration peut et ne peut pas faire
          </p>
          <div className="mt-4 space-y-3">
            <Alert tone="info" title="Visibilité du profil">
              Le candidat choisit lui-même sa visibilité. Profil de démonstration :{" "}
              <strong className="font-semibold">{PROFILE_VISIBILITY_LABEL[profile.profileVisibility]}</strong>.
              L&apos;administration ne peut pas la modifier à sa place.
            </Alert>
            <Alert tone="neutral" title="Abonnement en cours">
              {PLAN_LABEL[subscription.plan]} depuis le {formatDate(subscription.startedAt)}. Une suspension de compte
              n&apos;annule pas l&apos;abonnement : elle bloque l&apos;accès et déclenche un remboursement au prorata.
            </Alert>
            <Alert tone="warning" title="Accès aux données">
              La consultation d&apos;une fiche candidat est journalisée, avec l&apos;administrateur, l&apos;horodatage
              et le motif. {getUserById(profile.userId)?.email ?? "Compte inconnu"} est le seul profil complet de la
              démonstration.
            </Alert>
          </div>
        </div>
      </section>
    </>
  );
}
