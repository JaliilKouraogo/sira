/**
 * Liste des offres de l'organisation, tous statuts confondus.
 * Filtres par statut et tableau responsive : titre, type, ville, statut,
 * vues, candidatures, date limite, actions.
 *
 * Compatible export statique : la page ne lit pas l'adresse. Le filtre
 * `?statut=` est appliqué dans le navigateur par `RecruiterJobsListFromUrl`,
 * rendu sous `<Suspense>` ; la vue sans filtre sert de rendu de repli.
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { getRecruiterJobs } from "@/data/queries";
import { RECRUITER_ORG_ID, getRecruiterPipeline } from "@/components/recruiter-data";
import { RecruiterJobsList, RecruiterJobsListFromUrl } from "@/components/recruiter-jobs-list";
import { ButtonLink, PageHeader, Stat } from "@/components/ui";
import { IconBriefcase, IconPlus } from "@/components/icons";

export const metadata: Metadata = {
  title: "Mes offres",
};

export default function RecruiterJobsPage() {
  const allJobs = getRecruiterJobs(RECRUITER_ORG_ID);
  const pipeline = getRecruiterPipeline();

  const published = allJobs.filter((j) => j.status === "publiee").length;
  const totalViews = allJobs.reduce((s, j) => s + j.viewCount, 0);
  const totalApplications = allJobs.reduce((s, j) => s + j.applicationCount, 0);

  return (
    <>
      <PageHeader
        title="Mes offres"
        description="Toutes les offres de Sahel Agro, quel que soit leur statut."
        action={
          <ButtonLink href="/recruteur/offres/nouvelle">
            <IconPlus size={16} />
            Publier une offre
          </ButtonLink>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Offres"
          value={allJobs.length}
          hint={`${published} publiées`}
          tone="primary"
          icon={<IconBriefcase size={17} />}
        />
        <Stat label="Vues cumulées" value={totalViews.toLocaleString("fr-FR")} tone="info" />
        <Stat label="Candidatures" value={totalApplications.toLocaleString("fr-FR")} tone="success" />
        <Stat label="Dossiers dans la file" value={pipeline.length} hint="Ouverts, tous statuts" tone="accent" />
      </div>

      <Suspense fallback={<RecruiterJobsList />}>
        <RecruiterJobsListFromUrl />
      </Suspense>

      <p className="mt-5 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
        Rappel : seule une offre au statut « Publiée » est visible du public, indexée et ouverte aux candidatures.
        Une offre suspendue, expirée ou clôturée conserve ses dossiers déjà reçus.
      </p>
    </>
  );
}
