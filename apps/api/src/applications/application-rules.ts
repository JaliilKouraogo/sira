import { REVIEW_STATUS_CANDIDATE_LABEL, type PreparationStatus, type ReviewStatus } from "@sira/shared";

/**
 * Préparation, côté candidat. « envoyee » ne s'atteint que par l'envoi
 * explicite, et seulement depuis « validee » (RM-06 : le candidat garde le
 * contrôle avant tout envoi).
 */
export const PREPARATION_TRANSITIONS: Record<PreparationStatus, readonly PreparationStatus[]> = {
  brouillon: ["generee", "a_verifier", "validee"],
  generee: ["brouillon", "a_verifier", "validee"],
  a_verifier: ["brouillon", "validee"],
  validee: ["brouillon", "a_verifier"],
  envoyee: [],
};

/**
 * Revue, côté recruteur. Chaque changement est une action humaine explicite
 * (RM-09) : aucun code ne fait passer une candidature en « refusee » de
 * lui-même. Une décision finale peut être rouverte pour corriger une erreur.
 */
export const REVIEW_TRANSITIONS: Record<ReviewStatus, readonly ReviewStatus[]> = {
  recue: ["a_examiner", "shortlist", "entretien", "retenue", "refusee"],
  a_examiner: ["shortlist", "entretien", "retenue", "refusee"],
  shortlist: ["a_examiner", "entretien", "retenue", "refusee"],
  entretien: ["shortlist", "retenue", "refusee"],
  retenue: ["entretien"],
  refusee: ["a_examiner"],
};

/**
 * Ce que voit le candidat (table de projection de la section 5 du plan) :
 * l'état interne du recruteur ne lui est jamais montré. « shortlist »
 * devient « en cours d'examen », comme « a_examiner ».
 */
export const CANDIDATE_STATUS: Record<ReviewStatus, "envoyee" | "en_examen" | "entretien" | "acceptee" | "refusee"> = {
  recue: "envoyee",
  a_examiner: "en_examen",
  shortlist: "en_examen",
  entretien: "entretien",
  retenue: "acceptee",
  refusee: "refusee",
};

export function candidateView(status: ReviewStatus | null) {
  return status ? { status: CANDIDATE_STATUS[status], label: REVIEW_STATUS_CANDIDATE_LABEL[status] } : null;
}
