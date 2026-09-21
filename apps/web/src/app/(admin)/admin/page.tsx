/**
 * Back-office — tableau de bord [T §21.1].
 *
 * L'écran s'ouvre sur ce qui attend une décision humaine, pas sur les
 * compteurs : les trois files actionnables passent devant les indicateurs.
 *
 * Direction épurée : fond blanc, aucune ombre, aucun aplat coloré. Les
 * sections se séparent par un filet de 1 pixel, les files d'attente sont des
 * lignes plutôt que des cartes accentuées, et la couleur ne sert qu'aux liens
 * et aux puces de statut.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { AdminActions } from "@/components/admin-actions";
import {
  BarChart,
  JOB_STATUS_TONE,
  REPORT_STATUS_LABEL,
  REPORT_STATUS_TONE,
  Table,
  Td,
  TdMuted,
  Tr,
  VERIFICATION_TONE,
  formatInt,
  formatUsd,
  getAllJobsAdmin,
  orgName,
} from "@/components/admin-kit";
import { ZoneHeader } from "@/components/illustrations";
import { Badge, Stat, relativeDays } from "@/components/ui";
import {
  getAdminDashboard,
  getAllUsers,
  getAuditLogs,
  getOrganization,
  getOrganizations,
  getJobById,
} from "@/data/queries";
import {
  JOB_STATUSES,
  JOB_STATUS_LABEL,
  USER_ROLES,
  USER_ROLE_LABEL,
  VERIFICATION_STATUS_LABEL,
  formatMoney,
} from "@/lib/enums";

export const metadata: Metadata = {
  title: "Tableau de bord | Administration SIRA",
};

export default function AdminDashboardPage() {
  const data = getAdminDashboard();
  const users = getAllUsers();
  const organizations = getOrganizations();
  const auditLogs = [...getAuditLogs()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const allJobs = getAllJobsAdmin();

  const revenue = data.payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const failedPayments = data.payments.filter((p) => p.status === "failed").length;

  const jobsByStatus = JOB_STATUSES.map((status) => ({
    label: JOB_STATUS_LABEL[status],
    value: allJobs.filter((j) => j.status === status).length,
  })).filter((row) => row.value > 0);

  const usersByRole = USER_ROLES.map((role) => ({
    label: USER_ROLE_LABEL[role],
    value: users.filter((u) => u.role === role).length,
  })).filter((row) => row.value > 0);

  /** Les trois files qui attendent une décision, rendues en lignes sobres. */
  const queues = [
    {
      title: "Offres à valider",
      count: data.jobsToValidate.length,
      description:
        "Offres déposées par une organisation en vérification légère. Publication après contrôle a priori.",
      href: "/admin/offres",
      linkLabel: "Ouvrir la file de modération",
      tone: "primary" as const,
    },
    {
      title: "Organisations à vérifier",
      count: data.pendingVerification.length,
      description:
        "Dossiers de vérification en attente d'instruction : justificatifs à contrôler, niveau à attribuer.",
      href: "/admin/recruteurs",
      linkLabel: "Instruire les dossiers",
      tone: "primary" as const,
    },
    {
      title: "Signalements ouverts",
      count: data.openReports.length,
      description:
        "Contenus ou comptes signalés par des utilisateurs. Une suspicion de fraude déclenche la procédure d'urgence.",
      href: "/admin/moderation",
      linkLabel: "Ouvrir la file de signalements",
      tone: "danger" as const,
    },
  ];

  return (
    <>
      <ZoneHeader
        zone="admin"
        title="Tableau de bord"
        description="Bonjour Boureima Traoré. Voici l'état de la plateforme au 12 septembre 2026, et ce qui attend une décision de votre part."
      />

      {/* ---- Files actionnables, en tête ---- */}
      <section>
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">À traiter en priorité</h2>
        <ul className="mt-3 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
          {queues.map((queue) => (
            <li key={queue.title} className="flex flex-wrap items-start gap-x-5 gap-y-2 py-4">
              <span className="w-10 shrink-0 text-[22px] font-semibold leading-tight tabular-nums text-[var(--color-text)]">
                {queue.count}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-semibold text-[var(--color-text)]">{queue.title}</p>
                  <Badge tone={queue.count === 0 ? "success" : queue.tone}>
                    {queue.count === 0 ? "À jour" : "À traiter"}
                  </Badge>
                </div>
                <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
                  {queue.description}
                </p>
              </div>
              <Link
                href={queue.href}
                className="shrink-0 text-[13px] font-medium text-[var(--color-primary)] hover:underline"
              >
                {queue.count === 0 ? "Consulter" : queue.linkLabel}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- Indicateurs ---- */}
      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Indicateurs de la plateforme</h2>
          <Link href="/admin/rapports" className="text-[13px] font-medium text-[var(--color-primary)] hover:underline">
            Voir les indicateurs détaillés
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Utilisateurs inscrits" value={formatInt(data.users)} />
          <Stat label="Candidats" value={formatInt(data.candidates)} />
          <Stat label="Recruteurs" value={formatInt(data.recruiters)} />
          <Stat
            label="Organisations"
            value={formatInt(data.organizations)}
            hint={`${organizations.filter((o) => o.verificationStatus === "verifie").length} vérifiées`}
          />
          <Stat
            label="Offres publiées"
            value={formatInt(data.publishedJobs)}
            hint={`sur ${allJobs.length} offres au total`}
          />
          <Stat
            label="Offres à valider"
            value={formatInt(data.jobsToValidate.length)}
            hint="File de contrôle a priori"
          />
          <Stat label="Signalements ouverts" value={formatInt(data.openReports.length)} />
          <Stat
            label="Coût IA cumulé"
            value={formatUsd(data.aiCostUsd)}
            hint={`${data.aiJobs.length} appels journalisés`}
          />
          <Stat
            label="Revenus encaissés"
            value={formatMoney(revenue)}
            hint={failedPayments > 0 ? `${failedPayments} paiement en échec` : "Aucun échec de paiement"}
          />
        </div>
      </section>

      {/* ---- Répartitions ---- */}
      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Offres par statut</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">Toutes origines confondues</p>
          <div className="mt-4">
            <BarChart items={jobsByStatus} />
          </div>
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Comptes par rôle</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
            Un compte peut appartenir à plusieurs organisations
          </p>
          <div className="mt-4">
            <BarChart items={usersByRole} tone="info" />
          </div>
        </div>
      </section>

      {/* ---- Détail des files ---- */}
      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-2">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Offres en attente de validation</h2>
              <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                Contrôle a priori des organisations en vérification légère
              </p>
            </div>
            <Link href="/admin/offres" className="text-[13px] font-medium text-[var(--color-primary)] hover:underline">
              Tout voir
            </Link>
          </div>
          {data.jobsToValidate.length === 0 ? (
            <p className="mt-4 text-[13px] text-[var(--color-text-muted)]">Aucune offre en attente. File à jour.</p>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
              {data.jobsToValidate.map((job) => (
                <li key={job.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-medium text-[var(--color-text)]">{job.title}</p>
                      <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                        {orgName(getOrganization(job.organizationId))} · {job.city} · déposée{" "}
                        {relativeDays(job.publishedAt)}
                      </p>
                    </div>
                    <Badge tone={JOB_STATUS_TONE[job.status]}>{JOB_STATUS_LABEL[job.status]}</Badge>
                  </div>
                  <AdminActions
                    className="mt-3"
                    subject={`l'offre « ${job.title} »`}
                    actions={[
                      { label: "Valider et publier", variant: "primary" },
                      { label: "Rejeter", variant: "danger" },
                    ]}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Organisations à vérifier</h2>
              <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                Niveau de vérification à attribuer
              </p>
            </div>
            <Link
              href="/admin/recruteurs"
              className="text-[13px] font-medium text-[var(--color-primary)] hover:underline"
            >
              Tout voir
            </Link>
          </div>
          <div className="mt-4 border-t border-[var(--color-border)]">
            <Table head={["Organisation", "Ville", "État", "Ancienneté"]} minWidth={520}>
              {data.pendingVerification.map((org) => (
                <Tr key={org.id}>
                  <Td className="font-medium">{orgName(org)}</Td>
                  <TdMuted>{org.city}</TdMuted>
                  <Td>
                    <Badge tone={VERIFICATION_TONE[org.verificationStatus]}>
                      {VERIFICATION_STATUS_LABEL[org.verificationStatus]}
                    </Badge>
                  </Td>
                  <TdMuted>{relativeDays(org.createdAt)}</TdMuted>
                </Tr>
              ))}
            </Table>
          </div>
        </div>
      </section>

      {/* ---- Signalements ouverts ---- */}
      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Signalements ouverts</h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
              Chaque signalement est instruit, puis tracé
            </p>
          </div>
          <Link
            href="/admin/moderation"
            className="text-[13px] font-medium text-[var(--color-primary)] hover:underline"
          >
            Ouvrir la modération
          </Link>
        </div>
        <Table head={["Objet", "Motif", "État", "Reçu"]} minWidth={620}>
          {data.openReports.map((report) => {
            const target =
              report.objectType === "organization"
                ? orgName(getOrganization(report.objectId))
                : (getJobById(report.objectId)?.title ?? report.objectId);
            return (
              <Tr key={report.id}>
                <Td className="font-medium">{target}</Td>
                <Td className="text-[13px] text-[var(--color-text-muted)]">{report.reason}</Td>
                <Td>
                  <Badge tone={REPORT_STATUS_TONE[report.status]}>{REPORT_STATUS_LABEL[report.status]}</Badge>
                </Td>
                <TdMuted>{relativeDays(report.createdAt)}</TdMuted>
              </Tr>
            );
          })}
        </Table>
      </section>

      {/* ---- Activité récente ---- */}
      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Activité récente</h2>
            <p className="mt-0.5 max-w-2xl text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
              Journal d&apos;audit : chaque décision d&apos;administration est horodatée et nominative
            </p>
          </div>
          <Link
            href="/admin/parametres"
            className="text-[13px] font-medium text-[var(--color-primary)] hover:underline"
          >
            Journaux complets
          </Link>
        </div>
        <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
          {auditLogs.map((log) => (
            <li key={log.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
              <div className="min-w-0">
                <p className="text-[13.5px] text-[var(--color-text)]">{log.action}</p>
                <p className="text-[12.5px] text-[var(--color-text-muted)]">
                  {log.actor} · {log.objectType} {log.objectId}
                </p>
              </div>
              <span className="shrink-0 text-[12px] text-[var(--color-text-subtle)]">
                {relativeDays(log.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
