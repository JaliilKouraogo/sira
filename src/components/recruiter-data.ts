/**
 * Jeu de données de l'espace recruteur.
 *
 * Les entités réelles (organisation, offres, candidature app_02, événements de
 * contact, scores) proviennent toutes de `@/data/queries`. Ce module ajoute
 * par-dessus le vivier de démonstration que les écrans Pro exigent et que les
 * fixtures ne portent pas encore : plusieurs candidats sur une même offre pour
 * le classement, un vivier de talents pour la recherche, et l'abonnement
 * recruteur « Pro, offre de lancement ».
 *
 * Le jour où l'API existe, ces constantes disparaissent au profit de
 * `GET /recruiters/me/applications`, `GET /talents` et
 * `GET /recruiters/me/subscription`.
 */

import {
  getApplication,
  getCandidateProfile,
  getContactEvents,
  getJobById,
  getRecruiterJobs,
  getScore,
} from "@/data/queries";
import { SCORE_WEIGHTS, BLOCKING_CRITERIA_CAP } from "@/lib/enums";
import type {
  ApplicationChannel,
  MembershipRole,
  OpportunityType,
  ProfileVisibility,
  ReviewStatus,
  ScoreComponent,
  WorkMode,
} from "@/lib/enums";
import type {
  ApplicationEvent,
  ContactEvent,
  Job,
  MatchScore,
  Payment,
  Subscription,
  UsageCounter,
} from "@/lib/types";

export const RECRUITER_ORG_ID = "org_01";
export const RECRUITER_NAME = "Idrissa Compaoré";
export const RECRUITER_EMAIL = "recrutement@sahelagro.bf";
export const RECRUITER_PHONE = "+226 25 30 40 50";

/** Date de référence de la démonstration, alignée sur les fixtures. */
export const TODAY = "2026-09-12";

function shiftDays(delta: number): string {
  const d = new Date(`${TODAY}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export const dAgo = (n: number) => shiftDays(-n);
export const dIn = (n: number) => shiftDays(n);

// --------------------------------------------------------------------------
// Vivier de talents — GET /talents
// --------------------------------------------------------------------------

export interface RecruiterTalent {
  id: string;
  /** Identité réelle : jamais affichée tant que le profil n'est pas débloqué. */
  firstName: string;
  lastName: string;
  /** Forme anonymisée affichée par défaut dans la recherche de talents. */
  anonymousName: string;
  avatarInitials: string;
  color: string;
  headline: string;
  domain: string;
  city: string;
  mobility: string[];
  experienceYears: number;
  educationLevel: string;
  availability: string;
  opportunityTypes: OpportunityType[];
  workModes: WorkMode[];
  skills: string[];
  languages: string[];
  visibility: ProfileVisibility;
  lastActiveAt: string;
  email: string;
  phone: string;
}

const BLUE_700 = "var(--color-blue-700)";
const BLUE_800 = "var(--color-blue-800)";
const BLUE_600 = "var(--color-blue-600)";
const BLUE_900 = "var(--color-blue-900)";
const BLUE_500 = "var(--color-blue-500)";

/** Le profil candidat réel des fixtures, projeté dans le format du vivier. */
function awaTalent(): RecruiterTalent {
  const p = getCandidateProfile();
  return {
    id: "cnd_01",
    firstName: "Awa",
    lastName: "Sawadogo",
    anonymousName: "A. S.",
    avatarInitials: "AS",
    color: BLUE_600,
    headline: p.headline,
    domain: p.domain,
    city: p.city,
    mobility: p.searchZones,
    experienceYears: p.experienceYears,
    educationLevel: p.educationLevel,
    availability: p.availability,
    opportunityTypes: p.opportunityTypes,
    workModes: p.workModes,
    skills: [...p.hardSkills.map((s) => s.name), ...p.softSkills.map((s) => s.name)],
    languages: p.languages.map((l) => `${l.name} (${l.level})`),
    visibility: p.profileVisibility,
    lastActiveAt: dAgo(1),
    email: "awa.sawadogo@example.bf",
    phone: "+226 70 11 22 33",
  };
}

const DEMO_TALENTS: RecruiterTalent[] = [
  {
    id: "tal_02",
    firstName: "Karim",
    lastName: "Ouédraogo",
    anonymousName: "K. O.",
    avatarInitials: "KO",
    color: BLUE_800,
    headline: "Responsable d'entrepôt agroalimentaire, 7 ans d'expérience",
    domain: "Logistique & Transport",
    city: "Bobo-Dioulasso",
    mobility: ["Bobo-Dioulasso", "Banfora"],
    experienceYears: 7,
    educationLevel: "Master (Bac+5)",
    availability: "Sous 1 mois",
    opportunityTypes: ["emploi"],
    workModes: ["presentiel", "hybride"],
    skills: ["Gestion de stock", "Management d'équipe", "Planification", "Excel avancé", "SAP MM", "HACCP"],
    languages: ["Français (Courant)", "Dioula (Langue maternelle)", "Anglais (Professionnel)"],
    visibility: "anonyme",
    lastActiveAt: dAgo(2),
    email: "k.ouedraogo@example.bf",
    phone: "+226 70 22 44 66",
  },
  {
    id: "tal_03",
    firstName: "Salimata",
    lastName: "Zongo",
    anonymousName: "S. Z.",
    avatarInitials: "SZ",
    color: BLUE_700,
    headline: "Coordinatrice supply chain, filière mangue et anacarde",
    domain: "Logistique & Transport",
    city: "Ouagadougou",
    mobility: ["Ouagadougou", "Bobo-Dioulasso"],
    experienceYears: 6,
    educationLevel: "Licence (Bac+3)",
    availability: "Sous 3 mois",
    opportunityTypes: ["emploi"],
    workModes: ["presentiel"],
    skills: ["Planification", "Gestion de stock", "Excel avancé", "Négociation transporteurs", "Management d'équipe"],
    languages: ["Français (Courant)", "Mooré (Langue maternelle)", "Anglais (Scolaire)"],
    visibility: "complet",
    lastActiveAt: dAgo(5),
    email: "s.zongo@example.bf",
    phone: "+226 76 14 28 90",
  },
  {
    id: "tal_04",
    firstName: "Moussa",
    lastName: "Kaboré",
    anonymousName: "M. K.",
    avatarInitials: "MK",
    color: BLUE_900,
    headline: "Magasinier cariste, certifié CACES 3",
    domain: "Logistique & Transport",
    city: "Bobo-Dioulasso",
    mobility: ["Bobo-Dioulasso"],
    experienceYears: 3,
    educationLevel: "CAP / BEP",
    availability: "Immédiate",
    opportunityTypes: ["emploi"],
    workModes: ["presentiel"],
    skills: ["Gestion de stock", "Rigueur", "CACES", "Préparation de commandes"],
    languages: ["Français (Scolaire)", "Dioula (Langue maternelle)"],
    visibility: "anonyme",
    lastActiveAt: dAgo(1),
    email: "m.kabore@example.bf",
    phone: "+226 71 33 55 77",
  },
  {
    id: "tal_05",
    firstName: "Aminata",
    lastName: "Traoré",
    anonymousName: "A. T.",
    avatarInitials: "AT",
    color: BLUE_600,
    headline: "Assistante de direction bilingue, 4 ans en industrie",
    domain: "Administration & Secrétariat",
    city: "Bobo-Dioulasso",
    mobility: ["Bobo-Dioulasso", "Ouagadougou"],
    experienceYears: 4,
    educationLevel: "BTS / DUT (Bac+2)",
    availability: "Sous 1 mois",
    opportunityTypes: ["emploi"],
    workModes: ["presentiel", "hybride"],
    skills: ["Secrétariat", "Word", "Excel", "Rédaction", "Organisation d'agenda"],
    languages: ["Français (Courant)", "Anglais (Professionnel)", "Dioula (Courant)"],
    visibility: "complet",
    lastActiveAt: dAgo(9),
    email: "a.traore@example.bf",
    phone: "+226 78 40 11 22",
  },
  {
    id: "tal_06",
    firstName: "Issouf",
    lastName: "Sanou",
    anonymousName: "I. S.",
    avatarInitials: "IS",
    color: BLUE_800,
    headline: "Chef d'équipe logistique, corridor Abidjan-Ouagadougou",
    domain: "Logistique & Transport",
    city: "Banfora",
    mobility: ["Banfora", "Bobo-Dioulasso"],
    experienceYears: 9,
    educationLevel: "BTS / DUT (Bac+2)",
    availability: "À convenir",
    opportunityTypes: ["emploi", "mission_freelance"],
    workModes: ["presentiel"],
    skills: ["Management d'équipe", "Gestion de stock", "Négociation transporteurs", "Planification"],
    languages: ["Français (Courant)", "Dioula (Langue maternelle)"],
    visibility: "anonyme",
    lastActiveAt: dAgo(3),
    email: "i.sanou@example.bf",
    phone: "+226 70 88 99 00",
  },
  {
    id: "tal_07",
    firstName: "Rasmata",
    lastName: "Bationo",
    anonymousName: "R. B.",
    avatarInitials: "RB",
    color: BLUE_500,
    headline: "Gestionnaire de stock junior, distribution alimentaire",
    domain: "Logistique & Transport",
    city: "Bobo-Dioulasso",
    mobility: ["Bobo-Dioulasso"],
    experienceYears: 2,
    educationLevel: "Baccalauréat",
    availability: "Immédiate",
    opportunityTypes: ["emploi", "stage"],
    workModes: ["presentiel"],
    skills: ["Gestion de stock", "Rigueur", "Excel"],
    languages: ["Français (Courant)", "Dioula (Courant)"],
    visibility: "anonyme",
    lastActiveAt: dAgo(6),
    email: "r.bationo@example.bf",
    phone: "+226 74 52 63 11",
  },
  {
    id: "tal_08",
    firstName: "Hamado",
    lastName: "Diallo",
    anonymousName: "H. D.",
    avatarInitials: "HD",
    color: BLUE_700,
    headline: "Planificateur transport et douane, 5 ans à l'export",
    domain: "Logistique & Transport",
    city: "Ouagadougou",
    mobility: ["Ouagadougou", "Bobo-Dioulasso", "Koudougou"],
    experienceYears: 5,
    educationLevel: "Licence (Bac+3)",
    availability: "Sous 3 mois",
    opportunityTypes: ["emploi"],
    workModes: ["presentiel", "hybride"],
    skills: ["Planification", "Excel avancé", "Négociation transporteurs", "Procédures douanières"],
    languages: ["Français (Courant)", "Anglais (Professionnel)"],
    visibility: "complet",
    lastActiveAt: dAgo(12),
    email: "h.diallo@example.bf",
    phone: "+226 75 61 19 43",
  },
  {
    id: "tal_09",
    firstName: "Fatimata",
    lastName: "Nignan",
    anonymousName: "F. N.",
    avatarInitials: "FN",
    color: BLUE_900,
    headline: "Magasinière, première expérience en unité de conditionnement",
    domain: "Logistique & Transport",
    city: "Bobo-Dioulasso",
    mobility: ["Bobo-Dioulasso"],
    experienceYears: 1,
    educationLevel: "CAP / BEP",
    availability: "Immédiate",
    opportunityTypes: ["emploi", "stage"],
    workModes: ["presentiel"],
    skills: ["Gestion de stock", "Rigueur"],
    languages: ["Français (Scolaire)", "Dioula (Langue maternelle)"],
    visibility: "anonyme",
    lastActiveAt: dAgo(4),
    email: "f.nignan@example.bf",
    phone: "+226 72 14 77 08",
  },
  {
    id: "tal_10",
    firstName: "Boukary",
    lastName: "Yaméogo",
    anonymousName: "B. Y.",
    avatarInitials: "BY",
    color: BLUE_600,
    headline: "Responsable qualité et sécurité alimentaire, 8 ans",
    domain: "Agriculture & Agroalimentaire",
    city: "Bobo-Dioulasso",
    mobility: ["Bobo-Dioulasso", "Banfora"],
    experienceYears: 8,
    educationLevel: "Master (Bac+5)",
    availability: "Sous 3 mois",
    opportunityTypes: ["emploi"],
    workModes: ["presentiel"],
    skills: ["HACCP", "Management d'équipe", "Traçabilité", "Excel avancé"],
    languages: ["Français (Courant)", "Anglais (Professionnel)", "Dioula (Courant)"],
    visibility: "complet",
    lastActiveAt: dAgo(20),
    email: "b.yameogo@example.bf",
    phone: "+226 70 07 35 21",
  },
  {
    id: "tal_11",
    firstName: "Clarisse",
    lastName: "Kaboré",
    anonymousName: "C. K.",
    avatarInitials: "CK",
    color: BLUE_800,
    headline: "Secrétaire de direction, 5 ans auprès d'un comité de direction",
    domain: "Administration & Secrétariat",
    city: "Bobo-Dioulasso",
    mobility: ["Bobo-Dioulasso"],
    experienceYears: 5,
    educationLevel: "BTS / DUT (Bac+2)",
    availability: "Sous 1 mois",
    opportunityTypes: ["emploi"],
    workModes: ["presentiel"],
    skills: ["Secrétariat", "Word", "Excel", "Rédaction"],
    languages: ["Français (Courant)", "Mooré (Langue maternelle)"],
    visibility: "anonyme",
    lastActiveAt: dAgo(15),
    email: "c.kabore@example.bf",
    phone: "+226 76 88 12 34",
  },
  {
    id: "tal_12",
    firstName: "Ousmane",
    lastName: "Barry",
    anonymousName: "O. B.",
    avatarInitials: "OB",
    color: BLUE_500,
    headline: "Contrôleur de gestion industrielle",
    domain: "Banque, Finance & Assurance",
    city: "Ouagadougou",
    mobility: ["Ouagadougou"],
    experienceYears: 6,
    educationLevel: "Master (Bac+5)",
    availability: "À convenir",
    opportunityTypes: ["emploi"],
    workModes: ["hybride"],
    skills: ["Excel avancé", "Contrôle de gestion", "Reporting"],
    languages: ["Français (Courant)", "Anglais (Professionnel)"],
    /** Profil invisible : il n'apparaît jamais dans les résultats. */
    visibility: "invisible",
    lastActiveAt: dAgo(2),
    email: "o.barry@example.bf",
    phone: "+226 70 45 67 89",
  },
  {
    id: "tal_13",
    firstName: "Alizeta",
    lastName: "Congo",
    anonymousName: "A. C.",
    avatarInitials: "AC",
    color: BLUE_700,
    headline: "Agent de transit, spécialiste import agro",
    domain: "Logistique & Transport",
    city: "Ouagadougou",
    mobility: ["Ouagadougou", "Bobo-Dioulasso"],
    experienceYears: 4,
    educationLevel: "Licence (Bac+3)",
    availability: "Sous 1 mois",
    opportunityTypes: ["emploi"],
    workModes: ["presentiel"],
    skills: ["Procédures douanières", "Gestion de stock", "Excel"],
    languages: ["Français (Courant)", "Mooré (Courant)"],
    visibility: "invisible",
    lastActiveAt: dAgo(7),
    email: "a.congo@example.bf",
    phone: "+226 78 23 45 67",
  },
  // --- Profils du vivier qui n'ont postulé à aucune offre de l'organisation :
  // ils restent anonymes tant qu'ils n'ont pas accepté une prise de contact.
  {
    id: "tal_14",
    firstName: "Adama",
    lastName: "Sorgho",
    anonymousName: "A. S.",
    avatarInitials: "AS",
    color: BLUE_700,
    headline: "Responsable approvisionnements, filière céréales",
    domain: "Logistique & Transport",
    city: "Bobo-Dioulasso",
    mobility: ["Bobo-Dioulasso", "Dédougou"],
    experienceYears: 6,
    educationLevel: "Licence (Bac+3)",
    availability: "Sous 3 mois",
    opportunityTypes: ["emploi"],
    workModes: ["presentiel"],
    skills: ["Planification", "Gestion de stock", "Négociation transporteurs", "Excel avancé"],
    languages: ["Français (Courant)", "Dioula (Langue maternelle)"],
    visibility: "anonyme",
    lastActiveAt: dAgo(3),
    email: "a.sorgho@example.bf",
    phone: "+226 70 31 42 53",
  },
  {
    id: "tal_15",
    firstName: "Djeneba",
    lastName: "Coulibaly",
    anonymousName: "D. C.",
    avatarInitials: "DC",
    color: BLUE_500,
    headline: "Assistante logistique, deux campagnes en agro-industrie",
    domain: "Logistique & Transport",
    city: "Banfora",
    mobility: ["Banfora", "Bobo-Dioulasso"],
    experienceYears: 2,
    educationLevel: "BTS / DUT (Bac+2)",
    availability: "Immédiate",
    opportunityTypes: ["emploi", "stage"],
    workModes: ["presentiel"],
    skills: ["Gestion de stock", "Rigueur", "Excel"],
    languages: ["Français (Courant)", "Dioula (Courant)"],
    visibility: "anonyme",
    lastActiveAt: dAgo(2),
    email: "d.coulibaly@example.bf",
    phone: "+226 76 22 84 19",
  },
  {
    id: "tal_16",
    firstName: "Souleymane",
    lastName: "Zoungrana",
    anonymousName: "S. Z.",
    avatarInitials: "SZ",
    color: BLUE_900,
    headline: "Cariste confirmé, CACES 1-3-5",
    domain: "Logistique & Transport",
    city: "Bobo-Dioulasso",
    mobility: ["Bobo-Dioulasso"],
    experienceYears: 4,
    educationLevel: "CAP / BEP",
    availability: "Immédiate",
    opportunityTypes: ["emploi"],
    workModes: ["presentiel"],
    skills: ["CACES", "Gestion de stock", "Rigueur", "Préparation de commandes"],
    languages: ["Français (Scolaire)", "Mooré (Langue maternelle)"],
    visibility: "complet",
    lastActiveAt: dAgo(1),
    email: "s.zoungrana@example.bf",
    phone: "+226 71 90 12 34",
  },
  {
    id: "tal_17",
    firstName: "Nafissatou",
    lastName: "Dicko",
    anonymousName: "N. D.",
    avatarInitials: "ND",
    color: BLUE_600,
    headline: "Chargée de conformité export agroalimentaire",
    domain: "Agriculture & Agroalimentaire",
    city: "Ouagadougou",
    mobility: ["Ouagadougou", "Bobo-Dioulasso"],
    experienceYears: 5,
    educationLevel: "Master (Bac+5)",
    availability: "Sous 1 mois",
    opportunityTypes: ["emploi"],
    workModes: ["presentiel", "hybride"],
    skills: ["HACCP", "Traçabilité", "Excel avancé", "Procédures douanières"],
    languages: ["Français (Courant)", "Anglais (Courant)"],
    visibility: "anonyme",
    lastActiveAt: dAgo(8),
    email: "n.dicko@example.bf",
    phone: "+226 78 65 43 21",
  },
  {
    id: "tal_18",
    firstName: "Étienne",
    lastName: "Kaboré",
    anonymousName: "É. K.",
    avatarInitials: "EK",
    color: BLUE_800,
    headline: "Secrétaire administratif, huit ans en industrie",
    domain: "Administration & Secrétariat",
    city: "Bobo-Dioulasso",
    mobility: ["Bobo-Dioulasso", "Banfora"],
    experienceYears: 8,
    educationLevel: "BTS / DUT (Bac+2)",
    availability: "À convenir",
    opportunityTypes: ["emploi"],
    workModes: ["presentiel"],
    skills: ["Secrétariat", "Word", "Excel", "Rédaction", "Organisation d'agenda"],
    languages: ["Français (Courant)", "Dioula (Courant)"],
    visibility: "anonyme",
    lastActiveAt: dAgo(11),
    email: "e.kabore@example.bf",
    phone: "+226 70 74 85 96",
  },
  {
    id: "tal_19",
    firstName: "Mariam",
    lastName: "Sawadogo",
    anonymousName: "M. S.",
    avatarInitials: "MS",
    color: BLUE_700,
    headline: "Coordinatrice qualité, débutante en agro-industrie",
    domain: "Agriculture & Agroalimentaire",
    city: "Koudougou",
    mobility: ["Koudougou", "Ouagadougou", "Bobo-Dioulasso"],
    experienceYears: 1,
    educationLevel: "Licence (Bac+3)",
    availability: "Immédiate",
    opportunityTypes: ["emploi", "stage", "alternance"],
    workModes: ["presentiel"],
    skills: ["HACCP", "Rigueur", "Excel"],
    languages: ["Français (Courant)", "Mooré (Langue maternelle)"],
    visibility: "complet",
    lastActiveAt: dAgo(5),
    email: "m.sawadogo@example.bf",
    phone: "+226 74 11 22 33",
  },
];

export function getTalentPool(): RecruiterTalent[] {
  return [awaTalent(), ...DEMO_TALENTS];
}

export function getTalentById(id: string): RecruiterTalent | undefined {
  return getTalentPool().find((t) => t.id === id);
}

// --------------------------------------------------------------------------
// Scores de compatibilité pour le vivier
// --------------------------------------------------------------------------

type ScoreSeed = Record<ScoreComponent, number>;

function buildMatchScore(
  talent: RecruiterTalent,
  job: Job,
  seed: ScoreSeed,
  blockingCriteria: string[] = [],
): MatchScore {
  const matched = job.requiredSkills.filter((s) => talent.skills.includes(s));
  const missing = job.requiredSkills.filter((s) => !talent.skills.includes(s));
  const niceMissing = job.niceToHaveSkills.filter((s) => !talent.skills.includes(s));
  const mobile = talent.mobility.includes(job.city);

  const raw =
    Object.entries(seed).reduce(
      (sum, [key, value]) => sum + value * SCORE_WEIGHTS[key as ScoreComponent],
      0,
    ) / 1;
  const score = blockingCriteria.length > 0 ? Math.min(BLOCKING_CRITERIA_CAP, Math.round(raw)) : Math.round(raw);

  return {
    id: `ms_${talent.id}_${job.id}`,
    candidateId: talent.id,
    jobId: job.id,
    score,
    breakdown: {
      competences: {
        weight: SCORE_WEIGHTS.competences,
        score: seed.competences,
        detail: `${matched.length} des ${job.requiredSkills.length} compétences requises sont retrouvées dans le dossier.`,
        matched,
        missing,
      },
      experience: {
        weight: SCORE_WEIGHTS.experience,
        score: seed.experience,
        detail: `${job.experienceYears} an${job.experienceYears > 1 ? "s" : ""} demandé${
          job.experienceYears > 1 ? "s" : ""
        }, ${talent.experienceYears} an${talent.experienceYears > 1 ? "s" : ""} constaté${
          talent.experienceYears > 1 ? "s" : ""
        } sur le parcours déclaré.`,
      },
      formation: {
        weight: SCORE_WEIGHTS.formation,
        score: seed.formation,
        detail: `${job.educationLevel} demandé, ${talent.educationLevel} déclaré.`,
      },
      localisation: {
        weight: SCORE_WEIGHTS.localisation,
        score: seed.localisation,
        detail:
          talent.city === job.city
            ? `Candidat déjà installé à ${job.city}.`
            : `Poste à ${job.city}, candidat à ${talent.city}${mobile ? ", mobilité déclarée sur la ville du poste" : ", mobilité non déclarée"}.`,
      },
      langues: {
        weight: SCORE_WEIGHTS.langues,
        score: seed.langues,
        detail: `Langues déclarées : ${talent.languages.join(", ")}.`,
      },
      disponibilite: {
        weight: SCORE_WEIGHTS.disponibilite,
        score: seed.disponibilite,
        detail: `Disponibilité ${talent.availability.toLowerCase()}, pour un poste en ${job.city}.`,
      },
    },
    blockingCriteria,
    gaps: [...missing, ...niceMissing],
    recommendedActions: [],
    model: "claude-opus-5",
    computedAt: dAgo(1),
  };
}

// --------------------------------------------------------------------------
// Candidatures reçues — GET /recruiters/me/applications
// --------------------------------------------------------------------------

export interface RecruiterApplication {
  id: string;
  jobId: string;
  talent: RecruiterTalent;
  score: MatchScore;
  reviewStatus: ReviewStatus;
  isShortlisted: boolean;
  submittedAt: string;
  channel: ApplicationChannel;
  documents: { fileName: string; label: string; sizeKb: number }[];
  /** Résumé rédigé par l'IA — proposition de lecture, jamais une décision. */
  aiSummary: string;
  attentionPoints: string[];
  relevantExperience: string;
  notes: { author: string; at: string; text: string }[];
  history: ApplicationEvent[];
  /** Les coordonnées sont visibles : le candidat a postulé à une offre de l'organisation. */
  contactUnlocked: boolean;
}

interface DemoApplicationSeed {
  id: string;
  talentId: string;
  jobId: string;
  seed: ScoreSeed;
  blocking?: string[];
  reviewStatus: ReviewStatus;
  shortlisted?: boolean;
  daysAgo: number;
  channel?: ApplicationChannel;
  aiSummary: string;
  attentionPoints: string[];
  relevantExperience: string;
  notes?: { author: string; at: string; text: string }[];
  documents?: { fileName: string; label: string; sizeKb: number }[];
}

const CV = (name: string, kb: number) => ({ fileName: name, label: "CV", sizeKb: kb });
const LM = (name: string, kb: number) => ({ fileName: name, label: "Lettre de motivation", sizeKb: kb });

const DEMO_APPLICATIONS: DemoApplicationSeed[] = [
  {
    id: "app_r01",
    talentId: "tal_02",
    jobId: "job_01",
    seed: { competences: 95, experience: 100, formation: 100, localisation: 100, langues: 85, disponibilite: 90 },
    reviewStatus: "entretien",
    shortlisted: true,
    daysAgo: 3,
    aiSummary:
      "Profil le plus proche du poste sur les quatre compétences requises. Sept ans en entrepôt agroalimentaire, dont trois à la tête d'une équipe de quinze personnes chez un transformateur de Banfora. Maîtrise annoncée de SAP MM et certification HACCP, deux éléments listés comme souhaités dans l'offre. Réside déjà à Bobo-Dioulasso, ce qui supprime la question de la mobilité. Anglais professionnel déclaré, cohérent avec les échanges sur le corridor.",
    attentionPoints: [
      "Le CV mentionne un départ en cours de campagne chez l'employeur précédent, sans motif précisé.",
      "La certification HACCP est annoncée mais aucun justificatif n'est joint au dossier.",
    ],
    relevantExperience:
      "Responsable d'entrepôt, Agro Transformation Banfora, 2022-2026 : pilotage de 4 000 palettes par campagne, encadrement de 15 personnes, mise en place de la traçabilité des lots export.",
    notes: [
      {
        author: "Idrissa Compaoré",
        at: dAgo(2),
        text: "Entretien téléphonique concluant. À recevoir sur site pour visiter l'unité de conditionnement.",
      },
      {
        author: "Mariam Ouédraogo",
        at: dAgo(1),
        text: "Prétentions annoncées à 700 000 FCFA, au-dessus de la fourchette. À arbitrer avec la direction.",
      },
    ],
    documents: [CV("CV_K_Ouedraogo_Responsable_logistique.pdf", 412), LM("Lettre_K_Ouedraogo.pdf", 118)],
  },
  {
    id: "app_r02",
    talentId: "tal_03",
    jobId: "job_01",
    seed: { competences: 85, experience: 95, formation: 100, localisation: 60, langues: 60, disponibilite: 60 },
    reviewStatus: "shortlist",
    shortlisted: true,
    daysAgo: 5,
    aiSummary:
      "Six ans de coordination supply chain sur les filières mangue et anacarde, donc une connaissance directe de la saisonnalité qui structure l'activité de l'unité. Quatre compétences requises sur quatre sont présentes, avec une expérience de planification à l'échelle multi-sites. Réside à Ouagadougou et déclare Bobo-Dioulasso dans ses zones de recherche. Disponibilité annoncée sous trois mois.",
    attentionPoints: [
      "Disponibilité sous trois mois, alors que le poste est à pourvoir pour le démarrage de la campagne.",
      "Anglais scolaire déclaré, en deçà du niveau professionnel demandé dans l'offre.",
    ],
    relevantExperience:
      "Coordinatrice supply chain, Faso Anacarde, 2021-2026 : planification des approvisionnements de trois sites, réduction de 18 % des coûts de transport sur le corridor.",
    notes: [
      {
        author: "Idrissa Compaoré",
        at: dAgo(3),
        text: "Bon profil, à confirmer sur la question du délai de disponibilité avant de la convoquer.",
      },
    ],
    documents: [CV("CV_S_Zongo.pdf", 356), LM("Lettre_S_Zongo.pdf", 96)],
  },
  {
    id: "app_r03",
    talentId: "tal_06",
    jobId: "job_01",
    seed: { competences: 80, experience: 100, formation: 70, localisation: 70, langues: 55, disponibilite: 55 },
    reviewStatus: "a_examiner",
    daysAgo: 6,
    aiSummary:
      "Neuf ans d'expérience opérationnelle sur le corridor Abidjan-Ouagadougou, avec un vrai savoir-faire de négociation transporteurs, explicitement cité dans les missions de l'offre. Encadrement d'équipe confirmé. Le niveau de formation déclaré, BTS, est en dessous de la licence demandée, mais l'ancienneté compense partiellement sur la grille de pondération.",
    attentionPoints: [
      "Niveau de formation inférieur au niveau demandé dans l'offre.",
      "Disponibilité « à convenir », sans date ferme.",
      "Réside à Banfora, à 85 km du site.",
    ],
    relevantExperience:
      "Chef d'équipe logistique, Transit Sanou & Fils, 2017-2026 : suivi de 40 rotations mensuelles, gestion des litiges douaniers, encadrement de 8 chauffeurs.",
    documents: [CV("CV_I_Sanou.pdf", 288)],
  },
  {
    id: "app_r04",
    talentId: "tal_08",
    jobId: "job_01",
    seed: { competences: 65, experience: 90, formation: 100, localisation: 55, langues: 85, disponibilite: 50 },
    reviewStatus: "recue",
    daysAgo: 2,
    aiSummary:
      "Cinq ans de planification transport et de procédures douanières à l'export, un angle complémentaire du poste mais pas identique : la gestion de stock et le management d'équipe sont peu documentés dans le dossier. Formation et langues au niveau demandé. Mobilité déclarée sur Bobo-Dioulasso.",
    attentionPoints: [
      "Management d'équipe non documenté, alors qu'il s'agit d'une compétence requise.",
      "Disponibilité sous trois mois.",
    ],
    relevantExperience:
      "Planificateur transport, Sahel Export Services, 2021-2026 : ordonnancement des expéditions, dédouanement, relation avec trois transitaires.",
    documents: [CV("CV_H_Diallo.pdf", 402), LM("Lettre_H_Diallo.pdf", 87)],
  },
  {
    id: "app_r05",
    talentId: "tal_10",
    jobId: "job_01",
    seed: { competences: 50, experience: 95, formation: 100, localisation: 100, langues: 85, disponibilite: 55 },
    reviewStatus: "recue",
    daysAgo: 1,
    aiSummary:
      "Profil qualité et sécurité alimentaire, pas logistique. Deux compétences requises sur quatre seulement, mais une expertise HACCP et traçabilité directement utile à l'activité export de l'unité. Résidence sur place et huit ans d'ancienneté dans la filière.",
    attentionPoints: [
      "Deux compétences requises absentes du dossier : gestion de stock et planification.",
      "Le candidat semble viser un poste qualité plutôt que le poste logistique publié.",
    ],
    relevantExperience:
      "Responsable QHSE, Mangue du Sud SA, 2018-2026 : certification de la chaîne de conditionnement, audits bailleurs, formation de 60 opérateurs.",
    documents: [CV("CV_B_Yameogo.pdf", 520)],
  },
  {
    id: "app_r06",
    talentId: "tal_07",
    jobId: "job_01",
    seed: { competences: 55, experience: 35, formation: 50, localisation: 100, langues: 70, disponibilite: 100 },
    reviewStatus: "refusee",
    daysAgo: 8,
    aiSummary:
      "Deux ans d'expérience en gestion de stock dans la distribution alimentaire, pour un poste qui en demande quatre et qui comporte l'encadrement de douze personnes. Aucune expérience d'encadrement au dossier. Candidature soignée, disponibilité immédiate, résidence sur place.",
    attentionPoints: [
      "Expérience très en deçà du niveau demandé pour un poste d'encadrement.",
      "Aucune expérience de management déclarée.",
    ],
    relevantExperience:
      "Gestionnaire de stock, Distribution Houet, 2024-2026 : saisie des mouvements, inventaires mensuels, préparation de commandes.",
    notes: [
      {
        author: "Idrissa Compaoré",
        at: dAgo(7),
        text: "Profil intéressant mais trop junior pour ce poste. À recontacter si le poste de magasinier se libère.",
      },
    ],
    documents: [CV("CV_R_Bationo.pdf", 244), LM("Lettre_R_Bationo.pdf", 74)],
  },
  {
    id: "app_r07",
    talentId: "tal_04",
    jobId: "job_13",
    seed: { competences: 90, experience: 95, formation: 100, localisation: 100, langues: 70, disponibilite: 100 },
    reviewStatus: "shortlist",
    shortlisted: true,
    daysAgo: 4,
    aiSummary:
      "Magasinier cariste de trois ans, certifié CACES 3, la compétence souhaitée que la majorité des dossiers reçus ne portent pas. Habite Bobo-Dioulasso, disponible immédiatement, et le contrat saisonnier proposé correspond à son parcours, fait de campagnes successives.",
    attentionPoints: ["Le certificat CACES joint arrive à échéance dans quatre mois."],
    relevantExperience:
      "Magasinier cariste, Coton Sud Conditionnement, 2023-2026 : réception de 200 tonnes par campagne, conduite de chariot élévateur, tenue des fiches de stock.",
    documents: [CV("CV_M_Kabore.pdf", 198), { fileName: "CACES_3_M_Kabore.pdf", label: "Certificat", sizeKb: 320 }],
  },
  {
    id: "app_r08",
    talentId: "tal_09",
    jobId: "job_13",
    seed: { competences: 75, experience: 70, formation: 100, localisation: 100, langues: 60, disponibilite: 100 },
    reviewStatus: "a_examiner",
    daysAgo: 5,
    aiSummary:
      "Une année d'expérience en unité de conditionnement, ce qui correspond exactement au minimum demandé pour le poste de magasinier. Les deux compétences requises sont présentes. Disponibilité immédiate et résidence à Bobo-Dioulasso. Pas de CACES.",
    attentionPoints: [
      "Pas de CACES, compétence souhaitée dans l'offre.",
      "Français scolaire déclaré, à vérifier pour la tenue des fiches de stock.",
    ],
    relevantExperience:
      "Magasinière, Unité de conditionnement Bama, campagne 2025-2026 : réception des livraisons, tri, tenue du registre d'entrée.",
    documents: [CV("CV_F_Nignan.pdf", 176)],
  },
  {
    id: "app_r09",
    talentId: "tal_07",
    jobId: "job_13",
    seed: { competences: 85, experience: 90, formation: 100, localisation: 100, langues: 80, disponibilite: 100 },
    reviewStatus: "recue",
    daysAgo: 1,
    channel: "sira",
    aiSummary:
      "Candidature redéposée sur le poste de magasinier après un dossier non retenu sur le poste de responsable logistique. Le niveau d'expérience correspond cette fois au poste : deux ans de gestion de stock pour un an demandé, et les deux compétences requises sont présentes.",
    attentionPoints: ["Candidature déjà reçue sur une autre offre de l'organisation il y a huit jours."],
    relevantExperience:
      "Gestionnaire de stock, Distribution Houet, 2024-2026 : saisie des mouvements, inventaires mensuels, préparation de commandes.",
    documents: [CV("CV_R_Bationo_Magasinier.pdf", 244)],
  },
  {
    id: "app_r10",
    talentId: "tal_05",
    jobId: "job_18",
    seed: { competences: 95, experience: 100, formation: 100, localisation: 100, langues: 95, disponibilite: 85 },
    reviewStatus: "retenue",
    shortlisted: true,
    daysAgo: 26,
    aiSummary:
      "Quatre ans d'assistanat de direction en milieu industriel, les quatre compétences requises présentes, anglais professionnel qui dépasse l'anglais de base souhaité. Réside à Bobo-Dioulasso. Dossier complet dès le dépôt.",
    attentionPoints: [],
    relevantExperience:
      "Assistante de direction, Brasserie des Hauts-Bassins, 2022-2026 : gestion de l'agenda du directeur d'usine, comptes rendus de comité, organisation des visites bailleurs.",
    notes: [
      { author: "Idrissa Compaoré", at: dAgo(20), text: "Entretien très favorable. Proposition envoyée." },
      { author: "Mariam Ouédraogo", at: dAgo(18), text: "Offre acceptée, prise de poste au 1er octobre." },
    ],
    documents: [CV("CV_A_Traore.pdf", 310), LM("Lettre_A_Traore.pdf", 102)],
  },
  {
    id: "app_r11",
    talentId: "tal_11",
    jobId: "job_18",
    seed: { competences: 90, experience: 100, formation: 100, localisation: 100, langues: 70, disponibilite: 80 },
    reviewStatus: "refusee",
    daysAgo: 24,
    aiSummary:
      "Cinq ans de secrétariat de direction auprès d'un comité de direction, compétences requises couvertes. Dossier solide, arrivé en seconde position derrière une candidature au profil équivalent mais disponible plus tôt.",
    attentionPoints: ["Pas d'anglais déclaré, compétence souhaitée dans l'offre."],
    relevantExperience:
      "Secrétaire de direction, Cimenterie de l'Ouest, 2021-2026 : préparation des conseils, rédaction des procès-verbaux, gestion du courrier confidentiel.",
    notes: [
      {
        author: "Idrissa Compaoré",
        at: dAgo(22),
        text: "Très bon dossier, poste pourvu. À conserver dans le vivier pour un futur besoin administratif.",
      },
    ],
    documents: [CV("CV_C_Kabore.pdf", 268)],
  },
];

/** La candidature réelle des fixtures, projetée dans le format recruteur. */
function realApplication(): RecruiterApplication | null {
  const app = getApplication("app_02");
  const job = getJobById(app?.jobId ?? "");
  const score = getScore("job_13", "cnd_01");
  if (!app || !job || !score) return null;
  const talent = awaTalent();

  return {
    id: app.id,
    jobId: app.jobId,
    talent,
    score,
    reviewStatus: app.reviewStatus ?? "recue",
    isShortlisted: app.isShortlisted ?? false,
    submittedAt: app.submittedAt ?? app.createdAt,
    channel: app.channelUsed,
    documents: app.documents.map((d) => ({
      fileName: d.fileName,
      label: d.documentType === "cv_adapte" ? "CV adapté" : "Document",
      sizeKb: 284,
    })),
    aiSummary:
      "Cinq ans de gestion de stock sur un entrepôt de 1 800 m², avec une réduction de 22 % du taux de rupture en deux ans, chiffre vérifiable dans le CV. Les deux compétences requises du poste sont présentes et le niveau de formation dépasse largement le CAP demandé. La candidate réside à Ouagadougou mais déclare Bobo-Dioulasso dans ses zones de recherche. Profil sensiblement au-dessus du niveau du poste de magasinier.",
    attentionPoints: [
      "Profil surqualifié pour un poste de magasinier : risque de départ rapide vers un poste d'encadrement.",
      "Recherche prioritairement un CDI, alors que l'offre est un CDD saisonnier de huit mois.",
      "Pas de CACES, compétence souhaitée dans l'offre.",
    ],
    relevantExperience:
      "Gestionnaire de stock, Faso Distribution, 2021-2026 : entrepôt de 1 800 m², inventaires tournants, réduction de 22 % des ruptures sur deux ans.",
    notes: [
      {
        author: "Idrissa Compaoré",
        at: dAgo(2),
        text: "Profil bien au-dessus du poste. Lui proposer plutôt le poste de responsable logistique si elle est intéressée.",
      },
    ],
    history: app.history,
    contactUnlocked: true,
  };
}

function demoToApplication(seed: DemoApplicationSeed): RecruiterApplication | null {
  const talent = getTalentById(seed.talentId);
  const job = getJobById(seed.jobId);
  if (!talent || !job) return null;

  const submittedAt = dAgo(seed.daysAgo);
  const history: ApplicationEvent[] = [
    { at: submittedAt, label: "Candidature reçue", actor: "candidat" },
    { at: submittedAt, label: "Score de compatibilité calculé", actor: "systeme" },
  ];
  if (["a_examiner", "shortlist", "entretien", "retenue", "refusee"].includes(seed.reviewStatus)) {
    history.push({ at: dAgo(Math.max(0, seed.daysAgo - 1)), label: "Dossier ouvert par le recruteur", actor: "recruteur" });
  }
  if (["shortlist", "entretien", "retenue"].includes(seed.reviewStatus)) {
    history.push({ at: dAgo(Math.max(0, seed.daysAgo - 2)), label: "Ajouté à la shortlist", actor: "recruteur" });
  }
  if (["entretien", "retenue"].includes(seed.reviewStatus)) {
    history.push({ at: dAgo(Math.max(0, seed.daysAgo - 3)), label: "Convoqué en entretien", actor: "recruteur" });
  }
  if (seed.reviewStatus === "retenue") {
    history.push({ at: dAgo(Math.max(0, seed.daysAgo - 6)), label: "Candidature retenue", actor: "recruteur" });
  }
  if (seed.reviewStatus === "refusee") {
    history.push({ at: dAgo(Math.max(0, seed.daysAgo - 2)), label: "Candidature non retenue", actor: "recruteur" });
  }

  return {
    id: seed.id,
    jobId: seed.jobId,
    talent,
    score: buildMatchScore(talent, job, seed.seed, seed.blocking),
    reviewStatus: seed.reviewStatus,
    isShortlisted: seed.shortlisted ?? false,
    submittedAt,
    channel: seed.channel ?? "sira",
    documents: seed.documents ?? [CV(`CV_${talent.lastName}.pdf`, 260)],
    aiSummary: seed.aiSummary,
    attentionPoints: seed.attentionPoints,
    relevantExperience: seed.relevantExperience,
    notes: seed.notes ?? [],
    history,
    contactUnlocked: true,
  };
}

/** Toutes les candidatures reçues par l'organisation, réelles et de démonstration. */
export function getRecruiterPipeline(): RecruiterApplication[] {
  const real = realApplication();
  const demo = DEMO_APPLICATIONS.map(demoToApplication).filter(
    (a): a is RecruiterApplication => a !== null,
  );
  return [...(real ? [real] : []), ...demo].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function getRecruiterApplicationById(id: string): RecruiterApplication | undefined {
  return getRecruiterPipeline().find((a) => a.id === id);
}

/**
 * Classement suggéré pour une offre : tri par score décroissant.
 * L'IA propose un ordre de lecture, elle ne retire personne de la liste.
 */
export function getRankedCandidates(jobId: string): RecruiterApplication[] {
  return getRecruiterPipeline()
    .filter((a) => a.jobId === jobId)
    .sort((a, b) => b.score.score - a.score.score);
}

/** Scores calculés à la volée entre une offre et un talent du vivier. */
export function getTalentJobScore(talent: RecruiterTalent, job: Job): MatchScore {
  const matchRatio =
    job.requiredSkills.length === 0
      ? 60
      : Math.round((job.requiredSkills.filter((s) => talent.skills.includes(s)).length / job.requiredSkills.length) * 100);
  return buildMatchScore(talent, job, {
    competences: matchRatio,
    experience: Math.min(100, Math.round((talent.experienceYears / Math.max(1, job.experienceYears)) * 80)),
    formation: 80,
    localisation: talent.city === job.city ? 100 : talent.mobility.includes(job.city) ? 65 : 35,
    langues: 75,
    disponibilite: talent.availability === "Immédiate" ? 100 : 70,
  });
}

// --------------------------------------------------------------------------
// Indicateurs
// --------------------------------------------------------------------------

export interface FunnelStep {
  key: string;
  label: string;
  count: number;
}

/** Entonnoir cumulé : un candidat en entretien est passé par toutes les étapes amont. */
export function getFunnel(pipeline = getRecruiterPipeline()): FunnelStep[] {
  const reached = (statuses: ReviewStatus[]) => pipeline.filter((a) => statuses.includes(a.reviewStatus)).length;
  return [
    { key: "recue", label: "Reçues", count: pipeline.length },
    {
      key: "a_examiner",
      label: "Examinées",
      count: reached(["a_examiner", "shortlist", "entretien", "retenue", "refusee"]),
    },
    { key: "shortlist", label: "Shortlist", count: reached(["shortlist", "entretien", "retenue"]) },
    { key: "entretien", label: "Entretien", count: reached(["entretien", "retenue"]) },
    { key: "retenue", label: "Retenues", count: reached(["retenue"]) },
  ];
}

export interface JobPerformance {
  job: Job;
  views: number;
  applications: number;
  conversion: number;
  shortlisted: number;
  averageScore: number;
}

export function getJobPerformance(): JobPerformance[] {
  const pipeline = getRecruiterPipeline();
  return getRecruiterJobs(RECRUITER_ORG_ID).map((job) => {
    const apps = pipeline.filter((a) => a.jobId === job.id);
    const averageScore =
      apps.length > 0 ? Math.round(apps.reduce((s, a) => s + a.score.score, 0) / apps.length) : 0;
    return {
      job,
      views: job.viewCount,
      applications: job.applicationCount,
      conversion: job.viewCount > 0 ? Math.round((job.applicationCount / job.viewCount) * 1000) / 10 : 0,
      shortlisted: apps.filter((a) => a.isShortlisted).length,
      averageScore,
    };
  });
}

/** Délai moyen entre la réception d'une candidature et son premier traitement. */
export function getAverageProcessingDays(pipeline = getRecruiterPipeline()): number {
  const treated = pipeline.filter((a) => a.reviewStatus !== "recue");
  if (treated.length === 0) return 0;
  const total = treated.reduce((sum, a) => {
    const opened = a.history.find((h) => h.actor === "recruteur");
    if (!opened) return sum;
    const days =
      (Date.parse(`${opened.at}T12:00:00Z`) - Date.parse(`${a.submittedAt}T12:00:00Z`)) / 86400000;
    return sum + Math.max(0, days);
  }, 0);
  return Math.round((total / treated.length) * 10) / 10;
}

// --------------------------------------------------------------------------
// Organisation : membres, justificatifs
// --------------------------------------------------------------------------

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: MembershipRole;
  jobTitle: string;
  initials: string;
  color: string;
  lastSeenAt: string;
}

export const ORG_MEMBERS: OrgMember[] = [
  {
    id: "mbr_01",
    name: RECRUITER_NAME,
    email: RECRUITER_EMAIL,
    role: "proprietaire",
    jobTitle: "Directeur des ressources humaines",
    initials: "IC",
    color: BLUE_800,
    lastSeenAt: TODAY,
  },
  {
    id: "mbr_02",
    name: "Mariam Ouédraogo",
    email: "m.ouedraogo@sahelagro.bf",
    role: "recruteur",
    jobTitle: "Chargée de recrutement",
    initials: "MO",
    color: BLUE_600,
    lastSeenAt: dAgo(1),
  },
  {
    id: "mbr_03",
    name: "Abdoulaye Nacoulma",
    email: "a.nacoulma@sahelagro.bf",
    role: "recruteur",
    jobTitle: "Responsable des opérations",
    initials: "AN",
    color: BLUE_700,
    lastSeenAt: dAgo(4),
  },
  {
    id: "mbr_04",
    name: "Céline Ilboudo",
    email: "c.ilboudo@sahelagro.bf",
    role: "lecteur",
    jobTitle: "Assistante de direction",
    initials: "CI",
    color: BLUE_500,
    lastSeenAt: dAgo(11),
  },
];

export interface VerificationDocument {
  label: string;
  fileName: string;
  submittedAt: string;
  status: "valide" | "en_controle" | "refuse";
  reviewedBy?: string;
}

export const VERIFICATION_DOCUMENTS: VerificationDocument[] = [
  {
    label: "Registre du commerce (RCCM)",
    fileName: "RCCM_Sahel_Agro.pdf",
    submittedAt: dAgo(380),
    status: "valide",
    reviewedBy: "Modération SIRA",
  },
  {
    label: "Identifiant financier unique (IFU)",
    fileName: "IFU_Sahel_Agro.pdf",
    submittedAt: dAgo(380),
    status: "valide",
    reviewedBy: "Modération SIRA",
  },
  {
    label: "Pièce d'identité du responsable",
    fileName: "CNIB_I_Compaore.pdf",
    submittedAt: dAgo(378),
    status: "valide",
    reviewedBy: "Modération SIRA",
  },
  {
    label: "Attestation de situation fiscale 2026",
    fileName: "Attestation_fiscale_2026.pdf",
    submittedAt: dAgo(14),
    status: "en_controle",
  },
];

/** Les trois niveaux de la politique de vérification — section 2.3 du plan. */
export const VERIFICATION_LEVELS = [
  {
    key: "non_verifie" as const,
    title: "Non vérifié",
    rule: "Brouillons uniquement. Aucune publication possible.",
    detail:
      "L'organisation peut préparer ses offres et inviter ses membres, mais rien n'est visible du public tant qu'aucune vérification n'est engagée.",
  },
  {
    key: "leger" as const,
    title: "Vérification légère",
    rule: "Publication soumise à la validation d'un administrateur.",
    detail:
      "E-mail professionnel et téléphone confirmés. Chaque offre part en file de modération et n'est publiée qu'après contrôle humain, sous 24 à 48 heures ouvrées.",
  },
  {
    key: "verifie" as const,
    title: "Vérifié",
    rule: "Publication immédiate, badge vérifié, modération a posteriori.",
    detail:
      "Justificatifs légaux contrôlés par la modération SIRA. Les offres sont en ligne dès la publication et restent soumises au contrôle a posteriori et au signalement.",
  },
];

// --------------------------------------------------------------------------
// Abonnement recruteur — GET /recruiters/me/subscription
// --------------------------------------------------------------------------

/**
 * Plan Pro en offre de lancement : gratuit pendant la phase de lancement,
 * avec une date d'expiration pilotée par l'administration SIRA.
 */
export const RECRUITER_SUBSCRIPTION: Subscription = {
  id: "sub_rec_01",
  userId: "usr_rec_01",
  plan: "recruteur_pro",
  status: "active",
  startedAt: dAgo(120),
  renewsAt: dIn(78),
  isLaunchOffer: true,
};

export const RECRUITER_USAGE: UsageCounter[] = [
  { feature: "active_jobs", label: "Offres publiées simultanément", consumed: 2, limit: null, period: "En cours" },
  { feature: "matching", label: "Analyses de matching IA", consumed: 34, limit: 200, period: "Ce mois" },
  { feature: "talent_search", label: "Recherches dans le vivier", consumed: 47, limit: 300, period: "Ce mois" },
  { feature: "candidate_summary", label: "Résumés automatiques de candidat", consumed: 18, limit: 150, period: "Ce mois" },
  { feature: "contacts", label: "Prises de contact e-mail et WhatsApp", consumed: 9, limit: 100, period: "Ce mois" },
  { feature: "members", label: "Membres de l'organisation", consumed: 4, limit: 10, period: "En cours" },
];

export interface PlanFeature {
  label: string;
  gratuit: string | boolean;
  pro: string | boolean;
  enterprise: string | boolean;
}

export const PLAN_COMPARISON: PlanFeature[] = [
  { label: "Offres publiées simultanément", gratuit: "1", pro: "Illimité", enterprise: "Illimité" },
  { label: "Durée de publication", gratuit: "30 jours", pro: "60 jours", enterprise: "90 jours" },
  { label: "Candidatures reçues", gratuit: "Illimité", pro: "Illimité", enterprise: "Illimité" },
  { label: "Score de compatibilité affiché", gratuit: true, pro: true, enterprise: true },
  { label: "Matching IA et classement suggéré", gratuit: false, pro: true, enterprise: true },
  { label: "Résumé automatique de candidat", gratuit: false, pro: true, enterprise: true },
  { label: "Recherche avancée de talents", gratuit: false, pro: true, enterprise: true },
  { label: "Détection des critères indispensables", gratuit: false, pro: true, enterprise: true },
  { label: "Tableau de suivi des candidatures", gratuit: "Basique", pro: "Complet", enterprise: "Complet" },
  { label: "Statistiques de recrutement", gratuit: false, pro: true, enterprise: true },
  { label: "Collaboration entre membres", gratuit: "1 membre", pro: "10 membres", enterprise: "Illimité" },
  { label: "Notifications WhatsApp", gratuit: false, pro: true, enterprise: true },
  { label: "Page entreprise personnalisée", gratuit: false, pro: true, enterprise: true },
  { label: "Accompagnement dédié", gratuit: false, pro: false, enterprise: true },
  { label: "Export des données et API", gratuit: false, pro: false, enterprise: true },
];

export const RECRUITER_PAYMENTS: Payment[] = [
  {
    id: "pay_rec_01",
    userId: "usr_rec_01",
    amount: 0,
    currency: "XOF",
    provider: "mobile_money_orange",
    reference: "LAUNCH-2026-PRO-0001",
    status: "paid",
    createdAt: dAgo(120),
    description: "Activation Pro, offre de lancement, montant offert",
  },
  {
    id: "pay_rec_02",
    userId: "usr_rec_01",
    amount: 0,
    currency: "XOF",
    provider: "mobile_money_orange",
    reference: "LAUNCH-2026-PRO-0002",
    status: "paid",
    createdAt: dAgo(60),
    description: "Reconduction Pro, offre de lancement, montant offert",
  },
  {
    id: "pay_rec_03",
    userId: "usr_rec_01",
    amount: 25000,
    currency: "XOF",
    provider: "mobile_money_orange",
    reference: "OM-2026-0912-4471",
    status: "paid",
    createdAt: dAgo(12),
    description: "Mise en avant d'une offre, 7 jours",
  },
  {
    id: "pay_rec_04",
    userId: "usr_rec_01",
    amount: 15000,
    currency: "XOF",
    provider: "mobile_money_moov",
    reference: "MM-2026-0820-7712",
    status: "failed",
    createdAt: dAgo(23),
    description: "Mise en avant d'une offre, tentative interrompue",
  },
];

export const PLAN_PRICES = {
  gratuit: 0,
  pro: 25000,
  enterprise: 75000,
};

// --------------------------------------------------------------------------
// Modèles de message et journal des contacts
// --------------------------------------------------------------------------

export interface MessageTemplate {
  id: string;
  name: string;
  channel: "email" | "whatsapp" | "both";
  purpose: string;
  subject?: string;
  body: string;
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "accuse_reception",
    name: "Accusé de réception",
    channel: "email",
    purpose: "Confirmer au candidat que son dossier est bien arrivé.",
    subject: "Votre candidature au poste de {{poste}} chez Sahel Agro",
    body:
      "Bonjour {{prenom}},\n\nNous avons bien reçu votre candidature au poste de {{poste}}. Votre dossier est en cours d'examen par notre équipe.\n\nNous revenons vers vous sous quinze jours, quelle que soit notre décision.\n\nCordialement,\n{{recruteur}}\nSahel Agro",
  },
  {
    id: "invitation_entretien",
    name: "Invitation à un entretien",
    channel: "both",
    purpose: "Proposer un créneau d'entretien après la shortlist.",
    subject: "Entretien pour le poste de {{poste}} — Sahel Agro",
    body:
      "Bonjour {{prenom}},\n\nVotre candidature au poste de {{poste}} a retenu notre attention. Nous souhaitons vous rencontrer le {{date}} à {{heure}}, sur notre site de {{lieu}}.\n\nMerci de confirmer votre disponibilité en répondant à ce message.\n\n{{recruteur}}\nSahel Agro",
  },
  {
    id: "demande_pieces",
    name: "Demande de pièces complémentaires",
    channel: "email",
    purpose: "Réclamer un justificatif manquant au dossier.",
    subject: "Pièces complémentaires pour votre candidature",
    body:
      "Bonjour {{prenom}},\n\nPour compléter l'examen de votre dossier, merci de nous transmettre : {{pieces}}.\n\nVous pouvez répondre directement à ce message en joignant les fichiers.\n\n{{recruteur}}\nSahel Agro",
  },
  {
    id: "prise_contact_vivier",
    name: "Prise de contact depuis le vivier",
    channel: "both",
    purpose:
      "Approcher un profil trouvé dans la recherche de talents. Le candidat reste libre d'accepter ou d'ignorer.",
    subject: "Une opportunité chez Sahel Agro qui peut vous correspondre",
    body:
      "Bonjour,\n\nJe suis {{recruteur}}, chargé du recrutement chez Sahel Agro. Votre profil correspond à notre poste de {{poste}}, basé à {{lieu}}.\n\nSi cette opportunité vous intéresse, répondez à ce message : vos coordonnées ne me seront communiquées qu'après votre accord.\n\nBien à vous,\n{{recruteur}}",
  },
  {
    id: "relance_candidat",
    name: "Relance après entretien",
    channel: "whatsapp",
    purpose: "Tenir le candidat informé de l'avancement après un entretien.",
    body:
      "Bonjour {{prenom}}, suite à notre entretien du {{date}} pour le poste de {{poste}}, votre dossier est toujours à l'étude. Nous revenons vers vous avant le {{date_reponse}}. Bonne journée. {{recruteur}}, Sahel Agro",
  },
  {
    id: "reponse_negative",
    name: "Réponse négative",
    channel: "email",
    purpose: "Répondre à un candidat non retenu, avec un motif lisible.",
    subject: "Suite donnée à votre candidature — Sahel Agro",
    body:
      "Bonjour {{prenom}},\n\nNous avons étudié votre candidature au poste de {{poste}} avec attention. Nous ne donnons pas suite cette fois-ci : {{motif}}.\n\nVotre dossier reste dans notre vivier, et nous vous recontacterons si un poste correspondant s'ouvre.\n\nNous vous souhaitons une bonne poursuite de recherche.\n\n{{recruteur}}\nSahel Agro",
  },
];

export function getTemplateById(id: string): MessageTemplate | undefined {
  return MESSAGE_TEMPLATES.find((t) => t.id === id);
}

/** Envois de démonstration, complétant les deux événements réels des fixtures. */
const EXTRA_CONTACT_EVENTS: ContactEvent[] = [
  {
    id: "cte_d1",
    organizationId: RECRUITER_ORG_ID,
    candidateId: "tal_02",
    channel: "email",
    template: "invitation_entretien",
    sentAt: dAgo(1),
    status: "lu",
  },
  {
    id: "cte_d2",
    organizationId: RECRUITER_ORG_ID,
    candidateId: "tal_03",
    channel: "whatsapp",
    template: "accuse_reception",
    sentAt: dAgo(4),
    status: "delivre",
  },
  {
    id: "cte_d3",
    organizationId: RECRUITER_ORG_ID,
    candidateId: "tal_04",
    channel: "whatsapp",
    template: "demande_pieces",
    sentAt: dAgo(3),
    status: "envoye",
  },
  {
    id: "cte_d4",
    organizationId: RECRUITER_ORG_ID,
    candidateId: "tal_07",
    channel: "email",
    template: "reponse_negative",
    sentAt: dAgo(7),
    status: "delivre",
  },
  {
    id: "cte_d5",
    organizationId: RECRUITER_ORG_ID,
    candidateId: "tal_05",
    channel: "whatsapp",
    template: "relance_candidat",
    sentAt: dAgo(19),
    status: "lu",
  },
  {
    id: "cte_d6",
    organizationId: RECRUITER_ORG_ID,
    candidateId: "tal_11",
    channel: "email",
    template: "reponse_negative",
    sentAt: dAgo(21),
    status: "echec",
  },
];

export interface ContactJournalEntry {
  event: ContactEvent;
  talent?: RecruiterTalent;
  template?: MessageTemplate;
}

export function getContactJournal(): ContactJournalEntry[] {
  const events = [
    ...getContactEvents().filter((e) => e.organizationId === RECRUITER_ORG_ID),
    ...EXTRA_CONTACT_EVENTS,
  ].sort((a, b) => b.sentAt.localeCompare(a.sentAt));

  return events.map((event) => ({
    event,
    talent: getTalentById(event.candidateId),
    template: getTemplateById(event.template),
  }));
}

// --------------------------------------------------------------------------
// Alertes du tableau de bord
// --------------------------------------------------------------------------

export interface RecruiterAlert {
  tone: "warning" | "danger" | "info" | "accent";
  title: string;
  body: string;
  href?: string;
  linkLabel?: string;
}

export function getRecruiterAlerts(): RecruiterAlert[] {
  const alerts: RecruiterAlert[] = [];
  const pipeline = getRecruiterPipeline();
  const jobs = getRecruiterJobs(RECRUITER_ORG_ID);

  const untouched = pipeline.filter((a) => a.reviewStatus === "recue");
  if (untouched.length > 0) {
    alerts.push({
      tone: "warning",
      title: `${untouched.length} candidature${untouched.length > 1 ? "s" : ""} sans première lecture`,
      body: "Les candidats voient l'état « Envoyée » tant que le dossier n'a pas été ouvert.",
      href: "/recruteur/candidatures?statut=recue",
      linkLabel: "Ouvrir la file",
    });
  }

  const closing = jobs.filter((j) => {
    const days = Math.round(
      (Date.parse(`${j.deadline}T12:00:00Z`) - Date.parse(`${TODAY}T12:00:00Z`)) / 86400000,
    );
    return j.status === "publiee" && days >= 0 && days <= 20;
  });
  for (const job of closing) {
    const days = Math.round(
      (Date.parse(`${job.deadline}T12:00:00Z`) - Date.parse(`${TODAY}T12:00:00Z`)) / 86400000,
    );
    alerts.push({
      tone: "info",
      title: `« ${job.title} » se clôture dans ${days} jours`,
      body: "Prolongez la date limite si vous souhaitez continuer à recevoir des candidatures.",
      href: `/recruteur/offres/${job.id}`,
      linkLabel: "Modifier l'offre",
    });
  }

  const expired = jobs.filter((j) => j.status === "expiree");
  for (const job of expired) {
    alerts.push({
      tone: "danger",
      title: `« ${job.title} » a expiré`,
      body: "L'offre n'est plus visible et n'accepte plus de candidature. Republiez-la ou clôturez-la.",
      href: `/recruteur/offres/${job.id}`,
      linkLabel: "Traiter l'offre",
    });
  }

  const pendingDoc = VERIFICATION_DOCUMENTS.find((d) => d.status === "en_controle");
  if (pendingDoc) {
    alerts.push({
      tone: "accent",
      title: "Un justificatif est en cours de contrôle",
      body: `${pendingDoc.label} déposée, en attente de la modération SIRA. Votre badge vérifié reste actif.`,
      href: "/recruteur/entreprise",
      linkLabel: "Voir le dossier",
    });
  }

  return alerts;
}
