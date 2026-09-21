import { PREPARATION_STATUSES, REVIEW_STATUSES } from "@sira/shared";
import { z } from "zod";
import { PaginationQuery } from "../common/pagination";

export const CreateApplicationSchema = z.object({ jobId: z.string().min(1) });
export type CreateApplicationInput = z.output<typeof CreateApplicationSchema>;

/** « envoyee » est exclu : l'envoi passe par POST /applications/:id/submit. */
export const PreparationSchema = z.object({
  status: z.enum(PREPARATION_STATUSES.filter((s) => s !== "envoyee") as ["brouillon", "generee", "a_verifier", "validee"]),
});
export type PreparationInput = z.output<typeof PreparationSchema>;

export const ReviewSchema = z.object({ status: z.enum(REVIEW_STATUSES) });
export type ReviewInput = z.output<typeof ReviewSchema>;

export const NoteSchema = z.object({ text: z.string().trim().min(1, "La note est vide.").max(2000) });
export type NoteInput = z.output<typeof NoteSchema>;

export const ApplicationsQuery = PaginationQuery.extend({
  jobId: z.string().min(1).optional(),
  reviewStatus: z.enum(REVIEW_STATUSES).optional(),
  preparationStatus: z.enum(PREPARATION_STATUSES).optional(),
  // « false » ne doit pas devenir vrai : pas de conversion booléenne implicite.
  archived: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});
export type ApplicationsQueryInput = z.output<typeof ApplicationsQuery>;

/** Clé d'idempotence : 8 à 128 caractères sûrs, un UUID par exemple. */
export const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{8,128}$/;
