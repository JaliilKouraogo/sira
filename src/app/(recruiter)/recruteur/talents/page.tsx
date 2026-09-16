/**
 * Recherche de talents — [T §7.5], fonction Pro.
 *
 * Confidentialité, arbitrage C7 : les profils invisibles n'apparaissent jamais,
 * les autres sont affichés sans identité ni coordonnées. Le déblocage passe par
 * une candidature sur une offre de l'organisation ou par l'acceptation d'une
 * prise de contact.
 *
 * Compatible export statique : la page ne lit pas l'adresse. Les critères
 * sont appliqués dans le navigateur par `RecruiterTalentSearchFromUrl`, rendu
 * sous `<Suspense>` ; la recherche sans critère sert de rendu de repli.
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import {
  RecruiterTalentSearch,
  RecruiterTalentSearchFromUrl,
} from "@/components/recruiter-talent-search";
import { PrivacyNotice, ProFeatureBanner } from "@/components/recruiter-ui";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Recherche de talents",
};

export default function TalentSearchPage() {
  return (
    <>
      <PageHeader
        title="Recherche de talents"
        description="Le vivier des candidats qui ont accepté d'être visibles des recruteurs vérifiés."
      />

      <ProFeatureBanner
        feature="Recherche avancée de talents"
        description="Filtres croisés sur les compétences, l'expérience, la localisation et la disponibilité."
      />

      <div className="mb-8">
        <PrivacyNotice />
      </div>

      <Suspense fallback={<RecruiterTalentSearch />}>
        <RecruiterTalentSearchFromUrl />
      </Suspense>
    </>
  );
}
