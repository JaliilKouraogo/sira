import {
  APPLICATION_CHANNELS,
  CONTRACT_TYPES,
  DOMAINS,
  EDUCATION_LEVELS,
  JOB_STATUSES,
  JOB_VISIBILITIES,
  OPPORTUNITY_TYPES,
  WORK_MODES,
} from "@sira/shared";
import { z } from "zod";
import { LanguageSchema } from "../candidates/candidates.schemas";
import { PaginationQuery } from "../common/pagination";

const text = (max: number) => z.string().trim().min(1).max(max);
const list = (itemMax: number, max: number) => z.array(text(itemMax)).max(max);

/**
 * Les 18 champs d'une offre (section 7.3 du cahier des charges technique),
 * sans valeur par défaut : la modification partielle ne doit rien écraser.
 * Les valeurs par défaut ne s'appliquent qu'à la création.
 */
const JobFields = z.object({
  title: z.string().trim().min(3, "L'intitulé doit compter au moins 3 caractères.").max(140),
  opportunityType: z.enum(OPPORTUNITY_TYPES),
  contractType: z.enum(CONTRACT_TYPES),
  department: text(80).optional(),
  domain: z.enum(DOMAINS).optional(),
  country: text(80),
  city: z.string().trim().min(2, "La ville est obligatoire.").max(80),
  workMode: z.enum(WORK_MODES),
  summary: z.string().trim().min(20, "Le résumé doit compter au moins 20 caractères.").max(400),
  description: z.string().trim().min(50, "La description doit compter au moins 50 caractères.").max(8000),
  missions: list(300, 15),
  responsibilities: list(300, 15),
  requiredSkills: list(60, 20).min(1, "Indiquez au moins une compétence requise."),
  niceToHaveSkills: list(60, 20),
  blockingCriteria: list(120, 5),
  educationLevel: z.enum(EDUCATION_LEVELS).optional(),
  experienceYears: z.number().int().min(0).max(40),
  languages: z.array(LanguageSchema).max(6),
  salaryMin: z.number().int().min(0).max(100_000_000).optional(),
  salaryMax: z.number().int().min(0).max(100_000_000).optional(),
  deadline: z.coerce.date().optional(),
  requiredDocuments: list(80, 10),
  applicationChannel: z.enum(APPLICATION_CHANNELS),
  applicationTarget: text(300).optional(),
  contact: text(200).optional(),
  visibility: z.enum(JOB_VISIBILITIES),
});

type JobShape = { salaryMin?: number; salaryMax?: number; applicationChannel?: string; applicationTarget?: string };

/** Règles qui croisent plusieurs champs, appliquées à la création comme à la modification. */
function crossFieldChecks(value: JobShape, ctx: z.RefinementCtx): void {
  if (value.salaryMin !== undefined && value.salaryMax !== undefined && value.salaryMin > value.salaryMax) {
    ctx.addIssue({ code: "custom", path: ["salaryMax"], message: "Le salaire maximum doit être supérieur au minimum." });
  }
  if (value.applicationChannel && value.applicationChannel !== "sira" && !value.applicationTarget) {
    ctx.addIssue({
      code: "custom",
      path: ["applicationTarget"],
      message: "Indiquez l'adresse e-mail ou le lien où envoyer les candidatures.",
    });
  }
}

export const CreateJobSchema = JobFields.extend({
  organizationId: z.string().min(1),
  country: JobFields.shape.country.default("Burkina Faso"),
  workMode: JobFields.shape.workMode.default("presentiel"),
  missions: JobFields.shape.missions.default([]),
  responsibilities: JobFields.shape.responsibilities.default([]),
  niceToHaveSkills: JobFields.shape.niceToHaveSkills.default([]),
  blockingCriteria: JobFields.shape.blockingCriteria.default([]),
  experienceYears: JobFields.shape.experienceYears.default(0),
  languages: JobFields.shape.languages.default([]),
  requiredDocuments: JobFields.shape.requiredDocuments.default(["CV"]),
  applicationChannel: JobFields.shape.applicationChannel.default("sira"),
  visibility: JobFields.shape.visibility.default("publique"),
}).superRefine(crossFieldChecks);
export type CreateJobInput = z.output<typeof CreateJobSchema>;

export const UpdateJobSchema = JobFields.partial().superRefine(crossFieldChecks);
export type UpdateJobInput = z.output<typeof UpdateJobSchema>;

/** Recherche publique : 10 filtres (section 6.2 du cahier des charges technique). */
export const JobSearchQuery = PaginationQuery.extend({
  q: z.string().trim().min(1).max(100).optional(),
  city: text(80).optional(),
  country: text(80).optional(),
  domain: z.enum(DOMAINS).optional(),
  opportunityType: z.enum(OPPORTUNITY_TYPES).optional(),
  contractType: z.enum(CONTRACT_TYPES).optional(),
  workMode: z.enum(WORK_MODES).optional(),
  maxExperience: z.coerce.number().int().min(0).max(60).optional(),
  minSalary: z.coerce.number().int().min(0).optional(),
  publishedWithinDays: z.coerce.number().int().min(1).max(365).optional(),
  organizationId: z.string().min(1).optional(),
  sort: z.enum(["-published_at", "published_at", "deadline", "-salary_max"]).default("-published_at"),
});
export type JobSearchInput = z.output<typeof JobSearchQuery>;

export const MyJobsQuery = PaginationQuery.extend({
  status: z.enum(JOB_STATUSES).optional(),
  organizationId: z.string().min(1).optional(),
});
export type MyJobsInput = z.output<typeof MyJobsQuery>;

export const SaveJobSchema = z.object({ jobId: z.string().min(1) });
