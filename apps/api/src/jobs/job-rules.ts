import { JOB_STATUS_ACCEPTS_APPLICATIONS, type JobStatus } from "@sira/shared";

/**
 * RM-02 : une offre clôturée, suspendue ou expirée n'accepte plus de
 * candidature. Une offre publiée dont la date limite est passée est traitée
 * comme expirée, sans attendre la tâche de maintenance qui changera son statut.
 */
export function acceptsApplications(job: { status: JobStatus; deadline: Date | null }, now = new Date()): boolean {
  return JOB_STATUS_ACCEPTS_APPLICATIONS[job.status] && (!job.deadline || job.deadline.getTime() > now.getTime());
}

/** Transitions de statut déclenchées par le recruteur (section 8.3 du plan). */
export const JOB_TRANSITIONS = {
  publish: { from: ["brouillon", "en_validation", "suspendue"], to: "publiee" },
  suspend: { from: ["publiee"], to: "suspendue" },
  close: { from: ["publiee", "suspendue"], to: "cloturee" },
} as const satisfies Record<string, { from: readonly JobStatus[]; to: JobStatus }>;

export type JobTransition = keyof typeof JOB_TRANSITIONS;

/** Une offre clôturée, expirée ou rejetée n'est plus modifiable. */
export const EDITABLE_STATUSES: readonly JobStatus[] = ["brouillon", "en_validation", "publiee", "suspendue"];

/** Champs dont la modification change le contenu évalué par le score (RM-05). */
export const SCORED_FIELDS = [
  "title",
  "requiredSkills",
  "niceToHaveSkills",
  "blockingCriteria",
  "educationLevel",
  "experienceYears",
  "languages",
  "city",
  "workMode",
  "opportunityType",
  "contractType",
] as const;
