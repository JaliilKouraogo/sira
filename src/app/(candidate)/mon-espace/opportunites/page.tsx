/**
 * Liste des opportunités côté candidat — [T §6.2].
 *
 * Les filtres sont portés par l'URL et soumis par un simple formulaire GET :
 * la recherche reste partageable. Le site étant exporté en fichiers statiques,
 * la page ne lit pas l'adresse côté serveur : l'en-tête est rendu ici, les
 * filtres et les résultats le sont par `OpportunitiesResults`, qui lit
 * l'adresse dans le navigateur. En attendant, un squelette tient la place.
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { JobCardSkeleton } from "@/components/job-card";
import { ButtonLink, PageHeader } from "@/components/ui";
import { getSavedJobs } from "@/data/queries";
import { OpportunitiesResults } from "./opportunities-client";

export const metadata: Metadata = {
  title: "Opportunités",
  description: "Recherchez parmi les offres publiées et triez-les par compatibilité avec votre profil.",
};

export default function OpportunitiesPage() {
  const saved = getSavedJobs();

  return (
    <>
      <PageHeader
        title="Opportunités"
        description="Les offres publiées sur SIRA, ordonnées par compatibilité avec votre profil."
        action={
          <ButtonLink href="/mon-espace/offres-enregistrees" variant="outline" size="sm">
            Mes offres enregistrées ({saved.length})
          </ButtonLink>
        }
      />

      <Suspense fallback={<OpportunitiesSkeleton />}>
        <OpportunitiesResults />
      </Suspense>
    </>
  );
}

/** Place réservée aux filtres et aux résultats pendant la lecture de l'adresse. */
function OpportunitiesSkeleton() {
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
