/**
 * Données servant à l'assistant SIRA affiché en bulle sur le site public.
 *
 * Le module est lu côté serveur, au moment du rendu : il réduit les offres et
 * les formations à quelques champs, que le gabarit passe ensuite au composant
 * client. Les jeux de données complets restent donc hors du navigateur.
 *
 * L'assistant ne répond qu'à partir de ces données et de réponses écrites à
 * l'avance : il n'invente ni offre, ni formation, ni chiffre.
 */

import { CONTRACT_TYPE_LABEL, OPPORTUNITY_TYPE_LABEL, TRAINING_ACCESS_LABEL } from "@/lib/enums";
import { getPublishedJobs, getTrainings } from "./queries";

export interface ChatJob {
  title: string;
  slug: string;
  city: string;
  /** « Emploi », « Stage », « Alternance »… */
  type: string;
  /** « CDI », « Convention de stage »… */
  contract: string;
  skills: string[];
}

export interface ChatTraining {
  title: string;
  slug: string;
  category: string;
  /** « Gratuite », « Incluse avec Premium », « Payante ». */
  access: string;
  free: boolean;
  skills: string[];
}

export interface ChatData {
  jobs: ChatJob[];
  trainings: ChatTraining[];
  /** Nombre d'offres publiées, tous types confondus. */
  jobCount: number;
  /** Nombre de stages publiés : c'est aussi ce qu'affiche la page /stages. */
  stageCount: number;
  /** Nombre d'alternances publiées. */
  alternanceCount: number;
  /** Nombre de formations gratuites du catalogue. */
  freeTrainingCount: number;
  /** Villes distinctes des offres publiées, par ordre alphabétique. */
  cities: string[];
}

/** Version compacte des offres et des formations, calculée au rendu. */
export function buildChatData(): ChatData {
  const jobs = getPublishedJobs();
  const trainings = getTrainings();

  return {
    jobs: jobs.map((job) => ({
      title: job.title,
      slug: job.slug,
      city: job.city,
      type: OPPORTUNITY_TYPE_LABEL[job.opportunityType],
      contract: CONTRACT_TYPE_LABEL[job.contractType],
      skills: job.requiredSkills.slice(0, 4),
    })),
    trainings: trainings.map((training) => ({
      title: training.title,
      slug: training.slug,
      category: training.category,
      access: TRAINING_ACCESS_LABEL[training.access],
      free: training.access === "public_gratuit",
      skills: training.skillsCovered.slice(0, 4),
    })),
    jobCount: jobs.length,
    stageCount: jobs.filter((job) => job.opportunityType === "stage").length,
    alternanceCount: jobs.filter((job) => job.opportunityType === "alternance").length,
    freeTrainingCount: trainings.filter((training) => training.access === "public_gratuit").length,
    cities: [...new Set(jobs.map((job) => job.city))].sort((a, b) => a.localeCompare(b, "fr")),
  };
}
