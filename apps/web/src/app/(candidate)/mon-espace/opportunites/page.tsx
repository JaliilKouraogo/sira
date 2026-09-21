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
import { ButtonLink, PageHeader } from "@/components/ui";
import { getSavedJobs } from "@/data/queries";
import { OpportunitiesResults } from "./opportunities-client";
import { OpportunitiesSkeleton } from "./opportunities-skeleton";

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
