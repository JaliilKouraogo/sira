/** Champs du profil qui comptent pour la complétude, et leur poids sur 100. */
const PARTS: { key: string; weight: number; filled: (p: CompletionInput) => boolean }[] = [
  { key: "headline", weight: 10, filled: (p) => Boolean(p.headline) },
  { key: "city", weight: 10, filled: (p) => Boolean(p.city) },
  { key: "educationLevel", weight: 10, filled: (p) => Boolean(p.educationLevel) },
  { key: "domain", weight: 10, filled: (p) => Boolean(p.domain) },
  { key: "targetJobs", weight: 10, filled: (p) => p.targetJobs.length > 0 },
  { key: "experiences", weight: 15, filled: (p) => p.experienceYears === 0 || count(p.experiences) > 0 },
  { key: "hardSkills", weight: 15, filled: (p) => count(p.hardSkills) >= 3 },
  { key: "languages", weight: 10, filled: (p) => count(p.languages) > 0 },
  { key: "availability", weight: 5, filled: (p) => Boolean(p.availability) },
  { key: "opportunityTypes", weight: 5, filled: (p) => p.opportunityTypes.length > 0 },
];

export interface CompletionInput {
  headline: string | null;
  city: string | null;
  educationLevel: string | null;
  domain: string | null;
  targetJobs: string[];
  experienceYears: number;
  experiences: unknown;
  hardSkills: unknown;
  languages: unknown;
  availability: string | null;
  opportunityTypes: string[];
}

const count = (value: unknown) => (Array.isArray(value) ? value.length : 0);

/** Complétude du profil sur 100 et liste des rubriques à compléter. */
export function completion(profile: CompletionInput): { score: number; missing: string[] } {
  let score = 0;
  const missing: string[] = [];
  for (const part of PARTS) {
    if (part.filled(profile)) score += part.weight;
    else missing.push(part.key);
  }
  return { score, missing };
}
