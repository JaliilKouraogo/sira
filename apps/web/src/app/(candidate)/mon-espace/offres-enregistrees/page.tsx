/**
 * Offres mises de côté par la candidate.
 *
 * Une offre enregistrée garde sa date de mise de côté et son score : le but
 * est de pouvoir reprendre une candidature sans avoir à retrouver l'offre,
 * et de voir d'un coup d'œil celles dont la date limite approche.
 */

import type { Metadata } from "next";
import { IconClock } from "@/components/icons";
import { IllustrationNoResults } from "@/components/illustrations";
import { JobCard } from "@/components/job-card";
import {
  Alert,
  Badge,
  ButtonLink,
  EmptyState,
  PageHeader,
  daysUntil,
  formatDate,
  relativeDays,
} from "@/components/ui";
import { getJobOrganization, getSavedJobs, getScore } from "@/data/queries";
import { JOB_STATUS_ACCEPTS_APPLICATIONS, JOB_STATUS_LABEL } from "@/lib/enums";

export const metadata: Metadata = {
  title: "Offres enregistrées",
  description: "Les opportunités que vous avez mises de côté, avec leur date limite et votre score.",
};

export default function SavedJobsPage() {
  const saved = [...getSavedJobs()].sort((a, b) => b.saved.savedAt.localeCompare(a.saved.savedAt));
  const closingSoon = saved.filter(({ job }) => {
    const remaining = daysUntil(job.deadline);
    return remaining >= 0 && remaining <= 7;
  });

  return (
    <>
      <PageHeader
        title="Offres enregistrées"
        description="Vos opportunités mises de côté, de la plus récemment enregistrée à la plus ancienne."
        action={
          <ButtonLink href="/mon-espace/opportunites" variant="outline" size="sm">
            Chercher d&apos;autres offres
          </ButtonLink>
        }
      />

      {saved.length === 0 ? (
        <EmptyState
          icon={<IllustrationNoResults size={180} accent="var(--color-zone-candidate)" />}
          title="Vous n'avez encore enregistré aucune offre"
          description="Le signet, sur chaque carte d'offre, met une opportunité de côté sans postuler tout de suite. Vous la retrouverez ici avec son score et sa date limite."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <ButtonLink href="/mon-espace/opportunites" size="sm">
                Parcourir les opportunités
              </ButtonLink>
              <ButtonLink href="/mon-espace" variant="outline" size="sm">
                Voir mes recommandations
              </ButtonLink>
            </div>
          }
        />
      ) : (
        <>
          {closingSoon.length > 0 ? (
            <div className="mb-4">
              <Alert tone="warning" title="Des dates limites approchent" icon={<IconClock size={15} />}>
                {closingSoon.length} offre{closingSoon.length > 1 ? "s" : ""} enregistrée
                {closingSoon.length > 1 ? "s" : ""} ferme{closingSoon.length > 1 ? "nt" : ""} dans moins de huit jours.
                Préparez votre candidature avant la clôture.
              </Alert>
            </div>
          ) : null}

          <p className="mb-4 text-[13.5px] text-[var(--color-text-muted)]">
            {saved.length} offre{saved.length > 1 ? "s" : ""} enregistrée{saved.length > 1 ? "s" : ""}.
          </p>

          <ul className="space-y-5">
            {saved.map(({ saved: entry, job }) => {
              const remaining = daysUntil(job.deadline);
              const open = JOB_STATUS_ACCEPTS_APPLICATIONS[job.status] && remaining >= 0;
              return (
                <li key={entry.id}>
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12.5px] text-[var(--color-text-muted)]">
                      Enregistrée le{" "}
                      <span className="font-medium text-[var(--color-text)]">{formatDate(entry.savedAt)}</span>{" "}
                      ({relativeDays(entry.savedAt)})
                    </p>
                    {!open ? (
                      <Badge tone="danger">
                        {JOB_STATUS_ACCEPTS_APPLICATIONS[job.status]
                          ? "Date limite dépassée"
                          : JOB_STATUS_LABEL[job.status]}
                      </Badge>
                    ) : remaining <= 7 ? (
                      <Badge tone="warning">
                        {remaining === 0 ? "Dernier jour" : `Clôture dans ${remaining} jours`}
                      </Badge>
                    ) : (
                      <Badge tone="neutral">Clôture le {formatDate(job.deadline)}</Badge>
                    )}
                  </div>
                  <JobCard
                    job={job}
                    organization={getJobOrganization(job)}
                    score={getScore(job.id)}
                    href={`/mon-espace/opportunites/${job.id}`}
                    saved
                  />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
