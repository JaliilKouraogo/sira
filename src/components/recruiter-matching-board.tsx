"use client";

/**
 * Choix de l'offre et classement suggéré du matching IA — [T §7.6].
 * L'IA ordonne la file de lecture ; elle n'écarte personne.
 *
 * L'offre choisie est portée par l'adresse (`?offre=`). En export statique,
 * `RecruiterMatchingBoardFromUrl` la lit dans le navigateur ;
 * `RecruiterMatchingBoard` sans offre sert de rendu de repli et retombe,
 * comme la page d'origine, sur la première offre qui a reçu des dossiers.
 *
 * Direction épurée : le classement se lit comme une liste à filets, sans
 * carte ni ombre. Le score est la seule touche de couleur forte, et la
 * mention d'estimation algorithmique reste affichée.
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getRecruiterJobs } from "@/data/queries";
import { RECRUITER_ORG_ID, getRankedCandidates, getRecruiterPipeline } from "./recruiter-data";
import { MatchingRecomputeNotice, ShortlistButton } from "./recruiter-actions";
import { AttentionPoints, ReviewStatusChip } from "./recruiter-ui";
import { ScoreBadge, ScoreDisclaimer, scoreLabel } from "./score";
import { Avatar, Badge, EmptyState, Progress, Stat, Tag, cx, daysUntil } from "./ui";
import { IconSparkles, IconTarget } from "./icons";
import { JOB_STATUS_LABEL, SCORE_COMPONENT_LABEL, type ScoreComponent } from "@/lib/enums";
import { IllustrationMatch, IllustrationRecruiter } from "./illustrations";

const H3 = "text-[13.5px] font-semibold text-[var(--color-text)]";

/** Lit l'offre choisie dans l'adresse. À rendre sous un `<Suspense>`. */
export function RecruiterMatchingBoardFromUrl() {
  const params = useSearchParams();
  return <RecruiterMatchingBoard offre={params.get("offre") ?? undefined} />;
}

export function RecruiterMatchingBoard({ offre }: { offre?: string }) {
  const jobs = getRecruiterJobs(RECRUITER_ORG_ID);
  const pipeline = getRecruiterPipeline();

  const counts = new Map<string, number>();
  for (const app of pipeline) counts.set(app.jobId, (counts.get(app.jobId) ?? 0) + 1);

  const selected =
    jobs.find((j) => j.id === offre) ??
    jobs.find((j) => (counts.get(j.id) ?? 0) > 0) ??
    jobs[0];

  const ranked = selected ? getRankedCandidates(selected.id) : [];
  const average =
    ranked.length > 0 ? Math.round(ranked.reduce((s, a) => s + a.score.score, 0) / ranked.length) : 0;
  const strong = ranked.filter((a) => a.score.score >= 75).length;

  return (
    <>
      {/* ---- Sélection de l'offre ---- */}
      <section aria-labelledby="choix-offre" className="border-t border-[var(--color-border)] pt-7">
        <h2 id="choix-offre" className="text-[17px] font-semibold text-[var(--color-text)]">
          1. Choisissez une offre
        </h2>
        <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
          Le classement est recalculé pour l&apos;offre choisie.
        </p>
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {jobs.map((job) => {
            const active = selected?.id === job.id;
            const count = counts.get(job.id) ?? 0;
            return (
              <li key={job.id}>
                <Link
                  href={`/recruteur/matching?offre=${job.id}`}
                  aria-current={active ? "true" : undefined}
                  className={cx(
                    "block h-full rounded-[var(--radius-card)] border p-3.5 transition-colors",
                    active
                      ? "border-[var(--color-primary)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
                  )}
                >
                  <p
                    className={cx(
                      "text-[13.5px] font-semibold",
                      active ? "text-[var(--color-primary)]" : "text-[var(--color-text)]",
                    )}
                  >
                    {job.title}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                    {job.city} · {JOB_STATUS_LABEL[job.status]}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge tone={count > 0 ? "primary" : "neutral"}>{count} dossier(s)</Badge>
                    {daysUntil(job.deadline) >= 0 ? (
                      <Badge tone="neutral">{daysUntil(job.deadline)} j restants</Badge>
                    ) : (
                      <Badge tone="neutral">Échéance dépassée</Badge>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {!selected ? (
        <div className="mt-8">
          <EmptyState
            title="Aucune offre"
            description="Publiez une offre pour utiliser le matching."
            icon={<IllustrationRecruiter size={170} accent="var(--color-zone-recruiter)" />}
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Candidats classés" value={ranked.length} tone="primary" icon={<IconTarget size={17} />} />
            <Stat label="Score moyen" value={average > 0 ? `${average} %` : "—"} tone="info" />
            <Stat label="Profils à 75 % et plus" value={strong} tone="success" />
            <Stat
              label="En shortlist"
              value={ranked.filter((a) => a.isShortlisted).length}
              tone="accent"
              icon={<IconSparkles size={17} />}
            />
          </div>

          <section aria-labelledby="classement" className="mt-10 border-t border-[var(--color-border)] pt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="classement" className="text-[17px] font-semibold text-[var(--color-text)]">
                2. Classement suggéré pour « {selected.title} »
              </h2>
              <MatchingRecomputeNotice />
            </div>

            {ranked.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="Aucune candidature sur cette offre"
                  icon={<IllustrationMatch size={170} accent="var(--color-zone-recruiter)" />}
                  description="Le classement apparaîtra dès le premier dossier reçu."
                />
              </div>
            ) : (
              <ol className="mt-5 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
                {ranked.map((app, index) => {
                  const components = Object.entries(app.score.breakdown) as [
                    ScoreComponent,
                    (typeof app.score.breakdown)[ScoreComponent],
                  ][];
                  const matched = app.score.breakdown.competences.matched ?? [];
                  const missing = app.score.gaps;

                  return (
                    <li key={app.id} className="py-6">
                      <div className="flex flex-wrap items-start gap-3.5">
                        <span
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-[12.5px] font-semibold tabular-nums text-[var(--color-text-muted)]"
                          aria-label={`Rang ${index + 1}`}
                        >
                          {index + 1}
                        </span>
                        <Avatar
                          initials={app.talent.avatarInitials}
                          color={app.talent.color}
                          size={40}
                          rounded="full"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/recruteur/candidatures/${app.id}`}
                              className="text-[14px] font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)]"
                            >
                              {app.talent.firstName} {app.talent.lastName}
                            </Link>
                            <ReviewStatusChip status={app.reviewStatus} />
                            {app.isShortlisted ? <Badge tone="accent">Shortlist</Badge> : null}
                          </div>
                          <p className="mt-0.5 text-[13px] text-[var(--color-text-muted)]">{app.talent.headline}</p>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <ScoreBadge score={app.score.score} />
                          <span className="text-[11.5px] text-[var(--color-text-subtle)]">
                            {scoreLabel(app.score.score)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-6 lg:grid-cols-2">
                        <div className="min-w-0 space-y-4">
                          <div>
                            <h3 className={cx(H3, "flex items-center gap-1.5")}>
                              <IconSparkles size={13} className="text-[var(--color-primary)]" />
                              Résumé automatique
                            </h3>
                            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                              {app.aiSummary}
                            </p>
                          </div>

                          <div>
                            <h3 className={H3}>Expérience pertinente</h3>
                            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                              {app.relevantExperience}
                            </p>
                          </div>

                          <div>
                            <h3 className={H3}>Points d&apos;attention</h3>
                            <div className="mt-1.5">
                              <AttentionPoints points={app.attentionPoints} />
                            </div>
                          </div>
                        </div>

                        <div className="min-w-0 space-y-4">
                          <div>
                            <h3 className={H3}>Compétences correspondantes</h3>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {matched.length > 0 ? (
                                matched.map((s) => (
                                  <Badge key={s} tone="success">
                                    {s}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-[13px] text-[var(--color-text-muted)]">
                                  Aucune correspondance directe.
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <h3 className={H3}>Lacunes</h3>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {missing.length > 0 ? (
                                missing.map((s) => <Tag key={s}>{s}</Tag>)
                              ) : (
                                <span className="text-[13px] text-[var(--color-text-muted)]">
                                  Aucune lacune relevée.
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <h3 className={H3}>Composantes du score</h3>
                            <ul className="mt-2 space-y-2">
                              {components.map(([key, item]) => (
                                <li key={key}>
                                  <div className="mb-1 flex items-baseline justify-between gap-2 text-[12px]">
                                    <span className="text-[var(--color-text-muted)]">
                                      {SCORE_COMPONENT_LABEL[key]}
                                    </span>
                                    <span className="tabular-nums text-[var(--color-text)]">{item.score} %</span>
                                  </div>
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
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        <ShortlistButton
                          candidateName={`${app.talent.firstName} ${app.talent.lastName}`}
                          initial={app.isShortlisted}
                        />
                        <Link
                          href={`/recruteur/candidatures/${app.id}`}
                          className="text-[13px] font-medium text-[var(--color-primary)] hover:underline"
                        >
                          Ouvrir la fiche complète
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <div className="mt-6">
            <ScoreDisclaimer model="claude-opus-5" />
          </div>
        </>
      )}
    </>
  );
}
