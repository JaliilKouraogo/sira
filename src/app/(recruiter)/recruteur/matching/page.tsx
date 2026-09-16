/**
 * Matching IA — [T §7.6], fonction Pro.
 * Sélection d'une offre, puis classement suggéré des candidats reçus.
 * L'IA ordonne la file de lecture ; elle n'écarte personne.
 *
 * Compatible export statique : la page ne lit pas l'adresse. L'offre
 * `?offre=` est lue dans le navigateur par `RecruiterMatchingBoardFromUrl`,
 * rendu sous `<Suspense>` ; le classement par défaut sert de rendu de repli.
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import {
  RecruiterMatchingBoard,
  RecruiterMatchingBoardFromUrl,
} from "@/components/recruiter-matching-board";
import { AiAssistNotice, ProFeatureBanner } from "@/components/recruiter-ui";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Matching IA",
};

export default function MatchingPage() {
  return (
    <>
      <PageHeader
        title="Matching IA"
        description="Un classement suggéré pour décider de l'ordre de lecture des dossiers, offre par offre."
      />

      <ProFeatureBanner
        feature="Matching IA et classement suggéré"
        description="Score, résumé, correspondances et lacunes calculés sur les candidatures reçues."
      />

      <div className="mb-8">
        <AiAssistNotice />
      </div>

      <Suspense fallback={<RecruiterMatchingBoard />}>
        <RecruiterMatchingBoardFromUrl />
      </Suspense>
    </>
  );
}
