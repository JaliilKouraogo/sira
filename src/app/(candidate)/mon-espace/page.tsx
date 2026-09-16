/**
 * Tableau de bord candidat — [T §6.1].
 *
 * Les neuf blocs prescrits : salutation, complétude du profil, compteur de
 * nouvelles opportunités, top 3 des offres recommandées avec score,
 * candidatures en cours, action IA recommandée, formation recommandée,
 * liaison WhatsApp, abonnement et consommation des quotas.
 *
 * Le candidat ne voit jamais l'état interne du recruteur : la projection
 * REVIEW_STATUS_CANDIDATE_LABEL est la seule source des libellés de suivi.
 *
 * Direction épurée : plus d'empilement de cartes. Les blocs sont séparés par
 * des filets de 1 pixel, la colonne latérale reste sobre, et la couleur ne
 * sert qu'aux actions, aux scores et aux signaux.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { CandidatePremiumCard } from "@/components/candidate-premium-card";
import {
  IconArrowRight,
  IconBell,
  IconBookmark,
  IconBriefcase,
  IconCheck,
  IconClock,
  IconGraduation,
  IconSparkles,
  IconTarget,
  IconWhatsApp,
} from "@/components/icons";
import {
  IllustrationNoApplications,
  IllustrationNoResults,
  ZoneHeader,
} from "@/components/illustrations";
import { JobCard } from "@/components/job-card";
import {
  Alert,
  Badge,
  ButtonLink,
  EmptyState,
  Progress,
  StatusChip,
  cx,
  daysUntil,
  relativeDays,
} from "@/components/ui";
import {
  getCandidateDashboard,
  getJobById,
  getJobOrganization,
  getResumes,
  getSavedJobs,
} from "@/data/queries";
import {
  PLAN_LABEL,
  PREPARATION_STATUS_LABEL,
  REVIEW_STATUS_CANDIDATE_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
  TRAINING_ACCESS_LABEL,
  TRAINING_FORMAT_LABEL,
  type PreparationStatus,
} from "@/lib/enums";

export const metadata: Metadata = {
  title: "Tableau de bord",
  description: "Votre recherche d'emploi en un coup d'œil : opportunités, candidatures et progression.",
};

/**
 * Détail de la complétude du profil : ce qui est déjà renseigné et ce qui
 * manque pour atteindre 100 %. Les gains des éléments manquants complètent
 * exactement le score de complétude renvoyé par la couche de données.
 */
function completionItems(
  profile: ReturnType<typeof getCandidateDashboard>["profile"],
  resumeCount: number,
) {
  const englishLevel = profile.languages.find((l) => l.name === "Anglais")?.level;
  return [
    { label: "Identité et titre professionnel", gain: 12, done: profile.headline.length > 0, hint: undefined },
    { label: "Expériences professionnelles", gain: 18, done: profile.experiences.length >= 2, hint: undefined },
    { label: "Formations et diplômes", gain: 12, done: profile.educations.length >= 1, hint: undefined },
    { label: "Compétences techniques", gain: 16, done: profile.hardSkills.length >= 5, hint: undefined },
    { label: "CV téléversé et analysé", gain: 12, done: resumeCount >= 1, hint: undefined },
    { label: "Préférences de recherche", gain: 5, done: profile.contractTypes.length >= 1, hint: undefined },
    { label: "Prétentions salariales", gain: 3, done: profile.salaryExpectation != null, hint: undefined },
    {
      label: "Photo de profil",
      gain: 8,
      done: Boolean(profile.photoUrl),
      hint: "Un profil avec photo est consulté plus souvent par les recruteurs vérifiés.",
    },
    {
      label: "Compétences comportementales",
      gain: 7,
      done: profile.softSkills.length >= 5,
      hint: `${profile.softSkills.length} sur 5 renseignées.`,
    },
    {
      label: "Niveau d'anglais professionnel",
      gain: 7,
      done:
        englishLevel === "Professionnel" || englishLevel === "Courant" || englishLevel === "Langue maternelle",
      hint: englishLevel
        ? `Niveau ${englishLevel.toLowerCase()} déclaré, plusieurs offres demandent mieux.`
        : undefined,
    },
  ];
}

/** Message de l'action IA recommandée, selon l'état de préparation du dossier. */
const PREPARATION_CALL: Record<PreparationStatus, { title: (t: string) => string; cta: string; body: string }> = {
  brouillon: {
    title: (t) => `Votre candidature pour « ${t} » est restée en brouillon`,
    cta: "Reprendre la préparation",
    body: "L'assistant peut générer votre CV adapté, votre lettre et votre e-mail à partir de votre profil.",
  },
  generee: {
    title: (t) => `Vos documents pour « ${t} » viennent d'être générés`,
    cta: "Relire mes documents",
    body: "Relisez chaque document : rien ne part tant que vous ne l'avez pas validé.",
  },
  a_verifier: {
    title: (t) => `Votre dossier pour « ${t} » attend votre vérification`,
    cta: "Vérifier mon dossier",
    body: "L'assistant a préparé vos pièces. Vérifiez-les, corrigez ce qui doit l'être, puis validez l'envoi.",
  },
  validee: {
    title: (t) => `Votre dossier pour « ${t} » est validé, il ne reste qu'à l'envoyer`,
    cta: "Ouvrir ma candidature",
    body: "Vos documents sont prêts. L'envoi reste déclenché par vous, jamais automatiquement.",
  },
  envoyee: {
    title: (t) => `Votre candidature pour « ${t} » a été envoyée`,
    cta: "Suivre ma candidature",
    body: "Vous serez prévenue dès que le recruteur fera évoluer votre dossier.",
  },
};

const PREPARATION_TONE: Record<PreparationStatus, "neutral" | "primary" | "accent" | "success" | "warning"> = {
  brouillon: "neutral",
  generee: "primary",
  a_verifier: "warning",
  validee: "success",
  envoyee: "primary",
};

/** Titre de bloc du tableau de bord, posé sur un filet. */
function BlockTitle({
  id,
  children,
  action,
}: {
  id?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
      <h2 id={id} className="text-[17px] font-semibold text-[var(--color-text)]">
        {children}
      </h2>
      {action}
    </div>
  );
}

export default function CandidateDashboardPage() {
  const dashboard = getCandidateDashboard();
  const { profile, user, completion, newJobsCount, recommended, activeApplications } = dashboard;
  const saved = getSavedJobs();
  const items = completionItems(profile, getResumes().length);
  const missing = items.filter((i) => !i.done);
  const filled = items.filter((i) => i.done);

  // Action IA la plus urgente : un dossier à vérifier passe avant tout le reste.
  const order: PreparationStatus[] = ["a_verifier", "generee", "validee", "brouillon"];
  const pending = order
    .map((status) => dashboard.applications.find((a) => a.preparationStatus === status))
    .find((a) => a !== undefined);
  const pendingJob = pending ? getJobById(pending.jobId) : undefined;
  const call = pending ? PREPARATION_CALL[pending.preparationStatus] : undefined;

  const training = dashboard.recommendedTraining;
  const whatsappQuota = dashboard.usage.find((u) => u.feature === "whatsapp_notifications");

  const counters = [
    {
      label: "Nouvelles opportunités",
      value: newJobsCount,
      hint: "Publiées cette semaine",
      icon: <IconBriefcase size={14} />,
    },
    {
      label: "Candidatures en cours",
      value: activeApplications.length,
      hint: `${dashboard.applications.length} au total`,
      icon: <IconTarget size={14} />,
    },
    {
      label: "Offres enregistrées",
      value: saved.length,
      hint: "À reprendre quand vous voulez",
      icon: <IconBookmark size={14} />,
    },
    {
      label: "Notifications non lues",
      value: dashboard.unread,
      hint: "Dans l'application",
      icon: <IconBell size={14} />,
    },
  ];

  return (
    <>
      {/* ---- Salutation ---- */}
      <ZoneHeader
        zone="candidate"
        title={`Bonjour ${user.firstName}`}
        description={`${profile.headline}. Voici où en est votre recherche aujourd'hui.`}
      />

      {/* ---- Compteurs, dont les nouvelles opportunités ---- */}
      <dl className="grid grid-cols-2 border-y border-[var(--color-border)] sm:grid-cols-4 sm:divide-x sm:divide-[var(--color-border)]">
        {counters.map((c) => (
          <div key={c.label} className="px-0 py-4 sm:px-4 sm:first:pl-0">
            <dt className="flex items-center gap-1.5 text-[12.5px] text-[var(--color-text-muted)]">
              <span className="text-[var(--color-text-subtle)]" aria-hidden>
                {c.icon}
              </span>
              {c.label}
            </dt>
            <dd className="mt-1 text-[26px] font-semibold leading-none tabular-nums text-[var(--color-text)]">
              {c.value}
            </dd>
            <p className="mt-1.5 text-[12px] text-[var(--color-text-subtle)]">{c.hint}</p>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 gap-x-10 lg:grid-cols-3">
        {/* ================= Colonne principale ================= */}
        <div className="lg:col-span-2">
          {/* ---- Action IA recommandée ---- */}
          {pending && pendingJob && call ? (
            <section aria-labelledby="action-ia" className="border-b border-[var(--color-border)] py-7">
              <p className="flex items-center gap-1.5 text-[11.5px] font-medium uppercase tracking-wider text-[var(--color-primary)]">
                <IconSparkles size={13} />
                Action recommandée par l&apos;assistant
              </p>
              <h2 id="action-ia" className="mt-2.5 text-[17px] font-semibold leading-snug text-[var(--color-text)]">
                {call.title(pendingJob.title)}
              </h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">{call.body}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <StatusChip
                  label={PREPARATION_STATUS_LABEL[pending.preparationStatus]}
                  tone={PREPARATION_TONE[pending.preparationStatus]}
                />
                <Badge tone="neutral">
                  {pending.documents.length} document{pending.documents.length > 1 ? "s" : ""} préparé
                  {pending.documents.length > 1 ? "s" : ""}
                </Badge>
                <Badge tone="neutral" icon={<IconClock size={12} />}>
                  Mise à jour {relativeDays(pending.updatedAt)}
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink href={`/mon-espace/candidatures/${pending.id}`} size="sm">
                  {call.cta}
                  <IconArrowRight size={15} />
                </ButtonLink>
                <ButtonLink href={`/mon-espace/opportunites/${pendingJob.id}`} variant="outline" size="sm">
                  Revoir l&apos;offre
                </ButtonLink>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-[var(--color-text-subtle)]">
                Aucun document n&apos;est envoyé sans votre validation explicite.
              </p>
            </section>
          ) : null}

          {/* ---- Complétude du profil ---- */}
          <section aria-labelledby="completude" className="border-b border-[var(--color-border)] py-7">
            <BlockTitle
              id="completude"
              action={
                <span className="text-[20px] font-semibold tabular-nums text-[var(--color-text)]">{completion} %</span>
              }
            >
              Complétude de mon profil
            </BlockTitle>
            <p className="mb-3 text-[12.5px] text-[var(--color-text-muted)]">
              Un profil complet améliore vos scores de compatibilité et votre visibilité.
            </p>
            <Progress value={completion} tone="primary" label="Complétude du profil" />
            <p className="mt-2.5 text-[13px] text-[var(--color-text-muted)]">
              {filled.length} rubrique{filled.length > 1 ? "s" : ""} sur {items.length} renseignée
              {filled.length > 1 ? "s" : ""}.{" "}
              {missing.length > 0
                ? `Il vous manque ${missing.length} élément${missing.length > 1 ? "s" : ""} pour atteindre 100 %.`
                : "Votre profil est complet."}
            </p>

            {missing.length > 0 ? (
              <ul className="mt-4 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                {missing.map((m) => (
                  <li key={m.label} className="flex items-start gap-3 py-2.5">
                    <span
                      className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--color-border-strong)] text-[10px] leading-none text-[var(--color-text-subtle)]"
                      aria-hidden
                    >
                      +
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] text-[var(--color-text)]">{m.label}</span>
                      {m.hint ? (
                        <span className="mt-0.5 block text-[12.5px] text-[var(--color-text-muted)]">{m.hint}</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-[12.5px] font-medium tabular-nums text-[var(--color-accent-text)]">
                      + {m.gain} %
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            <ButtonLink href="/mon-espace/profil" variant="outline" size="sm" className="mt-4">
              Compléter mon profil
              <IconArrowRight size={15} />
            </ButtonLink>
          </section>

          {/* ---- Top 3 des offres recommandées ---- */}
          <section aria-labelledby="recommandations" className="border-b border-[var(--color-border)] py-7">
            <BlockTitle
              id="recommandations"
              action={
                <Link
                  href="/mon-espace/opportunites"
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--color-primary)] hover:underline"
                >
                  Toutes les opportunités
                  <IconArrowRight size={14} />
                </Link>
              }
            >
              Offres recommandées pour vous
            </BlockTitle>
            {recommended.length > 0 ? (
              <div className="space-y-3">
                {recommended.map(({ job, score }) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    organization={getJobOrganization(job)}
                    score={score}
                    href={`/mon-espace/opportunites/${job.id}`}
                    saved={saved.some((s) => s.job.id === job.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<IllustrationNoResults size={170} accent="var(--color-zone-candidate)" />}
                title="Aucune recommandation pour le moment"
                description="Complétez votre profil pour que l'assistant puisse calculer vos scores de compatibilité."
                action={
                  <ButtonLink href="/mon-espace/profil" size="sm">
                    Compléter mon profil
                  </ButtonLink>
                }
              />
            )}
          </section>

          {/* ---- Candidatures en cours ---- */}
          <section aria-labelledby="candidatures" className="py-7 lg:border-b lg:border-[var(--color-border)]">
            <BlockTitle
              id="candidatures"
              action={
                <Link
                  href="/mon-espace/candidatures"
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--color-primary)] hover:underline"
                >
                  Toutes mes candidatures
                  <IconArrowRight size={14} />
                </Link>
              }
            >
              Candidatures en cours
            </BlockTitle>
            {activeApplications.length > 0 ? (
              <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                {activeApplications.map((app) => {
                  const job = getJobById(app.jobId);
                  const organization = job ? getJobOrganization(job) : undefined;
                  const remaining = job ? daysUntil(job.deadline) : -1;
                  return (
                    <li key={app.id} className="py-3.5">
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                        <div className="min-w-0">
                          <Link
                            href={`/mon-espace/candidatures/${app.id}`}
                            className="text-[14px] font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)]"
                          >
                            {job?.title ?? "Offre retirée"}
                          </Link>
                          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                            {organization?.tradeName ?? organization?.legalName ?? "Organisation"}
                            {" · mise à jour "}
                            {relativeDays(app.updatedAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusChip
                            label={PREPARATION_STATUS_LABEL[app.preparationStatus]}
                            tone={PREPARATION_TONE[app.preparationStatus]}
                          />
                          {app.reviewStatus ? (
                            <StatusChip label={REVIEW_STATUS_CANDIDATE_LABEL[app.reviewStatus]} tone="primary" />
                          ) : null}
                        </div>
                      </div>
                      {job && app.preparationStatus !== "envoyee" && remaining >= 0 && remaining <= 10 ? (
                        <p className="mt-2 text-[12.5px] text-[var(--color-warning)]">
                          Il reste {remaining} jour{remaining > 1 ? "s" : ""} avant la clôture de cette offre.
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={<IllustrationNoApplications size={170} accent="var(--color-zone-candidate)" />}
                title="Aucune candidature en cours"
                description="Préparez votre première candidature depuis une offre qui vous intéresse."
                action={
                  <ButtonLink href="/mon-espace/opportunites" size="sm">
                    Explorer les opportunités
                  </ButtonLink>
                }
              />
            )}
          </section>
        </div>

        {/* ================= Colonne latérale ================= */}
        <aside className="lg:border-l lg:border-[var(--color-border)] lg:pl-8">
          {/* ---- Formation recommandée ---- */}
          <section aria-labelledby="formation" className="border-b border-[var(--color-border)] py-7 lg:pt-7">
            <h2 id="formation" className="text-[14px] font-semibold text-[var(--color-text)]">
              Formation recommandée
            </h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
              Choisie à partir des compétences qui vous manquent.
            </p>
            {training ? (
              <>
                <h3 className="mt-4 flex items-start gap-2 text-[14px] font-semibold leading-snug text-[var(--color-text)]">
                  <span className="mt-0.5 shrink-0 text-[var(--color-primary)]" aria-hidden>
                    <IconGraduation size={16} />
                  </span>
                  <span className="min-w-0">{training.training.title}</span>
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                  {training.training.summary}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <Badge tone={training.training.access === "payant" ? "neutral" : "success"}>
                    {TRAINING_ACCESS_LABEL[training.training.access]}
                  </Badge>
                  <Badge tone="neutral">{TRAINING_FORMAT_LABEL[training.training.format]}</Badge>
                  <Badge tone="neutral">{training.training.durationHours} h</Badge>
                </div>
                {training.matchedGaps.length > 0 ? (
                  <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
                    Comble vos lacunes : {training.matchedGaps.join(", ")}.
                  </p>
                ) : null}
                <ButtonLink
                  href={`/mon-espace/formations?focus=${training.training.id}`}
                  variant="outline"
                  size="sm"
                  className="mt-3.5"
                >
                  Voir la formation
                </ButtonLink>
              </>
            ) : (
              <>
                <p className="mt-3 text-[13px] text-[var(--color-text-muted)]">
                  Aucune lacune détectée pour l&apos;instant. Parcourez le catalogue si vous souhaitez progresser.
                </p>
                <ButtonLink href="/mon-espace/formations" variant="outline" size="sm" className="mt-3">
                  Voir le catalogue
                </ButtonLink>
              </>
            )}
          </section>

          {/* ---- Liaison WhatsApp ---- */}
          <section aria-labelledby="whatsapp" className="border-b border-[var(--color-border)] py-7">
            <h2
              id="whatsapp"
              className="flex items-center gap-2 text-[14px] font-semibold text-[var(--color-text)]"
            >
              <span
                className={cx(
                  "shrink-0",
                  dashboard.whatsappLinked ? "text-[var(--color-success)]" : "text-[var(--color-text-subtle)]",
                )}
                aria-hidden
              >
                <IconWhatsApp size={16} />
              </span>
              Liaison WhatsApp
            </h2>
            {dashboard.whatsappLinked ? (
              <>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[13px] text-[var(--color-text-muted)]">
                  <Badge tone="success" icon={<IconCheck size={12} />}>
                    Liée
                  </Badge>
                  <span className="tabular-nums">{user.phone}</span>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
                  Vous recevez vos alertes d&apos;opportunités sur WhatsApp. Ce consentement est retirable à tout
                  moment.
                </p>
              </>
            ) : (
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                Reliez votre numéro pour recevoir vos alertes d&apos;opportunités directement sur WhatsApp.
              </p>
            )}
            {whatsappQuota ? (
              <div className="mt-3">
                <p className="mb-1 flex items-baseline justify-between gap-2 text-[12.5px] text-[var(--color-text-muted)]">
                  <span>{whatsappQuota.label}</span>
                  <span className="tabular-nums">
                    {whatsappQuota.consumed} / {whatsappQuota.limit ?? "illimité"}
                  </span>
                </p>
                <Progress
                  value={whatsappQuota.limit ? (whatsappQuota.consumed / whatsappQuota.limit) * 100 : 0}
                  tone="success"
                  label={`${whatsappQuota.label}, ${whatsappQuota.period}`}
                />
              </div>
            ) : null}
            <ButtonLink href="/mon-espace/parametres" variant="outline" size="sm" className="mt-3.5">
              {dashboard.whatsappLinked ? "Gérer mes notifications" : "Lier mon WhatsApp"}
            </ButtonLink>
          </section>

          {/* ---- Abonnement et quotas ---- */}
          <section aria-labelledby="abonnement" className="border-b border-[var(--color-border)] py-7">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
              <div className="min-w-0">
                <h2 id="abonnement" className="text-[14px] font-semibold text-[var(--color-text)]">
                  Mon abonnement
                </h2>
                <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                  Plan {PLAN_LABEL[dashboard.subscription.plan]}
                </p>
              </div>
              <StatusChip
                label={SUBSCRIPTION_STATUS_LABEL[dashboard.subscription.status]}
                tone={dashboard.subscription.status === "active" ? "success" : "warning"}
              />
            </div>
            <div className="mt-4 space-y-3.5">
              {dashboard.usage.map((u) => {
                const ratio = u.limit ? Math.min(100, (u.consumed / u.limit) * 100) : 0;
                const exhausted = u.limit != null && u.consumed >= u.limit;
                return (
                  <div key={u.feature}>
                    <p className="mb-1 flex flex-wrap items-baseline justify-between gap-x-2 text-[12.5px]">
                      <span className="text-[var(--color-text)]">{u.label}</span>
                      <span
                        className={cx(
                          "tabular-nums",
                          exhausted ? "font-semibold text-[var(--color-danger)]" : "text-[var(--color-text-muted)]",
                        )}
                      >
                        {u.consumed} / {u.limit ?? "illimité"}
                      </span>
                    </p>
                    <Progress
                      value={ratio}
                      tone={exhausted ? "danger" : ratio >= 75 ? "warning" : "primary"}
                      label={`${u.label}, ${u.period}`}
                    />
                    <p className="mt-1 text-[11.5px] text-[var(--color-text-subtle)]">{u.period}</p>
                  </div>
                );
              })}
              {dashboard.usage.some((u) => u.limit != null && u.consumed >= u.limit) ? (
                <Alert tone="warning" title="Un quota est atteint">
                  Vos compteurs se réinitialisent à la fin de la période en cours. Le plan Premium lève ces limites.
                </Alert>
              ) : null}
              <ButtonLink href="/mon-espace/abonnement" variant="outline" size="sm" className="w-full">
                Gérer mon abonnement
              </ButtonLink>
            </div>
          </section>

          <div className="py-7">
            <CandidatePremiumCard
              title="Allez plus loin avec Premium"
              description="Votre plan Gratuit couvre l'essentiel. Premium ouvre l'accompagnement complet."
              features={[
                "Coach carrière et assistant illimité",
                "Préparation aux entretiens",
                "Analyse de vos points faibles",
                "Suivi avancé de vos candidatures",
              ]}
            />
          </div>
        </aside>
      </div>
    </>
  );
}
