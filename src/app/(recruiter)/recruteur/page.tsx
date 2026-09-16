/**
 * Tableau de bord recruteur — [T §7.1].
 * Offres actives, candidatures reçues, nouveaux candidats, shortlist,
 * alertes et statistiques de diffusion.
 *
 * Direction épurée : fond blanc de bout en bout, aucune ombre, aucun aplat
 * coloré. Les sections se séparent par un filet de 1 pixel, les listes par un
 * `divide-y`, et la couleur ne sert qu'aux actions, aux scores et aux puces.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { getRecruiterDashboard } from "@/data/queries";
import {
  RECRUITER_NAME,
  RECRUITER_SUBSCRIPTION,
  TODAY,
  dAgo,
  getRecruiterAlerts,
  getRecruiterPipeline,
} from "@/components/recruiter-data";
import { JobStatusChip, ProBadge, ReviewStatusChip, VerificationChip } from "@/components/recruiter-ui";
import { ScoreBadge } from "@/components/score";
import {
  Alert,
  Avatar,
  Badge,
  ButtonLink,
  EmptyState,
  Stat,
  daysUntil,
  formatDate,
  relativeDays,
} from "@/components/ui";
import {
  IconBookmark,
  IconBriefcase,
  IconChart,
  IconPlus,
  IconSparkles,
  IconTarget,
  IconUsers,
} from "@/components/icons";
import { IllustrationNoApplications, ZoneHeader } from "@/components/illustrations";

export const metadata: Metadata = {
  title: "Tableau de bord recruteur",
};

const ALERT_TONE = {
  warning: "warning",
  danger: "danger",
  info: "info",
  accent: "accent",
} as const;

export default function RecruiterDashboardPage() {
  const dashboard = getRecruiterDashboard();
  const { organization, activeJobs, allJobs, totalViews, totalApplications } = dashboard;

  const pipeline = getRecruiterPipeline();
  const since = dAgo(7);
  const newCandidates = pipeline.filter((a) => a.submittedAt >= since);
  const toProcess = pipeline.filter((a) => a.reviewStatus === "recue" || a.reviewStatus === "a_examiner");
  const shortlisted = pipeline.filter((a) => a.isShortlisted);
  const interviews = pipeline.filter((a) => a.reviewStatus === "entretien");
  const alerts = getRecruiterAlerts();
  const conversion = totalViews > 0 ? Math.round((totalApplications / totalViews) * 1000) / 10 : 0;
  const recent = pipeline.slice(0, 5);

  return (
    <>
      <ZoneHeader
        zone="recruiter"
        title={`Bonjour ${RECRUITER_NAME.split(" ")[0]}`}
        description={`Voici l'activité de recrutement de ${organization.tradeName ?? organization.legalName} au ${formatDate(TODAY)}.`}
        action={
          <ButtonLink href="/recruteur/offres/nouvelle">
            <IconPlus size={16} />
            Publier une offre
          </ButtonLink>
        }
      />

      {/* ---- Bandeau organisation, délimité par deux filets ---- */}
      <div className="mb-8 flex flex-wrap items-center gap-3.5 border-y border-[var(--color-border)] py-4">
        <Avatar initials={organization.logoInitials} color={organization.logoColor} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold text-[var(--color-text)]">
              {organization.tradeName ?? organization.legalName}
            </h2>
            <VerificationChip status={organization.verificationStatus} />
          </div>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
            {organization.sector} · {organization.city} · {organization.size}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Badge tone="accent">Pro · Offre de lancement</Badge>
          <Link
            href="/recruteur/abonnement"
            className="text-[13px] font-medium text-[var(--color-primary)] hover:underline"
          >
            Jusqu&apos;au {formatDate(RECRUITER_SUBSCRIPTION.renewsAt ?? TODAY)}
          </Link>
        </div>
      </div>

      {/* ---- Indicateurs ---- */}
      <div className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Offres actives"
          value={activeJobs.length}
          hint={`${allJobs.length} offres au total`}
          tone="primary"
          icon={<IconBriefcase size={17} />}
        />
        <Stat
          label="Candidatures reçues"
          value={pipeline.length}
          hint={`${toProcess.length} à traiter`}
          tone="info"
          icon={<IconTarget size={17} />}
        />
        <Stat
          label="Nouveaux candidats"
          value={newCandidates.length}
          hint="Sur les 7 derniers jours"
          tone="success"
          icon={<IconUsers size={17} />}
        />
        <Stat
          label="Shortlist"
          value={shortlisted.length}
          hint={`${interviews.length} en entretien`}
          tone="accent"
          icon={<IconBookmark size={17} />}
        />
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0">
          {/* ---- Alertes ---- */}
          <section aria-labelledby="alertes">
            <h2 id="alertes" className="text-[17px] font-semibold text-[var(--color-text)]">
              Alertes
            </h2>
            <div className="mt-4">
              {alerts.length === 0 ? (
                <Alert tone="success">Aucune alerte : vos offres et vos candidatures sont à jour.</Alert>
              ) : (
                <ul className="space-y-2.5">
                  {alerts.map((alert) => (
                    <li key={alert.title}>
                      <Alert tone={ALERT_TONE[alert.tone]} title={alert.title}>
                        <p>{alert.body}</p>
                        {alert.href ? (
                          <Link
                            href={alert.href}
                            className="mt-1 inline-block font-medium text-[var(--color-primary)] hover:underline"
                          >
                            {alert.linkLabel ?? "Ouvrir"}
                          </Link>
                        ) : null}
                      </Alert>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* ---- Dernières candidatures ---- */}
          <section
            aria-labelledby="dernieres-candidatures"
            className="mt-10 border-t border-[var(--color-border)] pt-8"
          >
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
              <div className="min-w-0">
                <h2 id="dernieres-candidatures" className="text-[17px] font-semibold text-[var(--color-text)]">
                  Dernières candidatures
                </h2>
                <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                  Classées par date de réception. Le score est une estimation, jamais une décision.
                </p>
              </div>
              <Link
                href="/recruteur/candidatures"
                className="shrink-0 text-[13px] font-medium text-[var(--color-primary)] hover:underline"
              >
                Tout voir
              </Link>
            </div>

            {recent.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="Aucune candidature reçue"
                  icon={<IllustrationNoApplications size={170} accent="var(--color-zone-recruiter)" />}
                  description="Publiez une offre pour commencer à recevoir des dossiers."
                  action={<ButtonLink href="/recruteur/offres/nouvelle">Publier une offre</ButtonLink>}
                />
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                {recent.map((app) => {
                  const job = allJobs.find((j) => j.id === app.jobId);
                  return (
                    <li key={app.id} className="flex flex-wrap items-center gap-3 py-3">
                      <Avatar
                        initials={app.talent.avatarInitials}
                        color={app.talent.color}
                        size={34}
                        rounded="full"
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/recruteur/candidatures/${app.id}`}
                          className="text-[13.5px] font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                        >
                          {app.talent.firstName} {app.talent.lastName}
                        </Link>
                        <p className="truncate text-[12px] text-[var(--color-text-subtle)]">
                          {job?.title ?? "Offre"} · {relativeDays(app.submittedAt)}
                        </p>
                      </div>
                      <ScoreBadge score={app.score.score} size="sm" />
                      <ReviewStatusChip status={app.reviewStatus} />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* ---- Offres actives ---- */}
          <section aria-labelledby="offres-actives" className="mt-10 border-t border-[var(--color-border)] pt-8">
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
              <div className="min-w-0">
                <h2 id="offres-actives" className="text-[17px] font-semibold text-[var(--color-text)]">
                  Vos offres
                </h2>
                <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                  Vues, candidatures et échéance de chaque offre.
                </p>
              </div>
              <Link
                href="/recruteur/offres"
                className="shrink-0 text-[13px] font-medium text-[var(--color-primary)] hover:underline"
              >
                Gérer
              </Link>
            </div>

            <ul className="mt-4 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
              {allJobs.map((job) => {
                const remaining = daysUntil(job.deadline);
                return (
                  <li key={job.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/recruteur/offres/${job.id}`}
                          className="text-[13.5px] font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                        >
                          {job.title}
                        </Link>
                        <JobStatusChip status={job.status} />
                      </div>
                      <p className="mt-0.5 text-[12px] text-[var(--color-text-subtle)]">
                        {job.city} ·{" "}
                        {remaining >= 0
                          ? `clôture dans ${remaining} jour${remaining > 1 ? "s" : ""}`
                          : `clôturée depuis ${Math.abs(remaining)} jour${Math.abs(remaining) > 1 ? "s" : ""}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-5 text-right">
                      <div>
                        <p className="text-[14px] font-semibold tabular-nums text-[var(--color-text)]">
                          {job.viewCount.toLocaleString("fr-FR")}
                        </p>
                        <p className="text-[11.5px] text-[var(--color-text-subtle)]">vues</p>
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold tabular-nums text-[var(--color-text)]">
                          {job.applicationCount}
                        </p>
                        <p className="text-[11.5px] text-[var(--color-text-subtle)]">candidatures</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* ---- Colonne latérale ---- */}
        <aside className="min-w-0">
          <section aria-labelledby="diffusion">
            <h2 id="diffusion" className="text-[14px] font-semibold text-[var(--color-text)]">
              Statistiques de diffusion
            </h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
              Depuis la publication de chaque offre.
            </p>
            <dl className="mt-3 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
              {[
                { label: "Vues cumulées", value: totalViews.toLocaleString("fr-FR") },
                { label: "Candidatures reçues", value: totalApplications.toLocaleString("fr-FR") },
                { label: "Taux de conversion", value: `${conversion} %` },
              ].map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-3 py-2.5">
                  <dt className="text-[13px] text-[var(--color-text-muted)]">{row.label}</dt>
                  <dd className="text-[15px] font-semibold tabular-nums text-[var(--color-text)]">{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[12px] leading-relaxed text-[var(--color-text-subtle)]">
              Le taux de conversion rapporte les candidatures aux vues de la fiche. La file de traitement
              ci-dessus ne contient que les dossiers encore ouverts.
            </p>
            <Link
              href="/recruteur/statistiques"
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-primary)] hover:underline"
            >
              <IconChart size={14} />
              Voir toutes les statistiques
            </Link>
          </section>

          <section aria-labelledby="outils-pro" className="mt-8 border-t border-[var(--color-border)] pt-6">
            <h2 id="outils-pro" className="text-[14px] font-semibold text-[var(--color-text)]">
              Outils Pro
            </h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
              Inclus dans votre offre de lancement.
            </p>
            <ul className="mt-3 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
              {[
                {
                  href: "/recruteur/matching",
                  label: "Matching IA",
                  desc: "Classement suggéré des candidats sur une offre.",
                  icon: <IconSparkles size={16} />,
                },
                {
                  href: "/recruteur/talents",
                  label: "Recherche de talents",
                  desc: "Vivier anonymisé, filtres avancés.",
                  icon: <IconUsers size={16} />,
                },
                {
                  href: "/recruteur/statistiques",
                  label: "Statistiques",
                  desc: "Entonnoir, délais, performance par offre.",
                  icon: <IconChart size={16} />,
                },
              ].map((tool) => (
                <li key={tool.href}>
                  <Link href={tool.href} className="group flex items-start gap-2.5 py-3">
                    <span className="mt-0.5 shrink-0 text-[var(--color-primary)]">{tool.icon}</span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-1.5 text-[13.5px] font-medium text-[var(--color-text)] group-hover:text-[var(--color-primary)]">
                        {tool.label}
                        <ProBadge />
                      </span>
                      <span className="mt-0.5 block text-[12.5px] text-[var(--color-text-muted)]">{tool.desc}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="shortlist" className="mt-8 border-t border-[var(--color-border)] pt-6">
            <h2 id="shortlist" className="text-[14px] font-semibold text-[var(--color-text)]">
              Shortlist en cours
            </h2>
            {shortlisted.length === 0 ? (
              <p className="mt-2 text-[13px] text-[var(--color-text-muted)]">
                Aucun candidat en shortlist pour le moment.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                {shortlisted.map((app) => (
                  <li key={app.id} className="flex items-center gap-2.5 py-2.5">
                    <Avatar initials={app.talent.avatarInitials} color={app.talent.color} size={28} rounded="full" />
                    <Link
                      href={`/recruteur/candidatures/${app.id}`}
                      className="min-w-0 flex-1 truncate text-[13px] text-[var(--color-text)] hover:text-[var(--color-primary)]"
                    >
                      {app.talent.firstName} {app.talent.lastName}
                    </Link>
                    <ScoreBadge score={app.score.score} size="sm" />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
