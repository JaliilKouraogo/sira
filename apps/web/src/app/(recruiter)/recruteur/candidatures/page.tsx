/**
 * Candidatures reçues — [T §7.4].
 * Filtres par offre, par statut et par score minimum. Tableau sur grand
 * écran, liste à filets sur mobile. Le recruteur ne pilote que `reviewStatus`.
 *
 * Compatible export statique : la page ne lit pas l'adresse. Les filtres
 * `?offre=`, `?statut=` et `?score=` sont appliqués dans le navigateur par
 * `RecruiterApplicationsListFromUrl`, rendu sous `<Suspense>`.
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { getRecruiterPipeline } from "@/components/recruiter-data";
import {
  RecruiterApplicationsList,
  RecruiterApplicationsListFromUrl,
} from "@/components/recruiter-applications-list";
import { ScoreDisclaimer } from "@/components/score";
import { PageHeader, Stat } from "@/components/ui";
import { IconBookmark, IconTarget, IconUsers } from "@/components/icons";

export const metadata: Metadata = {
  title: "Candidatures reçues",
};

export default function RecruiterApplicationsPage() {
  const all = getRecruiterPipeline();
  const shortlisted = all.filter((a) => a.isShortlisted).length;
  const toProcess = all.filter((a) => a.reviewStatus === "recue").length;

  return (
    <>
      <PageHeader
        title="Candidatures reçues"
        description="Le suivi se fait sur l'axe recruteur. L'axe de préparation du candidat ne vous est pas accessible et n'est jamais modifié ici."
      />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Dossiers reçus" value={all.length} tone="primary" icon={<IconTarget size={17} />} />
        <Stat label="Sans première lecture" value={toProcess} hint="État « Reçue »" tone="warning" />
        <Stat label="En shortlist" value={shortlisted} tone="accent" icon={<IconBookmark size={17} />} />
        <Stat
          label="Score moyen"
          value={
            all.length > 0 ? `${Math.round(all.reduce((s, a) => s + a.score.score, 0) / all.length)} %` : "—"
          }
          tone="info"
          icon={<IconUsers size={17} />}
        />
      </div>

      <Suspense fallback={<RecruiterApplicationsList />}>
        <RecruiterApplicationsListFromUrl />
      </Suspense>

      <div className="mt-6">
        <ScoreDisclaimer />
      </div>
    </>
  );
}
