import { DOMAINS, ORGANIZATION_TYPES } from "@sira/shared";
import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);

export const CreateOrganizationSchema = z.object({
  legalName: z.string().trim().min(2, "La raison sociale est obligatoire.").max(160),
  tradeName: text(120).optional(),
  type: z.enum(ORGANIZATION_TYPES),
  sector: z.enum(DOMAINS).optional(),
  size: text(60).optional(),
  country: text(80).default("Burkina Faso"),
  city: z.string().trim().min(2, "La ville est obligatoire.").max(80),
  address: text(200).optional(),
  website: z.url("Adresse de site invalide.").max(200).optional(),
  description: text(2000).optional(),
});
export type CreateOrganizationInput = z.output<typeof CreateOrganizationSchema>;

export const UpdateOrganizationSchema = CreateOrganizationSchema.omit({ type: true, country: true })
  .extend({ country: text(80) })
  .partial();
export type UpdateOrganizationInput = z.output<typeof UpdateOrganizationSchema>;

/**
 * Justificatifs déclarés pour la vérification. Le téléversement des fichiers
 * arrivera avec le stockage objet ; en attendant, on enregistre leur nature et
 * leur référence (numéro RCCM, IFU, récépissé…).
 */
export const SubmitVerificationSchema = z.object({
  documents: z
    .array(z.object({ kind: z.string().trim().min(2).max(80), reference: z.string().trim().min(1).max(200) }))
    .min(1, "Déclarez au moins un justificatif.")
    .max(10),
});
export type SubmitVerificationInput = z.output<typeof SubmitVerificationSchema>;

export const VerificationDecisionSchema = z
  .object({
    decision: z.enum(["verifie", "refuse", "suspendu"]),
    reason: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.decision === "verifie" || Boolean(v.reason), {
    message: "Un motif est obligatoire pour refuser ou suspendre.",
    path: ["reason"],
  });
export type VerificationDecisionInput = z.output<typeof VerificationDecisionSchema>;
