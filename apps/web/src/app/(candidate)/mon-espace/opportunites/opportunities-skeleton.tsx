/**
 * Squelette de la liste des opportunités, affiché le temps que le navigateur
 * lise l'adresse (filtres) dans l'export statique.
 */

import { JobCardSkeleton } from "@/components/job-card";

/** Place réservée aux filtres et aux résultats pendant la lecture de l'adresse. */
export function OpportunitiesSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="sr-only">Chargement des offres…</p>
      <div className="mb-6 space-y-4 border-y border-[var(--color-border)] py-5" aria-hidden>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <div className="sira-skeleton h-3 w-24 rounded" />
            <div className="sira-skeleton h-9 w-full rounded-md" />
          </div>
          <div className="flex items-end">
            <div className="sira-skeleton h-9 w-full rounded-md sm:w-28" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="sira-skeleton h-3 w-20 rounded" />
              <div className="sira-skeleton h-9 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
      <div className="mb-3 sira-skeleton h-4 w-40 rounded" aria-hidden />
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
