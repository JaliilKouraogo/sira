import * as shared from "@sira/shared";
import { normalizePhone } from "../auth/auth.schemas";
import * as db from "../generated/prisma/enums";

/**
 * Le schéma Prisma recopie les valeurs du référentiel partagé : ce test
 * échoue dès qu'une valeur est ajoutée d'un côté sans l'être de l'autre.
 */
describe("alignement du schéma de base sur le référentiel partagé", () => {
  it.each([
    ["UserRole", db.UserRole, shared.USER_ROLES],
    ["OrganizationType", db.OrganizationType, shared.ORGANIZATION_TYPES],
    ["VerificationStatus", db.VerificationStatus, shared.VERIFICATION_STATUSES],
    ["MembershipRole", db.MembershipRole, shared.MEMBERSHIP_ROLES],
    ["JobStatus", db.JobStatus, shared.JOB_STATUSES],
    ["JobOrigin", db.JobOrigin, shared.JOB_ORIGINS],
    ["OpportunityType", db.OpportunityType, shared.OPPORTUNITY_TYPES],
    ["ContractType", db.ContractType, shared.CONTRACT_TYPES],
    ["WorkMode", db.WorkMode, shared.WORK_MODES],
    ["JobVisibility", db.JobVisibility, shared.JOB_VISIBILITIES],
    ["ApplicationChannel", db.ApplicationChannel, shared.APPLICATION_CHANNELS],
    ["PreparationStatus", db.PreparationStatus, shared.PREPARATION_STATUSES],
    ["ReviewStatus", db.ReviewStatus, shared.REVIEW_STATUSES],
    ["ProfileVisibility", db.ProfileVisibility, shared.PROFILE_VISIBILITIES],
    ["ConsentType", db.ConsentType, shared.CONSENT_TYPES],
    ["ConsentBasis", db.ConsentBasis, shared.CONSENT_BASES],
    ["NotificationChannel", db.NotificationChannel, shared.NOTIFICATION_CHANNELS],
    ["AiJobType", db.AiJobType, shared.AI_JOB_TYPES],
    ["AiJobStatus", db.AiJobStatus, shared.AI_JOB_STATUSES],
  ])("%s", (_name, prismaEnum, sharedValues) => {
    expect(Object.values(prismaEnum)).toEqual([...sharedValues]);
  });
});

describe("normalizePhone", () => {
  it.each([
    ["70 11 22 33", "+22670112233"],
    ["+226 70 11 22 33", "+22670112233"],
    ["00226 70-11-22-33", "+22670112233"],
    ["+33 6 12 34 56 78", "+33612345678"],
  ])("« %s » → %s", (raw, expected) => {
    expect(normalizePhone(raw)).toBe(expected);
  });
});
