/**
 * Carte d'offre — [T §6.2] : titre, entreprise, logo, lieu, type, date,
 * date limite, résumé, score SIRA, et les actions Voir, Enregistrer, Préparer.
 *
 * Direction épurée : pas d'ombre, pas de survol appuyé, un filet de 1 pixel
 * pour délimiter, et la hiérarchie portée par le texte plutôt que par la
 * couleur. Le score reste la seule touche colorée de la carte.
 */

import Link from "next/link";
import {
  CONTRACT_TYPE_LABEL,
  OPPORTUNITY_TYPE_LABEL,
  WORK_MODE_LABEL,
  formatSalaryRange,
} from "@/lib/enums";
import type { Job, MatchScore, Organization } from "@/lib/types";
import { ScoreBadge } from "./score";
import { cx, daysUntil, relativeDays } from "./ui";
import { IconBookmark, IconCheckCircle } from "./icons";

export function JobCard({
  job,
  organization,
  score,
  href,
  showActions = true,
  saved = false,
  compact = false,
}: {
  job: Job;
  organization?: Organization;
  score?: MatchScore;
  href?: string;
  showActions?: boolean;
  saved?: boolean;
  compact?: boolean;
}) {
  const link = href ?? `/offres/${job.slug}`;
  const remaining = daysUntil(job.deadline);
  const anonymised = job.visibility === "anonymisee";
  const orgName = anonymised
    ? "Entreprise confidentielle"
    : organization?.tradeName ?? organization?.legalName ?? "Organisation";

  return (
    <article
      className={cx(
        "group relative rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:border-[var(--color-border-strong)]",
        compact ? "p-3.5" : "p-4",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[14.5px] font-semibold leading-snug text-[var(--color-text)]">
            <Link href={link} className="before:absolute before:inset-0 hover:underline">
              {job.title}
            </Link>
          </h3>

          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[13px] text-[var(--color-text-muted)]">
            <span>{orgName}</span>
            {organization?.verificationStatus === "verifie" && !anonymised ? (
              <span
                className="inline-flex items-center text-[var(--color-success)]"
                title="Recruteur vérifié par SIRA"
              >
                <IconCheckCircle size={12.5} />
                <span className="sr-only">Recruteur vérifié</span>
              </span>
            ) : null}
          </p>
        </div>

        {score ? <ScoreBadge score={score.score} size={compact ? "sm" : "md"} /> : null}
      </div>

      {!compact ? (
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[var(--color-text-muted)]">{job.summary}</p>
      ) : null}

      {/* Métadonnées en une ligne sobre, séparées par des points médians */}
      <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-[var(--color-text-subtle)]">
        <span className="text-[var(--color-text-muted)]">{job.city}</span>
        <span aria-hidden>·</span>
        <span>{OPPORTUNITY_TYPE_LABEL[job.opportunityType]}</span>
        <span aria-hidden>·</span>
        <span>{CONTRACT_TYPE_LABEL[job.contractType]}</span>
        <span aria-hidden>·</span>
        <span>{WORK_MODE_LABEL[job.workMode]}</span>
        <span aria-hidden>·</span>
        <span>{formatSalaryRange(job.salaryMin, job.salaryMax)}</span>
        <span aria-hidden>·</span>
        <span>{relativeDays(job.publishedAt)}</span>
        {remaining >= 0 && remaining <= 7 ? (
          <>
            <span aria-hidden>·</span>
            <span className="font-medium text-[var(--color-warning)]">
              {remaining === 0 ? "dernier jour" : `plus que ${remaining} j`}
            </span>
          </>
        ) : null}
        {job.origin !== "native" ? (
          <>
            <span aria-hidden>·</span>
            <span>offre partenaire</span>
          </>
        ) : null}
      </p>

      {showActions ? (
        <div className="relative z-10 mt-3.5 flex flex-wrap items-center gap-3 border-t border-[var(--color-border)] pt-3">
          <Link href={link} className="text-[13px] font-medium text-[var(--color-primary)] hover:underline">
            Voir l&apos;offre
          </Link>
          <Link
            href={`/mon-espace/opportunites/${job.id}?action=preparer`}
            className="text-[13px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:underline"
          >
            Préparer ma candidature
          </Link>
          <button
            type="button"
            aria-label={saved ? "Retirer des offres enregistrées" : "Enregistrer cette offre"}
            className={cx(
              "ml-auto inline-flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-[var(--color-surface-2)]",
              saved ? "text-[var(--color-accent-text)]" : "text-[var(--color-text-subtle)]",
            )}
          >
            <IconBookmark size={14} />
          </button>
        </div>
      ) : null}
    </article>
  );
}

/** Variante squelette, affichée pendant le chargement des listes. */
export function JobCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
      <div className="space-y-2">
        <div className="sira-skeleton h-4 w-2/3 rounded" />
        <div className="sira-skeleton h-3 w-1/3 rounded" />
        <div className="sira-skeleton h-3 w-full rounded" />
        <div className="sira-skeleton h-3 w-4/5 rounded" />
      </div>
    </div>
  );
}
