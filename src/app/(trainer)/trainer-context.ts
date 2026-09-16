/**
 * Contexte de l'espace formateur de démonstration.
 *
 * Un seul organisme est connecté : Numerika Formation, représenté par
 * Fatoumata Ouédraogo. Le jour où l'authentification existe, ces constantes
 * sont remplacées par la session, sans toucher aux écrans.
 */

import { getCampaigns, getOrganization, getTrainings, getUserById } from "@/data/queries";

export const TRAINER_ORG_ID = "org_07";
export const TRAINER_USER_ID = "usr_trn_01";

export function getTrainerOrganization() {
  return getOrganization(TRAINER_ORG_ID);
}

export function getTrainerUser() {
  return getUserById(TRAINER_USER_ID);
}

/** Catalogue de l'organisme connecté. */
export function getTrainerTrainings() {
  return getTrainings().filter((t) => t.organizationId === TRAINER_ORG_ID);
}

/** Campagnes achetées par l'organisme connecté. */
export function getTrainerCampaigns() {
  return getCampaigns().filter((c) => c.organizationId === TRAINER_ORG_ID);
}
