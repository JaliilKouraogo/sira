/**
 * Détail d'une offre, vue candidat — [T §6.3].
 *
 * L'écran accepte indifféremment l'identifiant (`job_01`) ou le slug.
 * Le panneau latéral porte le score et ses composantes, avec un lien vers
 * l'explication complète. `?action=preparer` ouvre le panneau de préparation
 * de candidature au-dessus de l'offre.
 *
 * Export statique : toutes les offres accessibles au candidat sont
 * pré-générées, par identifiant et par slug. L'adresse n'est pas lue côté
 * serveur, c'est `PreparationSlot` qui détecte `?action=preparer` dans le
 * navigateur.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CandidatePremiumCard } from "@/components/candidate-premium-card";
import {
  IconArrowRight,
  IconBriefcase,
  IconBuilding,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconMapPin,
} from "@/components/icons";
import { ScoreDisclaimer, ScoreRing, scoreLabel } from "@/components/score";
import {
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  ButtonLink,
  DataList,
  Progress,
  StatusChip,
  Tag,
  daysUntil,
  formatDate,
  relativeDays,
} from "@/components/ui";
import {
  getApplications,
  getJobBySlug,
  getJobOrganization,
  getSavedJobs,
  getScore,
  getUsageCounters,
} from "@/data/queries";
import {
  APPLICATION_CHANNEL_LABEL,
  CONTRACT_TYPE_LABEL,
  JOB_ORIGIN_LABEL,
  JOB_STATUS_ACCEPTS_APPLICATIONS,
  JOB_STATUS_LABEL,
  OPPORTUNITY_TYPE_LABEL,
  ORGANIZATION_TYPE_LABEL,
  PREPARATION_STATUS_LABEL,
  REVIEW_STATUS_CANDIDATE_LABEL,
  SCORE_COMPONENT_LABEL,
  VERIFICATION_STATUS_LABEL,
  WORK_MODE_LABEL,
  formatSalaryRange,
  type ScoreComponent,
} from "@/lib/enums";
import type { MatchScore } from "@/lib/types";
import { CandidateJobActions } from "./job-actions";
import { PreparationSlot } from "./preparation-slot-client";
import { candidateJobParams } from "./static-params";

export const dynamicParams = false;

export function generateStaticParams(): { id: string }[] {
  return candidateJobParams();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const job = getJobBySlug(id);
  if (!job) return { title: "Offre introuvable" };
  return { title: job.title, description: job.summary };
}

export default async function CandidateJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJobBySlug(id);
  if (!job) notFound();

  const organization = getJobOrganization(job);
  const score = getScore(job.id);
  const saved = getSavedJobs().some((s) => s.job.id === job.id);
  const application = getApplications().find((a) => a.jobId === job.id);
  const prepQuota = getUsageCounters().find((u) => u.feature === "applications_prep");
  const remainingDays = daysUntil(job.deadline);
  const canApply = JOB_STATUS_ACCEPTS_APPLICATIONS[job.status] && remainingDays >= 0;
  const anonymised = job.visibility === "anonymisee";
  const orgName = anonymised
    ? "Entreprise confidentielle"
    : (organization?.tradeName ?? organization?.legalName ?? "Organisation");
  const components = score
    ? (Object.entries(score.breakdown) as [ScoreComponent, MatchScore["breakdown"][ScoreComponent]][])
    : [];

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Mon espace", href: "/mon-espace" },
          { label: "Opportunités", href: "/mon-espace/opportunites" },
          { label: job.title },
        ]}
      />

      {/* ---- Panneau de préparation, ouvert par ?action=preparer ---- */}
      <Suspense fallback={null}>
        <PreparationSlot
          jobTitle={job.title}
          consumed={prepQuota?.consumed ?? 0}
          limit={prepQuota?.limit ?? null}
          period={prepQuota?.period ?? "ce mois"}
          applicationsHref={application ? `/mon-espace/candidatures/${application.id}` : "/mon-espace/candidatures"}
        />
      </Suspense>

      {/* ---- En-tête de l'offre ---- */}
      <header className="mb-6 border-b border-[var(--color-border)] pb-6">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar
            initials={anonymised ? "??" : (organization?.logoInitials ?? "??")}
            color={anonymised ? "var(--color-text-subtle)" : organization?.logoColor}
            size={56}
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-semibold leading-snug text-[var(--color-text)]">{job.title}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] text-[var(--color-text-muted)]">
              <span className="font-medium text-[var(--color-text)]">{orgName}</span>
              {organization?.verificationStatus === "verifie" && !anonymised ? (
                <span className="inline-flex items-center gap-1 text-[var(--color-success)]">
                  <IconCheckCircle size={14} />
                  Recruteur vérifié
                </span>
              ) : null}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-[var(--color-text-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <IconMapPin size={14} />
                {job.city}, {job.country}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IconBriefcase size={14} />
                {CONTRACT_TYPE_LABEL[job.contractType]}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IconClock size={14} />
                Publiée {relativeDays(job.publishedAt)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Badge tone="primary">{OPPORTUNITY_TYPE_LABEL[job.opportunityType]}</Badge>
              <Tag>{WORK_MODE_LABEL[job.workMode]}</Tag>
              <Tag>{formatSalaryRange(job.salaryMin, job.salaryMax)}</Tag>
              {job.status !== "publiee" ? (
                <StatusChip label={JOB_STATUS_LABEL[job.status]} tone="danger" />
              ) : remainingDays < 0 ? (
                <StatusChip label="Date limite dépassée" tone="danger" />
              ) : remainingDays <= 7 ? (
                <Badge tone="warning">
                  {remainingDays === 0 ? "Dernier jour pour postuler" : `Plus que ${remainingDays} jours`}
                </Badge>
              ) : null}
              {job.origin !== "native" ? <Badge tone="neutral">{JOB_ORIGIN_LABEL[job.origin]}</Badge> : null}
            </div>
          </div>
        </div>

        {application ? (
          <div className="mt-4">
            <Alert tone="info" title="Vous avez déjà un dossier pour cette offre">
              État de la préparation&nbsp;: {PREPARATION_STATUS_LABEL[application.preparationStatus].toLowerCase()}
              {application.reviewStatus
                ? `, suivi : ${REVIEW_STATUS_CANDIDATE_LABEL[application.reviewStatus].toLowerCase()}`
                : ""}
              .{" "}
              <Link
                href={`/mon-espace/candidatures/${application.id}`}
                className="font-medium text-[var(--color-primary)] hover:underline"
              >
                Ouvrir ma candidature
              </Link>
            </Alert>
          </div>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-x-10 lg:grid-cols-3">
        {/* ================= Panneau latéral : score et actions ================= */}
        <aside className="order-1 lg:order-2 lg:border-l lg:border-[var(--color-border)] lg:pl-8">
          {/* ---- Score de compatibilité ---- */}
          <section className="border-b border-[var(--color-border)] pb-7 lg:pt-1">
            <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Votre compatibilité</h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
              Calculée à partir de votre profil SIRA.
            </p>
            {score ? (
              <div className="mt-4">
                <div className="flex flex-col items-center text-center">
                  <ScoreRing score={score.score} size={132} />
                  <p className="mt-2 text-[14px] font-semibold text-[var(--color-text)]">{scoreLabel(score.score)}</p>
                  <p className="mt-0.5 text-[12px] text-[var(--color-text-muted)]">
                    Calculé {relativeDays(score.computedAt)}
                  </p>
                </div>

                <div className="mt-4 space-y-2.5">
                  {components.map(([key, item]) => (
                    <div key={key}>
                      <p className="mb-1 flex items-baseline justify-between gap-2 text-[12.5px]">
                        <span className="text-[var(--color-text)]">
                          {SCORE_COMPONENT_LABEL[key]}
                          <span className="ml-1 text-[11px] text-[var(--color-text-subtle)]">
                            poids {Math.round(item.weight * 100)} %
                          </span>
                        </span>
                        <span className="tabular-nums text-[var(--color-text-muted)]">{item.score} %</span>
                      </p>
                      <Progress
                        value={item.score}
                        tone={
                          item.score >= 75
                            ? "success"
                            : item.score >= 50
                              ? "accent"
                              : item.score >= 35
                                ? "warning"
                                : "danger"
                        }
                        label={SCORE_COMPONENT_LABEL[key]}
                      />
                    </div>
                  ))}
                </div>

                {score.blockingCriteria.length > 0 ? (
                  <div className="mt-4">
                    <Alert tone="danger" title="Critère indispensable non satisfait">
                      {score.blockingCriteria.join(", ")}.
                    </Alert>
                  </div>
                ) : null}

                <div className="mt-4">
                  <ScoreDisclaimer model={score.model} computedAt={score.computedAt} />
                </div>

                <ButtonLink
                  href={`/mon-espace/opportunites/${job.id}/score`}
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                >
                  Voir l&apos;explication complète
                  <IconArrowRight size={15} />
                </ButtonLink>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                  Le score de compatibilité de cette offre n&apos;a pas encore été calculé pour votre profil. Complétez
                  votre profil pour le déclencher.
                </p>
                <ButtonLink href="/mon-espace/profil" variant="outline" size="sm" className="mt-3 w-full">
                  Compléter mon profil
                </ButtonLink>
              </div>
            )}
          </section>

          {/* ---- Actions ---- */}
          <section className="border-b border-[var(--color-border)] py-7">
            <h2 className="mb-3 text-[14px] font-semibold text-[var(--color-text)]">Agir sur cette offre</h2>
            <CandidateJobActions
              jobId={job.id}
              jobTitle={job.title}
              preparationHref={`/mon-espace/opportunites/${job.id}?action=preparer`}
              channel={job.applicationChannel}
              canApply={canApply}
              initiallySaved={saved}
            />
            {prepQuota ? (
              <p className="mt-3 border-t border-[var(--color-border)] pt-3 text-[12px] leading-relaxed text-[var(--color-text-subtle)]">
                Plan Gratuit&nbsp;: {prepQuota.consumed} préparation sur {prepQuota.limit ?? "illimité"} utilisée{" "}
                {prepQuota.period.toLowerCase()}.
              </p>
            ) : null}
          </section>

          {/* ---- L'organisation ---- */}
          {organization && !anonymised ? (
            <section className="border-b border-[var(--color-border)] py-7">
              <h2 className="text-[14px] font-semibold text-[var(--color-text)]">L&apos;organisation</h2>
              <div className="mt-3">
                <div className="flex items-center gap-3">
                  <Avatar initials={organization.logoInitials} color={organization.logoColor} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-[var(--color-text)]">
                      {organization.tradeName ?? organization.legalName}
                    </p>
                    <p className="truncate text-[12.5px] text-[var(--color-text-muted)]">
                      {ORGANIZATION_TYPE_LABEL[organization.type]}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                  {organization.description}
                </p>
                <dl className="mt-3 space-y-1.5 text-[12.5px]">
                  <div className="flex gap-2">
                    <dt className="text-[var(--color-text-muted)]">Secteur</dt>
                    <dd className="text-[var(--color-text)]">{organization.sector}</dd>
                  </div>
                  {organization.size ? (
                    <div className="flex gap-2">
                      <dt className="text-[var(--color-text-muted)]">Effectif</dt>
                      <dd className="text-[var(--color-text)]">{organization.size}</dd>
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <dt className="text-[var(--color-text-muted)]">Vérification</dt>
                    <dd className="text-[var(--color-text)]">
                      {VERIFICATION_STATUS_LABEL[organization.verificationStatus]}
                    </dd>
                  </div>
                </dl>
                <ButtonLink
                  href={`/mon-espace/opportunites?entreprise=${organization.id}`}
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                >
                  <IconBuilding size={15} />
                  Ses autres offres
                </ButtonLink>
              </div>
            </section>
          ) : anonymised ? (
            <section className="border-b border-[var(--color-border)] py-7">
              <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Entreprise confidentielle</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                Le recruteur a choisi de masquer son identité à ce stade. Elle vous sera communiquée si votre
                candidature avance.
              </p>
            </section>
          ) : null}

          <div className="py-7">
            <CandidatePremiumCard
              title="Préparer l'entretien de ce poste"
              description="Questions probables, réponses structurées et simulation d'entretien pour cette offre."
              features={["Simulation d'entretien", "Analyse de vos points faibles", "Coach carrière dédié"]}
            />
          </div>
        </aside>

        {/* ================= Contenu de l'offre ================= */}
        <div className="order-2 lg:order-1 lg:col-span-2">
          <section className="border-b border-[var(--color-border)] pb-7 lg:pt-1">
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Le poste</h2>
            <p className="mt-2 text-[14px] font-medium leading-relaxed text-[var(--color-text)]">{job.summary}</p>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">{job.description}</p>

            {job.missions.length > 0 ? (
              <>
                <h3 className="mt-5 text-[14px] font-semibold text-[var(--color-text)]">Missions</h3>
                <ul className="mt-2 space-y-1.5">
                  {job.missions.map((m) => (
                    <li key={m} className="flex items-start gap-2.5 text-[13.5px] text-[var(--color-text-muted)]">
                      <span
                        className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]"
                        aria-hidden
                      />
                      <span className="min-w-0">{m}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {job.responsibilities.length > 0 ? (
              <>
                <h3 className="mt-5 text-[14px] font-semibold text-[var(--color-text)]">Responsabilités</h3>
                <ul className="mt-2 space-y-1.5">
                  {job.responsibilities.map((r) => (
                    <li key={r} className="flex items-start gap-2.5 text-[13.5px] text-[var(--color-text-muted)]">
                      <span
                        className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]"
                        aria-hidden
                      />
                      <span className="min-w-0">{r}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>

          <section className="border-b border-[var(--color-border)] py-7">
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Profil recherché</h2>

            {job.blockingCriteria.length > 0 ? (
              <div className="mt-3">
                <Alert tone="danger" title="Critères indispensables">
                  <ul className="ml-4 list-disc space-y-0.5">
                    {job.blockingCriteria.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                  <p className="mt-1.5">
                    Sans ces critères, votre candidature ne peut pas être retenue, quelle que soit la qualité du reste
                    du dossier.
                  </p>
                </Alert>
              </div>
            ) : null}

            <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-wide text-[var(--color-text-subtle)]">
              Compétences requises
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {job.requiredSkills.map((s) => (
                <Badge key={s} tone="primary">
                  {s}
                </Badge>
              ))}
            </div>

            {job.niceToHaveSkills.length > 0 ? (
              <>
                <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-wide text-[var(--color-text-subtle)]">
                  Compétences appréciées
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {job.niceToHaveSkills.map((s) => (
                    <Tag key={s}>{s}</Tag>
                  ))}
                </div>
              </>
            ) : null}

            <div className="mt-4">
              <DataList
                rows={[
                  { label: "Niveau d'études", value: job.educationLevel },
                  {
                    label: "Expérience demandée",
                    value:
                      job.experienceYears === 0
                        ? "Débutant accepté"
                        : `${job.experienceYears} an${job.experienceYears > 1 ? "s" : ""} minimum`,
                  },
                  {
                    label: "Langues",
                    value: job.languages.map((l) => `${l.name} (${l.level.toLowerCase()})`).join(", "),
                  },
                ]}
              />
            </div>
          </section>

          <section className="border-b border-[var(--color-border)] py-7">
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Conditions et candidature</h2>
            <div className="mt-3">
              <DataList
                rows={[
                  { label: "Type d'opportunité", value: OPPORTUNITY_TYPE_LABEL[job.opportunityType] },
                  { label: "Type de contrat", value: CONTRACT_TYPE_LABEL[job.contractType] },
                  { label: "Mode de travail", value: WORK_MODE_LABEL[job.workMode] },
                  { label: "Lieu", value: `${job.city}, ${job.country}` },
                  ...(job.department ? [{ label: "Service", value: job.department }] : []),
                  { label: "Rémunération", value: formatSalaryRange(job.salaryMin, job.salaryMax) },
                  {
                    label: "Date limite",
                    value: (
                      <span className={remainingDays >= 0 && remainingDays <= 7 ? "text-[var(--color-warning)]" : ""}>
                        {formatDate(job.deadline)}
                        {remainingDays >= 0 ? ` (dans ${remainingDays} jour${remainingDays > 1 ? "s" : ""})` : " (dépassée)"}
                      </span>
                    ),
                  },
                  {
                    label: "Documents à fournir",
                    value: (
                      <ul className="space-y-1">
                        {job.requiredDocuments.map((d) => (
                          <li key={d} className="flex items-start gap-2">
                            <span className="mt-0.5 shrink-0 text-[var(--color-success)]" aria-hidden>
                              <IconCheck size={14} />
                            </span>
                            <span className="min-w-0">{d}</span>
                          </li>
                        ))}
                      </ul>
                    ),
                  },
                  {
                    label: "Canal de candidature",
                    value: (
                      <>
                        {APPLICATION_CHANNEL_LABEL[job.applicationChannel]}
                        {job.applicationTarget ? (
                          <span className="block text-[12.5px] text-[var(--color-text-muted)]">
                            {job.applicationTarget}
                          </span>
                        ) : null}
                      </>
                    ),
                  },
                  ...(job.contact ? [{ label: "Contact", value: job.contact }] : []),
                  { label: "Origine de l'offre", value: JOB_ORIGIN_LABEL[job.origin] },
                  { label: "Publiée le", value: `${formatDate(job.publishedAt)} (${relativeDays(job.publishedAt)})` },
                  {
                    label: "Activité",
                    value: `${job.viewCount} consultations, ${job.applicationCount} candidatures`,
                  },
                ]}
              />
            </div>
            {job.sourceUrl ? (
              <p className="mt-3 text-[12.5px] text-[var(--color-text-muted)]">
                Offre relayée depuis une source partenaire&nbsp;: {job.sourceUrl}
              </p>
            ) : null}
          </section>

          <div className="py-7">
            <Alert tone="neutral" title="Vigilance">
              SIRA ne demande jamais d&apos;argent pour postuler. Si cette offre exige un paiement ou des données
              bancaires, signalez-la depuis le panneau d&apos;actions.
            </Alert>
          </div>
        </div>
      </div>
    </>
  );
}
