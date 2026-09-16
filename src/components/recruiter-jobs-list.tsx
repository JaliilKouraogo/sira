"use client";

/**
 * Liste filtrée des offres de l'organisation : filtres par statut et tableau.
 *
 * Le statut est porté par l'adresse (`?statut=`). En export statique, aucune
 * page ne lit l'adresse côté serveur : `RecruiterJobsListFromUrl` la lit dans
 * le navigateur, et `RecruiterJobsList` sans filtre sert de rendu de repli
 * pré-généré, identique à la vue « Toutes ».
 *
 * Direction épurée : le tableau porte un filet sous son en-tête, des lignes
 * séparées par un filet, aucune bordure verticale et aucun fond alterné.
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getRecruiterJobs } from "@/data/queries";
import { RECRUITER_ORG_ID, getRecruiterPipeline } from "./recruiter-data";
import { JobRowActions } from "./recruiter-job-actions";
import { JobStatusChip } from "./recruiter-ui";
import { ButtonLink, EmptyState, cx, daysUntil, formatDateShort } from "./ui";
import {
  CONTRACT_TYPE_LABEL,
  JOB_STATUSES,
  JOB_STATUS_LABEL,
  OPPORTUNITY_TYPE_LABEL,
  type JobStatus,
} from "@/lib/enums";
import { IllustrationNoResults } from "./illustrations";

const TH =
  "px-3 py-2.5 text-[11.5px] font-medium uppercase tracking-wide text-[var(--color-text-subtle)]";

function isJobStatus(value: string | undefined): value is JobStatus {
  return typeof value === "string" && (JOB_STATUSES as readonly string[]).includes(value);
}

/** Lit le statut dans l'adresse. À rendre sous un `<Suspense>`. */
export function RecruiterJobsListFromUrl() {
  const params = useSearchParams();
  return <RecruiterJobsList statut={params.get("statut") ?? undefined} />;
}

export function RecruiterJobsList({ statut }: { statut?: string }) {
  const active = isJobStatus(statut) ? statut : "all";

  const allJobs = getRecruiterJobs(RECRUITER_ORG_ID);
  const jobs = active === "all" ? allJobs : allJobs.filter((j) => j.status === active);
  const pipeline = getRecruiterPipeline();

  const counts = new Map<JobStatus, number>();
  for (const job of allJobs) counts.set(job.status, (counts.get(job.status) ?? 0) + 1);

  const filters: { key: JobStatus | "all"; label: string; count: number }[] = [
    { key: "all", label: "Toutes", count: allJobs.length },
    ...JOB_STATUSES.map((s) => ({ key: s, label: JOB_STATUS_LABEL[s], count: counts.get(s) ?? 0 })),
  ];

  return (
    <>
      {/* ---- Filtres par statut ---- */}
      <nav aria-label="Filtrer par statut" className="mb-5 border-t border-[var(--color-border)] pt-5">
        <ul className="flex flex-wrap gap-1.5">
          {filters.map((f) => {
            const selected = active === f.key;
            return (
              <li key={f.key}>
                <Link
                  href={f.key === "all" ? "/recruteur/offres" : `/recruteur/offres?statut=${f.key}`}
                  aria-current={selected ? "page" : undefined}
                  className={cx(
                    "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12.5px] font-medium transition-colors",
                    selected
                      ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                      : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]",
                    f.count === 0 && !selected ? "opacity-55" : "",
                  )}
                >
                  {f.label}
                  <span className="tabular-nums text-[var(--color-text-subtle)]">{f.count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {jobs.length === 0 ? (
        <EmptyState
          title="Aucune offre dans ce statut"
          icon={<IllustrationNoResults size={170} accent="var(--color-zone-recruiter)" />}
          description="Changez de filtre ou publiez une nouvelle offre."
          action={<ButtonLink href="/recruteur/offres/nouvelle">Publier une offre</ButtonLink>}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[62rem] border-collapse text-left">
            <caption className="sr-only">
              Offres de Sahel Agro : titre, type, ville, statut, vues, candidatures, date limite et actions
            </caption>
            <thead>
              <tr className="border-y border-[var(--color-border)]">
                {["Titre", "Type", "Ville", "Statut", "Vues", "Candidatures", "Date limite", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      scope="col"
                      className={cx(TH, ["Vues", "Candidatures", "Actions"].includes(h) ? "text-right" : "")}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {jobs.map((job) => {
                const remaining = daysUntil(job.deadline);
                const inPipeline = pipeline.filter((a) => a.jobId === job.id).length;
                return (
                  <tr key={job.id} className="align-top transition-colors hover:bg-[var(--color-surface-2)]">
                    <th scope="row" className="px-3 py-3 font-normal">
                      <Link
                        href={`/recruteur/offres/${job.id}`}
                        className="text-[13.5px] font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                      >
                        {job.title}
                      </Link>
                      <p className="mt-0.5 text-[12px] text-[var(--color-text-subtle)]">
                        {job.department ?? "Sans département"} · {CONTRACT_TYPE_LABEL[job.contractType]}
                      </p>
                    </th>
                    <td className="px-3 py-3 text-[13px] text-[var(--color-text-muted)]">
                      {OPPORTUNITY_TYPE_LABEL[job.opportunityType]}
                    </td>
                    <td className="px-3 py-3 text-[13px] text-[var(--color-text-muted)]">{job.city}</td>
                    <td className="px-3 py-3">
                      <JobStatusChip status={job.status} />
                    </td>
                    <td className="px-3 py-3 text-right text-[13px] tabular-nums text-[var(--color-text)]">
                      {job.viewCount.toLocaleString("fr-FR")}
                    </td>
                    <td className="px-3 py-3 text-right text-[13px] tabular-nums text-[var(--color-text)]">
                      {job.applicationCount}
                      <span className="block text-[11.5px] text-[var(--color-text-subtle)]">
                        {inPipeline} dans la file
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[13px] text-[var(--color-text-muted)]">
                      {formatDateShort(job.deadline)}
                      <span
                        className={cx(
                          "block text-[11.5px]",
                          remaining < 0
                            ? "text-[var(--color-danger)]"
                            : remaining <= 7
                              ? "text-[var(--color-warning)]"
                              : "text-[var(--color-text-subtle)]",
                        )}
                      >
                        {remaining < 0 ? `dépassée de ${Math.abs(remaining)} j` : `dans ${remaining} j`}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <JobRowActions id={job.id} slug={job.slug} title={job.title} status={job.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
