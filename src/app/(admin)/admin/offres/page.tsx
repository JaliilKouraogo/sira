/**
 * Back-office — modération des offres [T §21.3].
 *
 * Deux régimes coexistent : contrôle a priori pour les organisations en
 * vérification légère (file « en validation »), contrôle a posteriori pour
 * les organisations vérifiées, dont les offres partent en ligne aussitôt.
 *
 * Direction épurée : la file de validation est une liste séparée par des
 * filets, les tableaux sont posés à même la page, et la couleur ne sert
 * qu'aux puces de statut et aux liens.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { AdminActions } from "@/components/admin-actions";
import {
  BarChart,
  JOB_STATUS_TONE,
  Table,
  Td,
  TdMuted,
  Tr,
  VERIFICATION_TONE,
  formatInt,
  getAllJobsAdmin,
  orgName,
} from "@/components/admin-kit";
import {
  Alert,
  Avatar,
  Badge,
  Field,
  PageHeader,
  Select,
  Stat,
  Tag,
  formatDate,
  relativeDays,
} from "@/components/ui";
import { getOrganization } from "@/data/queries";
import {
  JOB_STATUSES,
  JOB_STATUS_LABEL,
  OPPORTUNITY_TYPE_LABEL,
  VERIFICATION_STATUS_LABEL,
} from "@/lib/enums";

export const metadata: Metadata = {
  title: "Modération des offres | Administration SIRA",
};

/** Motifs de rejet normalisés : un rejet sans motif n'est pas notifiable au recruteur. */
const REJECTION_REASONS = [
  "Offre incomplète ou imprécise",
  "Organisation non vérifiée",
  "Frais demandés au candidat",
  "Mention discriminatoire",
  "Doublon d'une offre déjà en ligne",
  "Coordonnées de candidature invalides",
  "Hors du champ de la plateforme",
];

/**
 * Journal des décisions de modération. Simulé : la démonstration n'a pas de
 * backend, mais la forme est celle qui serait persistée — décision, motif,
 * auteur, horodatage.
 */
const MODERATION_HISTORY: {
  id: string;
  jobTitle: string;
  organization: string;
  decision: "Validée" | "Rejetée";
  reason?: string;
  actor: string;
  at: string;
}[] = [
  {
    id: "mod_01",
    jobTitle: "Chargé de clientèle particuliers",
    organization: "Banque Régionale du Faso",
    decision: "Validée",
    actor: "Boureima Traoré",
    at: "2026-09-11",
  },
  {
    id: "mod_02",
    jobTitle: "Agent commercial, rémunération à la performance",
    organization: "Cabinet Yenkoara Conseil",
    decision: "Rejetée",
    reason: "Frais demandés au candidat",
    actor: "Boureima Traoré",
    at: "2026-09-08",
  },
  {
    id: "mod_03",
    jobTitle: "Technicien de maintenance solaire",
    organization: "Énergie Solaire du Faso",
    decision: "Validée",
    actor: "Boureima Traoré",
    at: "2026-09-05",
  },
  {
    id: "mod_04",
    jobTitle: "Assistant administratif",
    organization: "Clinique Les Palmiers",
    decision: "Rejetée",
    reason: "Organisation non vérifiée",
    actor: "Boureima Traoré",
    at: "2026-09-02",
  },
];

export default function AdminJobsPage() {
  const jobs = getAllJobsAdmin();
  const toValidate = jobs.filter((j) => j.status === "en_validation");
  const published = jobs.filter((j) => j.status === "publiee");
  const rejected = jobs.filter((j) => j.status === "rejetee");

  const byStatus = JOB_STATUSES.map((status) => ({
    label: JOB_STATUS_LABEL[status],
    value: jobs.filter((j) => j.status === status).length,
  })).filter((row) => row.value > 0);

  /** Motif affiché sur une offre rejetée, retrouvé dans le journal de modération. */
  const rejectionReason = (title: string) =>
    MODERATION_HISTORY.find((h) => h.decision === "Rejetée" && h.jobTitle === title)?.reason;

  return (
    <>
      <PageHeader
        title="Modération des offres"
        description="La file de validation passe avant tout le reste : chaque jour d'attente est un jour sans candidature pour le recruteur comme pour les candidats."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Offres à valider" value={formatInt(toValidate.length)} />
        <Stat label="Offres publiées" value={formatInt(published.length)} />
        <Stat label="Offres rejetées" value={formatInt(rejected.length)} />
        <Stat label="Offres au total" value={formatInt(jobs.length)} />
      </div>

      {/* ---- File de validation ---- */}
      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">
          File de validation ({toValidate.length})
        </h2>
        {toValidate.length === 0 ? (
          <div className="mt-4">
            <Alert tone="success" title="File à jour">
              Aucune offre n&apos;attend de validation.
            </Alert>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
            {toValidate.map((job) => {
              const org = getOrganization(job.organizationId);
              return (
                <li key={job.id} className="py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar initials={org?.logoInitials ?? "??"} color={org?.logoColor} size={36} />
                      <div className="min-w-0">
                        <h3 className="text-[14px] font-semibold text-[var(--color-text)]">{job.title}</h3>
                        <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                          {orgName(org)} · {job.city} · {OPPORTUNITY_TYPE_LABEL[job.opportunityType]} · déposée{" "}
                          {relativeDays(job.publishedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone={JOB_STATUS_TONE[job.status]}>{JOB_STATUS_LABEL[job.status]}</Badge>
                      {org ? (
                        <Badge tone={VERIFICATION_TONE[org.verificationStatus]}>
                          {VERIFICATION_STATUS_LABEL[org.verificationStatus]}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <p className="mt-2.5 max-w-3xl text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                    {job.summary}
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {job.requiredSkills.slice(0, 6).map((skill) => (
                      <Tag key={skill}>{skill}</Tag>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,260px)_minmax(0,1fr)] sm:items-end">
                    <Field label="Motif en cas de rejet" htmlFor={`motif-${job.id}`}>
                      <Select id={`motif-${job.id}`} defaultValue="">
                        <option value="" disabled>
                          Choisir un motif
                        </option>
                        {REJECTION_REASONS.map((reason) => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <AdminActions
                      subject={`l'offre « ${job.title} »`}
                      actions={[
                        { label: "Valider et publier", variant: "primary" },
                        { label: "Rejeter", variant: "danger" },
                        { label: "Voir l'offre", variant: "outline" },
                      ]}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ---- Toutes les offres ---- */}
      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <div className="mb-4">
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Toutes les offres</h2>
            <p className="mt-0.5 max-w-2xl text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
              Le motif est affiché dès qu&apos;une offre est rejetée : il est notifié au recruteur et conservé
            </p>
          </div>
          <Table
            head={["Offre", "Organisation", "Statut", "Motif de rejet", "Publiée le", "Vues", "Candidatures"]}
            minWidth={1040}
          >
            {jobs.map((job) => {
              const org = getOrganization(job.organizationId);
              const reason = job.status === "rejetee" ? rejectionReason(job.title) : undefined;
              return (
                <Tr key={job.id}>
                  <Td className="max-w-[260px]">
                    <Link
                      href={`/offres/${job.slug}`}
                      className="truncate font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                    >
                      {job.title}
                    </Link>
                    <p className="truncate text-[12.5px] text-[var(--color-text-muted)]">
                      {job.city} · {OPPORTUNITY_TYPE_LABEL[job.opportunityType]}
                    </p>
                  </Td>
                  <TdMuted>{orgName(org)}</TdMuted>
                  <Td>
                    <Badge tone={JOB_STATUS_TONE[job.status]}>{JOB_STATUS_LABEL[job.status]}</Badge>
                  </Td>
                  <Td className="text-[13px] text-[var(--color-text-muted)]">
                    {job.status === "rejetee" ? (reason ?? "Motif non renseigné") : "—"}
                  </Td>
                  <TdMuted>{formatDate(job.publishedAt)}</TdMuted>
                  <TdMuted>{formatInt(job.viewCount)}</TdMuted>
                  <TdMuted>{formatInt(job.applicationCount)}</TdMuted>
                </Tr>
              );
            })}
          </Table>
        </div>

        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Répartition par statut</h2>
          <div className="mt-4">
            <BarChart items={byStatus} />
          </div>
        </div>
      </section>

      {/* ---- Historique des décisions ---- */}
      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Décisions de modération récentes</h2>
          <p className="mt-0.5 max-w-3xl text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
            Toute décision est nominative, motivée quand elle est défavorable, et notifiée au recruteur
          </p>
        </div>
        <Table head={["Offre", "Organisation", "Décision", "Motif", "Administrateur", "Date"]} minWidth={880}>
          {MODERATION_HISTORY.map((entry) => (
            <Tr key={entry.id}>
              <Td className="font-medium">{entry.jobTitle}</Td>
              <TdMuted>{entry.organization}</TdMuted>
              <Td>
                <Badge tone={entry.decision === "Validée" ? "success" : "danger"}>{entry.decision}</Badge>
              </Td>
              <Td className="text-[13px] text-[var(--color-text-muted)]">{entry.reason ?? "—"}</Td>
              <TdMuted>{entry.actor}</TdMuted>
              <TdMuted>{formatDate(entry.at)}</TdMuted>
            </Tr>
          ))}
        </Table>
      </section>
    </>
  );
}
