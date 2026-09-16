/**
 * 404 dédiée aux offres : une offre retirée, expirée ou dont le lien a changé
 * ne doit pas laisser le visiteur dans une impasse.
 *
 * Direction épurée : fond blanc, aucune ombre, une liste filetée plutôt
 * qu'une carte, et un titre de page sobre.
 */

import { IconArrowRight, IconBriefcase } from "@/components/icons";
import { ButtonLink } from "@/components/ui";
import { getRecentJobs } from "@/data/queries";
import Link from "next/link";

export default function OffreNotFound() {
  const suggestions = getRecentJobs(4);

  return (
    <div className="sira-container py-16 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
          aria-hidden
        >
          <IconBriefcase size={18} />
        </span>
        <p className="mt-5 text-[12.5px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
          Erreur 404
        </p>
        <h1 className="mt-3 text-[22px] font-semibold tracking-tight text-[var(--color-text)]">
          Cette offre n&apos;est plus disponible
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">
          Le lien est peut-être erroné, ou l&apos;offre a été clôturée, suspendue ou retirée par le recruteur. Les
          offres qui ne sont plus publiées quittent automatiquement le site.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/emplois">Voir toutes les offres d&apos;emploi</ButtonLink>
          <ButtonLink href="/stages" variant="outline">
            Voir les stages
          </ButtonLink>
        </div>
      </div>

      {suggestions.length > 0 ? (
        <div className="mx-auto mt-14 max-w-3xl border-t border-[var(--color-border)] pt-8">
          <h2 className="mb-2 text-[14px] font-semibold text-[var(--color-text)]">
            Des opportunités publiées récemment
          </h2>
          <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
            {suggestions.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/offres/${job.slug}`}
                  className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-[var(--color-surface-2)]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-medium text-[var(--color-text)]">
                      {job.title}
                    </span>
                    <span className="block truncate text-[12.5px] text-[var(--color-text-muted)]">{job.city}</span>
                  </span>
                  <IconArrowRight size={15} className="shrink-0 text-[var(--color-text-subtle)]" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
