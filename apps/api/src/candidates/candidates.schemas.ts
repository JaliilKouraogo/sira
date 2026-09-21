import {
  AVAILABILITIES,
  CONTRACT_TYPES,
  DOMAINS,
  EDUCATION_LEVELS,
  LANGUAGE_LEVELS,
  OPPORTUNITY_TYPES,
  PROFILE_VISIBILITIES,
  WORK_MODES,
} from "@sira/shared";
import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);

export const SkillSchema = z.object({
  name: text(60),
  level: z.enum(["debutant", "intermediaire", "avance", "expert"]).optional(),
});

export const LanguageSchema = z.object({ name: text(40), level: z.enum(LANGUAGE_LEVELS) });

/**
 * Profil candidat de la section 5.3 du cahier des charges technique. Aucun
 * champ ne porte sur l'âge, le sexe, la situation familiale, l'origine, la
 * religion ou le handicap : ces données ne sont ni demandées ni stockées.
 */
export const UpdateCandidateProfileSchema = z
  .object({
    headline: text(160),
    country: text(80),
    city: text(80),
    searchZones: z.array(text(80)).max(10),
    professionalSituation: text(80),
    educationLevel: z.enum(EDUCATION_LEVELS),
    educations: z.array(z.object({ degree: text(160), school: text(160), year: text(10) })).max(15),
    domain: z.enum(DOMAINS),
    targetJobs: z.array(text(80)).max(10),
    experienceYears: z.number().int().min(0).max(60),
    experiences: z
      .array(
        z.object({
          title: text(120),
          company: text(120),
          startDate: text(20),
          endDate: text(20).optional(),
          description: z.string().trim().max(2000).default(""),
        }),
      )
      .max(30),
    hardSkills: z.array(SkillSchema).max(50),
    softSkills: z.array(SkillSchema).max(30),
    languages: z.array(LanguageSchema).max(10),
    opportunityTypes: z.array(z.enum(OPPORTUNITY_TYPES)).max(OPPORTUNITY_TYPES.length),
    contractTypes: z.array(z.enum(CONTRACT_TYPES)).max(CONTRACT_TYPES.length),
    availability: z.enum(AVAILABILITIES),
    salaryExpectation: z.number().int().min(0).max(100_000_000).nullable(),
    geographicMobility: z.boolean(),
    workModes: z.array(z.enum(WORK_MODES)).max(WORK_MODES.length),
    profileVisibility: z.enum(PROFILE_VISIBILITIES),
  })
  .partial();
export type UpdateCandidateProfileInput = z.output<typeof UpdateCandidateProfileSchema>;
