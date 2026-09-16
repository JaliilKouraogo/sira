/**
 * Adresses pré-générées du détail d'offre côté candidat, et de son score.
 *
 * L'écran accepte indifféremment l'identifiant (`job_01`) ou le slug : les
 * deux formes sont donc exportées. La liste couvre les offres publiées, plus
 * celles auxquelles le candidat de démonstration est déjà lié par une
 * candidature ou un enregistrement, pour qu'aucun lien de son espace ne mène
 * à une page absente de l'export statique.
 */

import { getApplications, getJobById, getPublishedJobs, getSavedJobs } from "@/data/queries";
import type { Job } from "@/lib/types";

export function candidateJobParams(): { id: string }[] {
  const jobs = new Map<string, Job>();
  for (const job of getPublishedJobs()) jobs.set(job.id, job);
  for (const application of getApplications()) {
    const job = getJobById(application.jobId);
    if (job) jobs.set(job.id, job);
  }
  for (const { job } of getSavedJobs()) jobs.set(job.id, job);

  const ids = new Set<string>();
  for (const job of jobs.values()) {
    ids.add(job.id);
    ids.add(job.slug);
  }
  return [...ids].map((id) => ({ id }));
}
