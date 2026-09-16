"use client";

/**
 * File filtrée des candidatures reçues — [T §7.4].
 * Filtres par offre, par statut et par score minimum. Tableau sur grand
 * écran, liste à filets sur mobile. Le recruteur ne pilote que `reviewStatus`.
 *
 * Les filtres sont portés par l'adresse (`?offre=`, `?statut=`, `?score=`).
 * En export statique, `RecruiterApplicationsListFromUrl` les lit dans le
 * navigateur ; `RecruiterApplicationsList` sans filtre sert de rendu de repli.
 *
 * Direction épurée : en-tête de tableau discret souligné d'un filet, lignes
 * séparées par un filet, aucune bordure verticale, aucun fond alterné.
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { route } from "@/lib/base-path";
import { getRecruiterJobs } from "@/data/queries";
import { RECRUITER_ORG_ID, getRecruiterPipeline } from "./recruiter-data";
import { ReviewStatusControl } from "./recruiter-actions";
import { AiAssistNotice, ReviewStatusChip, WorkflowTrack } from "./recruiter-ui";
import { ScoreBadge } from "./score";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  Field,
  Select,
  formatDateShort,
  relativeDays,
} from "./ui";
import { REVIEW_STATUSES, REVIEW_STATUS_LABEL, type ReviewStatus } from "@/lib/enums";
import { IllustrationNoApplications } from "./illustrations";

const SCORE_THRESHOLDS = [0, 40, 50, 60, 70, 80];

const TH =
  "px-3 py-2.5 text-[11.5px] font-medium uppercase tracking-wide text-[var(--color-text-subtle)]";

function isReviewStatus(v: string | undefined): v is ReviewStatus {
  return typeof v === "string" && (REVIEW_STATUSES as readonly string[]).includes(v);
}

interface ApplicationFilters {
  offre?: string;
  statut?: string;
  score?: string;
}

/** Lit les filtres dans l'adresse. À rendre sous un `<Suspense>`. */
export function RecruiterApplicationsListFromUrl() {
  const params = useSearchParams();
  return (
    <RecruiterApplicationsList
      offre={params.get("offre") ?? undefined}
      statut={params.get("statut") ?? undefined}
      score={params.get("score") ?? undefined}
    />
  );
}

export function RecruiterApplicationsList({ offre, statut, score }: ApplicationFilters) {
  const jobs = getRecruiterJobs(RECRUITER_ORG_ID);
  const minScore = Number(score) || 0;
  const jobFilter = offre && jobs.some((j) => j.id === offre) ? offre : "";
  const statusFilter = isReviewStatus(statut) ? statut : "";

  const all = getRecruiterPipeline();
  const applications = all.filter(
    (a) =>
      (!jobFilter || a.jobId === jobFilter) &&
      (!statusFilter || a.reviewStatus === statusFilter) &&
      a.score.score >= minScore,
  );

  const jobTitle = (id: string) => jobs.find((j) => j.id === id)?.title ?? "Offre";
  const filtered = jobFilter !== "" || statusFilter !== "" || minScore > 0;

  return (
    <>
      {/* ---- Workflow ---- */}
      <section aria-labelledby="workflow" className="border-t border-[var(--color-border)] pt-7">
        <h2 id="workflow" className="text-[17px] font-semibold text-[var(--color-text)]">
          Le workflow de traitement
        </h2>
        <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">Six états, tous pilotés à la main.</p>
        <div className="mt-4">
          <WorkflowTrack current={statusFilter || "recue"} />
        </div>
      </section>

      <div className="mt-6">
        <AiAssistNotice compact />
      </div>

      {/* ---- Filtres ---- */}
      <section aria-label="Filtres" className="mt-8 border-t border-[var(--color-border)] pt-7">
        <form
          key={`${jobFilter}|${statusFilter}|${minScore}`}
          method="get"
          action={route("/recruteur/candidatures")}
          className="grid gap-4 sm:grid-cols-3"
        >
          <Field label="Offre" htmlFor="f-offre">
            <Select id="f-offre" name="offre" defaultValue={jobFilter}>
              <option value="">Toutes les offres</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Statut de traitement" htmlFor="f-statut">
            <Select id="f-statut" name="statut" defaultValue={statusFilter}>
              <option value="">Tous les statuts</option>
              {REVIEW_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {REVIEW_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Score minimum" htmlFor="f-score" hint="Filtre d'aide à la lecture, jamais un rejet.">
            <Select id="f-score" name="score" defaultValue={String(minScore)}>
              {SCORE_THRESHOLDS.map((t) => (
                <option key={t} value={t}>
                  {t === 0 ? "Tous les scores" : `${t} % et plus`}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:col-span-3">
            <Button type="submit">Appliquer les filtres</Button>
            {filtered ? (
              <Link
                href="/recruteur/candidatures"
                className="text-[13px] font-medium text-[var(--color-primary)] hover:underline"
              >
                Réinitialiser
              </Link>
            ) : null}
            <span className="text-[13px] text-[var(--color-text-muted)]">
              {applications.length} dossier{applications.length > 1 ? "s" : ""} affiché
              {applications.length > 1 ? "s" : ""} sur {all.length}
            </span>
          </div>
        </form>
      </section>

      <div className="mt-8">
        {applications.length === 0 ? (
          <EmptyState
            title="Aucune candidature ne correspond à ces filtres"
            icon={<IllustrationNoApplications size={170} accent="var(--color-zone-recruiter)" />}
            description="Élargissez le score minimum ou changez d'offre. Aucun dossier n'est supprimé : il est seulement masqué par le filtre."
            action={
              <Link
                href="/recruteur/candidatures"
                className="text-[13px] font-medium text-[var(--color-primary)] hover:underline"
              >
                Voir toutes les candidatures
              </Link>
            }
          />
        ) : (
          <>
            {/* ---- Tableau, grand écran ---- */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[62rem] border-collapse text-left">
                <caption className="sr-only">
                  Candidatures reçues : candidat, offre, score, date de réception, statut et actions
                </caption>
                <thead>
                  <tr className="border-y border-[var(--color-border)]">
                    {["Candidat", "Offre", "Score IA", "Reçue le", "Statut", "Action"].map((h) => (
                      <th key={h} scope="col" className={TH}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {applications.map((app) => (
                    <tr key={app.id} className="align-middle transition-colors hover:bg-[var(--color-surface-2)]">
                      <th scope="row" className="px-3 py-3 font-normal">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            initials={app.talent.avatarInitials}
                            color={app.talent.color}
                            size={32}
                            rounded="full"
                          />
                          <div className="min-w-0">
                            <Link
                              href={`/recruteur/candidatures/${app.id}`}
                              className="text-[13.5px] font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                            >
                              {app.talent.firstName} {app.talent.lastName}
                            </Link>
                            <p className="truncate text-[12px] text-[var(--color-text-subtle)]">
                              {app.talent.experienceYears} an(s) · {app.talent.city}
                            </p>
                          </div>
                        </div>
                      </th>
                      <td className="px-3 py-3 text-[13px] text-[var(--color-text-muted)]">
                        {jobTitle(app.jobId)}
                      </td>
                      <td className="px-3 py-3">
                        <ScoreBadge score={app.score.score} size="sm" />
                      </td>
                      <td className="px-3 py-3 text-[13px] text-[var(--color-text-muted)]">
                        {formatDateShort(app.submittedAt)}
                        <span className="block text-[11.5px] text-[var(--color-text-subtle)]">
                          {relativeDays(app.submittedAt)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <ReviewStatusChip status={app.reviewStatus} />
                          {app.isShortlisted ? <Badge tone="accent">Shortlist</Badge> : null}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <ReviewStatusControl
                          applicationId={app.id}
                          candidateName={`${app.talent.firstName} ${app.talent.lastName}`}
                          current={app.reviewStatus}
                          shortlisted={app.isShortlisted}
                          compact
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ---- Liste à filets, mobile ---- */}
            <ul className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)] md:hidden">
              {applications.map((app) => (
                <li key={app.id} className="py-4">
                  <div className="flex items-start gap-3">
                    <Avatar
                      initials={app.talent.avatarInitials}
                      color={app.talent.color}
                      size={38}
                      rounded="full"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/recruteur/candidatures/${app.id}`}
                        className="text-[13.5px] font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                      >
                        {app.talent.firstName} {app.talent.lastName}
                      </Link>
                      <p className="text-[12.5px] text-[var(--color-text-muted)]">{app.talent.headline}</p>
                    </div>
                    <ScoreBadge score={app.score.score} size="sm" />
                  </div>

                  <dl className="mt-3 space-y-1 text-[12.5px]">
                    <div className="flex justify-between gap-3">
                      <dt className="text-[var(--color-text-muted)]">Offre</dt>
                      <dd className="text-right text-[var(--color-text)]">{jobTitle(app.jobId)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[var(--color-text-muted)]">Reçue le</dt>
                      <dd className="text-right text-[var(--color-text)]">{formatDateShort(app.submittedAt)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-[var(--color-text-muted)]">Statut</dt>
                      <dd className="flex flex-wrap justify-end gap-1.5">
                        <ReviewStatusChip status={app.reviewStatus} />
                        {app.isShortlisted ? <Badge tone="accent">Shortlist</Badge> : null}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-3">
                    <ReviewStatusControl
                      applicationId={app.id}
                      candidateName={`${app.talent.firstName} ${app.talent.lastName}`}
                      current={app.reviewStatus}
                      shortlisted={app.isShortlisted}
                      compact
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
