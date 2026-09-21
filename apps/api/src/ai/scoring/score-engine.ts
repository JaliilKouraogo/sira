import {
  AVAILABILITIES,
  BLOCKING_CRITERIA_CAP,
  EDUCATION_LEVELS,
  LANGUAGE_LEVELS,
  OPPORTUNITY_TYPE_LABEL,
  SCORE_WEIGHTS,
  type OpportunityType,
  type ScoreComponent,
} from "@sira/shared";
import { normalize } from "../../common/text";

/**
 * Moteur de score de la section 9.4 du plan :
 *
 *   score = 100 × (0,35·compétences + 0,20·expérience + 0,15·formation
 *                + 0,15·localisation + 0,10·langues + 0,05·disponibilité)
 *
 * Un critère indispensable non satisfait plafonne le score à 40.
 *
 * Le calcul est déterministe : les mêmes données donnent toujours le même
 * score, ce qui le rend explicable, vérifiable et reproductible. Le modèle
 * de langue n'intervient qu'ensuite, pour reformuler l'explication ; il ne
 * change jamais le chiffre.
 *
 * Aucune donnée d'identité n'entre dans le calcul : ni nom, ni âge, ni sexe,
 * ni situation familiale, ni origine (section 9.5).
 */
export const SCORE_MODEL = "regles-v1";
export const WEIGHTS_VERSION = "plan-9.4";

export interface ScoreCandidate {
  hardSkills: { name: string }[];
  softSkills: { name: string }[];
  targetJobs: string[];
  experienceYears: number;
  educationLevel: string | null;
  city: string | null;
  searchZones: string[];
  geographicMobility: boolean;
  languages: { name: string; level: string }[];
  availability: string | null;
  opportunityTypes: string[];
}

export interface ScoreJob {
  requiredSkills: string[];
  niceToHaveSkills: string[];
  blockingCriteria: string[];
  educationLevel: string | null;
  experienceYears: number;
  languages: { name: string; level: string }[];
  city: string;
  workMode: string;
  opportunityType: string;
}

export interface ComponentScore {
  weight: number;
  score: number;
  detail: string;
  matched?: string[];
  missing?: string[];
}

export interface RecommendedAction {
  type: "formation" | "profil" | "candidature";
  label: string;
}

export interface ScoreResult {
  score: number;
  breakdown: Record<ScoreComponent, ComponentScore>;
  /** Critères indispensables non satisfaits. */
  blockingCriteria: string[];
  gaps: string[];
  recommendedActions: RecommendedAction[];
}

export function computeScore(candidate: ScoreCandidate, job: ScoreJob): ScoreResult {
  const skills = skillScore(candidate, job);
  const breakdown: Record<ScoreComponent, ComponentScore> = {
    competences: skills,
    experience: experienceScore(candidate, job),
    formation: educationScore(candidate, job),
    localisation: locationScore(candidate, job),
    langues: languageScore(candidate, job),
    disponibilite: availabilityScore(candidate, job),
  };

  const weighted = (Object.keys(SCORE_WEIGHTS) as ScoreComponent[]).reduce(
    (sum, key) => sum + SCORE_WEIGHTS[key] * breakdown[key].score,
    0,
  );
  const blockingCriteria = job.blockingCriteria.filter((criterion) => !satisfies(candidate, criterion));
  const raw = Math.round(weighted);
  const score = blockingCriteria.length > 0 ? Math.min(raw, BLOCKING_CRITERIA_CAP) : raw;

  const gaps = unique([
    ...blockingCriteria,
    ...(skills.missing ?? []),
    ...(breakdown.langues.missing ?? []),
  ]);
  return { score, breakdown, blockingCriteria, gaps, recommendedActions: actions(candidate, job, score, blockingCriteria, skills) };
}

// ---------------------------------------------------------------------------
// Composantes
// ---------------------------------------------------------------------------

function skillScore(candidate: ScoreCandidate, job: ScoreJob): ComponentScore {
  const owned = [...candidate.hardSkills, ...candidate.softSkills].map((s) => s.name);
  const matched = job.requiredSkills.filter((skill) => owned.some((o) => sameSkill(o, skill)));
  const missing = job.requiredSkills.filter((skill) => !matched.includes(skill));
  const bonusMatched = job.niceToHaveSkills.filter((skill) => owned.some((o) => sameSkill(o, skill)));

  const base = job.requiredSkills.length === 0 ? 100 : (100 * matched.length) / job.requiredSkills.length;
  const bonus = job.niceToHaveSkills.length === 0 ? 0 : (10 * bonusMatched.length) / job.niceToHaveSkills.length;
  const score = Math.min(100, Math.round(base + bonus));
  const detail =
    job.requiredSkills.length === 0
      ? "Aucune compétence requise n'est précisée."
      : `${matched.length} compétence${plural(matched.length)} requise${plural(matched.length)} sur ${job.requiredSkills.length}` +
        (bonusMatched.length > 0 ? `, et ${bonusMatched.length} appréciée${plural(bonusMatched.length)} en plus.` : ".");
  return { weight: SCORE_WEIGHTS.competences, score, detail, matched: [...matched, ...bonusMatched], missing };
}

function experienceScore(candidate: ScoreCandidate, job: ScoreJob): ComponentScore {
  const required = job.experienceYears;
  const owned = candidate.experienceYears;
  const score = required === 0 ? 100 : Math.min(100, Math.round((100 * owned) / required));
  const detail =
    required === 0
      ? "Aucune expérience minimale exigée."
      : `${years(required)} requis, ${years(owned)} déclaré${plural(owned)}.`;
  return { weight: SCORE_WEIGHTS.experience, score, detail };
}

function educationScore(candidate: ScoreCandidate, job: ScoreJob): ComponentScore {
  const weight = SCORE_WEIGHTS.formation;
  if (!job.educationLevel) return { weight, score: 100, detail: "Aucun niveau d'études exigé." };
  if (!candidate.educationLevel) return { weight, score: 40, detail: "Niveau d'études non renseigné dans votre profil." };
  const gap = rank(EDUCATION_LEVELS, candidate.educationLevel) - rank(EDUCATION_LEVELS, job.educationLevel);
  const score = gap >= 0 ? 100 : gap === -1 ? 60 : gap === -2 ? 30 : 0;
  const detail =
    gap >= 0
      ? `Niveau demandé (${job.educationLevel}) atteint.`
      : `Niveau demandé : ${job.educationLevel} ; niveau déclaré : ${candidate.educationLevel}.`;
  return { weight, score, detail };
}

function locationScore(candidate: ScoreCandidate, job: ScoreJob): ComponentScore {
  const weight = SCORE_WEIGHTS.localisation;
  if (job.workMode === "teletravail") return { weight, score: 100, detail: "Poste en télétravail." };
  if (candidate.city && same(candidate.city, job.city)) return { weight, score: 100, detail: `Vous êtes à ${job.city}.` };
  if (candidate.searchZones.some((zone) => same(zone, job.city))) {
    return { weight, score: 90, detail: `${job.city} fait partie de vos zones de recherche.` };
  }
  if (candidate.geographicMobility) {
    return { weight, score: 70, detail: `Poste à ${job.city}, mobilité géographique déclarée.` };
  }
  if (!candidate.city) return { weight, score: 40, detail: "Ville non renseignée dans votre profil." };
  return { weight, score: 20, detail: `Poste à ${job.city}, loin de ${candidate.city}, sans mobilité déclarée.` };
}

function languageScore(candidate: ScoreCandidate, job: ScoreJob): ComponentScore {
  const weight = SCORE_WEIGHTS.langues;
  if (job.languages.length === 0) return { weight, score: 100, detail: "Aucune langue exigée." };
  const missing: string[] = [];
  const matched: string[] = [];
  const scores = job.languages.map((required) => {
    const owned = candidate.languages.find((l) => same(l.name, required.name));
    const label = `${required.name} (${required.level.toLowerCase()})`;
    if (!owned) {
      missing.push(label);
      return 0;
    }
    const need = rank(LANGUAGE_LEVELS, required.level);
    const have = rank(LANGUAGE_LEVELS, owned.level);
    if (have >= need) {
      matched.push(required.name);
      return 100;
    }
    missing.push(label);
    return Math.round((100 * (have + 1)) / (need + 1));
  });
  const score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const detail =
    missing.length === 0 ? "Toutes les langues demandées, au niveau requis." : `À renforcer : ${missing.join(", ")}.`;
  return { weight, score, detail, matched, missing };
}

function availabilityScore(candidate: ScoreCandidate, job: ScoreJob): ComponentScore {
  const weight = SCORE_WEIGHTS.disponibilite;
  const byAvailability: Record<(typeof AVAILABILITIES)[number], number> = {
    Immédiate: 100,
    "Sous 1 mois": 90,
    "Sous 3 mois": 60,
    "À convenir": 70,
  };
  const known = AVAILABILITIES.find((a) => a === candidate.availability);
  let score = known ? byAvailability[known] : 50;
  const parts = [known ? `Disponibilité : ${known.toLowerCase()}.` : "Disponibilité non renseignée."];
  if (candidate.opportunityTypes.length > 0 && !candidate.opportunityTypes.includes(job.opportunityType)) {
    score = Math.round(score / 2);
    const label = OPPORTUNITY_TYPE_LABEL[job.opportunityType as OpportunityType] ?? job.opportunityType;
    parts.push(`Vous ne recherchez pas ce type d'opportunité (${label.toLowerCase()}).`);
  }
  return { weight, score, detail: parts.join(" ") };
}

// ---------------------------------------------------------------------------
// Actions recommandées
// ---------------------------------------------------------------------------

function actions(
  candidate: ScoreCandidate,
  job: ScoreJob,
  score: number,
  blocking: string[],
  skills: ComponentScore,
): RecommendedAction[] {
  const list: RecommendedAction[] = [];
  for (const skill of (skills.missing ?? []).slice(0, 2)) {
    list.push({ type: "formation", label: `Vous former : ${skill}` });
  }
  if (candidate.hardSkills.length < 3) {
    list.push({ type: "profil", label: "Ajouter vos compétences à votre profil" });
  }
  if (!candidate.educationLevel && job.educationLevel) {
    list.push({ type: "profil", label: "Indiquer votre niveau d'études" });
  }
  if (job.languages.length > 0 && candidate.languages.length === 0) {
    list.push({ type: "profil", label: "Indiquer les langues que vous parlez" });
  }
  if (score >= 60 && blocking.length === 0) {
    list.push({ type: "candidature", label: "Préparer votre candidature" });
  }
  return list.slice(0, 4);
}

// ---------------------------------------------------------------------------
// Comparaisons tolérantes
// ---------------------------------------------------------------------------

/** Mots vides ignorés dans la comparaison des compétences. */
const STOP = new Set(["de", "des", "du", "d", "la", "le", "les", "l", "et", "en", "a", "au", "aux", "pour", "sur"]);

/** « stocks » et « stock » se valent ; un mot court reste tel quel. */
const stem = (word: string) => (word.length > 3 ? word.replace(/(s|x)$/, "") : word);

function tokens(value: string): string[] {
  return normalize(value)
    .split(" ")
    .filter((w) => w && !STOP.has(w))
    .map(stem);
}

/**
 * Deux libellés désignent la même compétence si tous les mots significatifs
 * du plus court figurent dans le plus long : « Excel » couvre « Excel avancé »,
 * « Gestion des stocks » couvre « Gestion de stock ».
 */
export function sameSkill(a: string, b: string): boolean {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.length === 0 || tb.length === 0) return false;
  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  return short.every((w) => long.includes(w));
}

/** Un critère indispensable est satisfait s'il correspond à une compétence, une langue ou un métier du profil. */
function satisfies(candidate: ScoreCandidate, criterion: string): boolean {
  const owned = [
    ...candidate.hardSkills.map((s) => s.name),
    ...candidate.softSkills.map((s) => s.name),
    ...candidate.languages.map((l) => l.name),
    ...candidate.targetJobs,
    ...(candidate.educationLevel ? [candidate.educationLevel] : []),
  ];
  return owned.some((o) => sameSkill(o, criterion));
}

const same = (a: string, b: string) => normalize(a) === normalize(b);
const rank = (scale: readonly string[], value: string) => Math.max(0, scale.findIndex((v) => same(v, value)));
const plural = (n: number) => (n > 1 ? "s" : "");
const years = (n: number) => `${n} an${plural(n)}`;
const unique = (values: string[]) => [...new Set(values)];
