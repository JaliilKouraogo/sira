/**
 * Back-office — file de modération [T §21.3].
 *
 * Trois entrées alimentent la file : les signalements d'utilisateurs, la
 * détection de doublons et le repérage de contenus suspects. Les deux
 * dernières sont des aides à la décision, jamais des décisions automatiques.
 *
 * Direction épurée : la procédure d'urgence n'est plus une bannière rouge
 * mais un bloc blanc au filet rouge, et les files sont des listes.
 */

import type { Metadata } from "next";
import { AdminActions } from "@/components/admin-actions";
import {
  REPORT_STATUS_LABEL,
  REPORT_STATUS_TONE,
  Table,
  Td,
  TdMuted,
  Tr,
  VERIFICATION_TONE,
  formatInt,
  getAllJobsAdmin,
  orgName,
} from "@/components/admin-kit";
import { IconAlert } from "@/components/icons";
import { IllustrationVerified } from "@/components/illustrations";
import { Alert, Badge, PageHeader, Stat, Tag, formatDate, relativeDays } from "@/components/ui";
import { getAuditLogs, getJobById, getOrganization, getReports, getUserById } from "@/data/queries";
import { APPLICATION_CHANNEL_LABEL, JOB_STATUS_LABEL, VERIFICATION_STATUS_LABEL } from "@/lib/enums";
import type { Job } from "@/lib/types";

export const metadata: Metadata = {
  title: "Modération | Administration SIRA",
};

/** Mots qui, dans une annonce, appellent une lecture humaine immédiate. */
const SUSPICIOUS_WORDS = ["frais", "caution", "avance", "versement", "paiement du dossier", "inscription payante"];

/** Décisions rendues, simulées comme le reste des actions de la démonstration. */
const DECISION_HISTORY: {
  id: string;
  object: string;
  decision: string;
  reason: string;
  actor: string;
  at: string;
}[] = [
  {
    id: "dec_01",
    object: "Organisation Clinique Les Palmiers",
    decision: "Compte suspendu",
    reason: "Entreprise non identifiable, justificatifs jamais déposés",
    actor: "Boureima Traoré",
    at: "2026-09-07",
  },
  {
    id: "dec_02",
    object: "Offre « Agent commercial, rémunération à la performance »",
    decision: "Offre dépubliée",
    reason: "Frais de dossier demandés au candidat",
    actor: "Boureima Traoré",
    at: "2026-09-08",
  },
  {
    id: "dec_03",
    object: "Signalement « Offre en double »",
    decision: "Signalement rejeté",
    reason: "Deux postes distincts sur deux sites, pas un doublon",
    actor: "Boureima Traoré",
    at: "2026-09-04",
  },
];

const norm = (value: string) => value.toLowerCase().trim();

/** Signaux de risque calculés sur une offre. Deux signaux ou plus la font remonter. */
function riskSignals(job: Job): string[] {
  const org = getOrganization(job.organizationId);
  const text = norm(`${job.title} ${job.summary} ${job.description} ${job.missions.join(" ")}`);
  const signals: string[] = [];

  if (!org || org.verificationStatus !== "verifie") {
    signals.push("Organisation non vérifiée");
  }
  if (job.applicationChannel === "externe") {
    signals.push("Candidature hors plateforme, non traçable");
  }
  if (!job.salaryMin && !job.salaryMax) {
    signals.push("Aucune rémunération annoncée");
  }
  if (job.description.length < 120) {
    signals.push("Fiche très courte");
  }
  if (SUSPICIOUS_WORDS.some((word) => text.includes(word))) {
    signals.push("Vocabulaire évoquant des frais au candidat");
  }
  if (!job.contact && !job.applicationTarget) {
    signals.push("Aucun contact de candidature");
  }
  return signals;
}

export default function AdminModerationPage() {
  const reports = getReports();
  const jobs = getAllJobsAdmin();
  const auditLogs = getAuditLogs();

  const open = reports.filter((r) => r.status === "ouvert" || r.status === "en_cours");

  // Doublons : même intitulé normalisé sur plusieurs offres encore actives.
  const activeJobs = jobs.filter((j) => j.status === "publiee" || j.status === "en_validation");
  const titleGroups = new Map<string, Job[]>();
  for (const job of activeJobs) {
    const key = norm(job.title);
    titleGroups.set(key, [...(titleGroups.get(key) ?? []), job]);
  }
  const duplicates = Array.from(titleGroups.values()).filter((group) => group.length > 1);

  // Contenus suspects : au moins deux signaux de risque sur la même offre.
  const suspicious = activeJobs
    .map((job) => ({ job, signals: riskSignals(job) }))
    .filter((row) => row.signals.length >= 2)
    .sort((a, b) => b.signals.length - a.signals.length);

  return (
    <>
      <PageHeader
        title="Modération"
        description="Ce qui doit être instruit par une personne : signalements reçus, doublons détectés et contenus qui présentent plusieurs signaux de risque."
      />

      {/* ---- Procédure d'urgence ---- */}
      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] border-l-2 border-l-[var(--color-danger)] px-4 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 text-[var(--color-danger)]">
            <IconAlert size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-[var(--color-danger)]">
              Procédure d&apos;urgence : fraude et hameçonnage
            </h2>
            <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-[var(--color-text-muted)]">
              Dès qu&apos;une fraude ou une tentative d&apos;hameçonnage est établie, la procédure s&apos;applique
              en bloc et sans attendre la réponse de l&apos;organisation. Le préjudice pour les candidats se compte
              en heures, pas en jours.
            </p>
            <ol className="mt-3 space-y-1.5">
              {[
                "Suspension immédiate de l'organisation : plus aucune connexion, plus aucune publication.",
                "Dépublication de toutes ses offres, y compris celles déjà en ligne et indexées.",
                "Notification de tous les candidats ayant postulé, avec la consigne de ne verser aucune somme et de signaler tout contact reçu.",
                "Conservation des pièces et du journal d'audit en vue d'un signalement aux autorités.",
            ].map((step, i) => (
              <li key={step} className="flex gap-2.5 text-[13px] leading-relaxed text-[var(--color-text)]">
                <span className="mt-0.5 shrink-0 font-mono text-[11.5px] text-[var(--color-danger)]">
                  {`0${i + 1}`}
                </span>
                <span>{step}</span>
              </li>
            ))}
            </ol>
            <AdminActions
              className="mt-4"
              subject="une organisation soupçonnée de fraude"
              actions={[
                { label: "Déclencher la procédure d'urgence", variant: "danger" },
                { label: "Consigner un signalement aux autorités", variant: "outline" },
              ]}
            />
          </div>
          <div className="hidden shrink-0 text-[var(--color-text-subtle)] lg:block">
            <IllustrationVerified size={160} accent="var(--color-zone-admin)" />
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Signalements ouverts" value={formatInt(open.length)} />
        <Stat label="Signalements reçus" value={formatInt(reports.length)} />
        <Stat label="Doublons détectés" value={formatInt(duplicates.length)} />
        <Stat
          label="Contenus à examiner"
          value={formatInt(suspicious.length)}
          hint="Au moins deux signaux de risque"
        />
      </div>

      {/* ---- Signalements ---- */}
      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Signalements ({reports.length})</h2>
        <ul className="mt-4 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
          {reports.map((report) => {
            const reporter = getUserById(report.reporterId);
            const job = report.objectType === "job" ? getJobById(report.objectId) : undefined;
            const org =
              report.objectType === "organization"
                ? getOrganization(report.objectId)
                : job
                  ? getOrganization(job.organizationId)
                  : undefined;
            return (
              <li key={report.id} className="py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-semibold text-[var(--color-text)]">{report.reason}</h3>
                    <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                      {job ? `Offre « ${job.title} »` : `Organisation ${orgName(org)}`} · signalé par{" "}
                      {reporter ? `${reporter.firstName} ${reporter.lastName}` : "un utilisateur"} ·{" "}
                      {relativeDays(report.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone={REPORT_STATUS_TONE[report.status]}>{REPORT_STATUS_LABEL[report.status]}</Badge>
                    {org ? (
                      <Badge tone={VERIFICATION_TONE[org.verificationStatus]}>
                        {VERIFICATION_STATUS_LABEL[org.verificationStatus]}
                      </Badge>
                    ) : null}
                  </div>
                </div>

                {report.detail ? (
                  <blockquote className="mt-3 rounded-r border-l-2 border-[var(--color-danger)] bg-[var(--color-surface-2)] px-3.5 py-2.5 text-[13px] leading-relaxed">
                    {report.detail}
                  </blockquote>
                ) : null}

                {job ? (
                  <dl className="mt-3 grid gap-2 text-[12.5px] sm:grid-cols-3">
                    <div>
                      <dt className="text-[var(--color-text-muted)]">Statut de l&apos;offre</dt>
                      <dd className="text-[var(--color-text)]">{JOB_STATUS_LABEL[job.status]}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--color-text-muted)]">Canal de candidature</dt>
                      <dd className="text-[var(--color-text)]">
                        {APPLICATION_CHANNEL_LABEL[job.applicationChannel]}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[var(--color-text-muted)]">Candidatures reçues</dt>
                      <dd className="text-[var(--color-text)]">{job.applicationCount}</dd>
                    </div>
                  </dl>
                ) : null}

                <AdminActions
                  className="mt-4"
                  subject={job ? `l'offre « ${job.title} »` : orgName(org)}
                  actions={[
                    { label: "Traiter", variant: "primary" },
                    { label: "Rejeter le signalement", variant: "outline" },
                    { label: "Suspendre le compte", variant: "danger" },
                  ]}
                />
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---- Doublons et contenus suspects ---- */}
      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Détection de doublons</h2>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
            Règle appliquée : intitulé identique sur deux offres actives, toutes organisations confondues
          </p>
          <div className="mt-4">
            {duplicates.length === 0 ? (
              <Alert tone="success" title="Aucun doublon détecté">
                Les {activeJobs.length} offres actives portent toutes un intitulé distinct. La règle reste passée à
                chaque publication et à chaque import de flux partenaire.
              </Alert>
            ) : (
              <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                {duplicates.map((group) => (
                  <li key={group[0].id} className="py-4">
                    <p className="text-[13.5px] font-medium text-[var(--color-text)]">{group[0].title}</p>
                    <ul className="mt-1.5 space-y-1">
                      {group.map((job) => (
                        <li key={job.id} className="text-[12.5px] text-[var(--color-text-muted)]">
                          {orgName(getOrganization(job.organizationId))} · {job.city} ·{" "}
                          {JOB_STATUS_LABEL[job.status]}
                        </li>
                      ))}
                    </ul>
                    <AdminActions
                      className="mt-3"
                      subject={`le doublon « ${group[0].title} »`}
                      actions={[
                        { label: "Fusionner", variant: "primary" },
                        { label: "Ce n'est pas un doublon", variant: "outline" },
                      ]}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Contenus suspects</h2>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
            Aide à la décision : les signaux ne suspendent rien, ils ordonnent la file
          </p>
          <div className="mt-4">
            {suspicious.length === 0 ? (
              <Alert tone="success" title="Aucun contenu suspect">
                Aucune offre active ne cumule deux signaux de risque.
              </Alert>
            ) : (
              <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                {suspicious.map(({ job, signals }) => (
                  <li key={job.id} className="py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium text-[var(--color-text)]">{job.title}</p>
                        <p className="truncate text-[12.5px] text-[var(--color-text-muted)]">
                          {orgName(getOrganization(job.organizationId))} · {job.city}
                        </p>
                      </div>
                      <Badge tone={signals.length >= 3 ? "danger" : "warning"}>
                        {signals.length} signaux
                      </Badge>
                    </div>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {signals.map((signal) => (
                        <li key={signal}>
                          <Tag>{signal}</Tag>
                        </li>
                      ))}
                    </ul>
                    <AdminActions
                      className="mt-3"
                      subject={`l'offre « ${job.title} »`}
                      actions={[
                        { label: "Traiter", variant: "primary" },
                        { label: "Écarter le signal", variant: "outline" },
                        { label: "Suspendre le compte", variant: "danger" },
                      ]}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* ---- Historique ---- */}
      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-2">
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Historique des décisions</h2>
          <p className="mt-0.5 mb-4 text-[12.5px] text-[var(--color-text-muted)]">
            Chaque décision est motivée et notifiée
          </p>
          <Table head={["Objet", "Décision", "Motif", "Date"]} minWidth={620}>
            {DECISION_HISTORY.map((entry) => (
              <Tr key={entry.id}>
                <Td className="max-w-[220px] font-medium">{entry.object}</Td>
                <Td>
                  <Badge tone={entry.decision.includes("rejeté") ? "neutral" : "danger"}>{entry.decision}</Badge>
                </Td>
                <Td className="text-[12.5px] text-[var(--color-text-muted)]">{entry.reason}</Td>
                <TdMuted>{formatDate(entry.at)}</TdMuted>
              </Tr>
            ))}
          </Table>
        </div>

        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Journal d&apos;audit</h2>
          <p className="mt-0.5 mb-4 text-[12.5px] text-[var(--color-text-muted)]">
            Toutes les actions d&apos;administration, automatiques comprises
          </p>
          <Table head={["Action", "Auteur", "Objet", "Date"]} minWidth={560}>
            {[...auditLogs]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((log) => (
                <Tr key={log.id}>
                  <Td className="font-medium">{log.action}</Td>
                  <TdMuted>{log.actor}</TdMuted>
                  <TdMuted>
                    {log.objectType} {log.objectId}
                  </TdMuted>
                  <TdMuted>{formatDate(log.createdAt)}</TdMuted>
                </Tr>
              ))}
          </Table>
        </div>
      </section>
    </>
  );
}
