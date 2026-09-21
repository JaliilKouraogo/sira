import { z } from "zod";

const email = z.string().trim().toLowerCase().max(254).pipe(z.email("Adresse e-mail invalide."));

/** Même règle que le formulaire du site : 8 caractères au minimum. */
const password = z
  .string()
  .min(8, "Le mot de passe doit compter au moins 8 caractères.")
  // Borne haute : un mot de passe démesuré ferait travailler Argon2 pour rien.
  .max(128, "Le mot de passe ne peut pas dépasser 128 caractères.");

export const RegisterSchema = z.object({
  // L'espace formateur ouvrira plus tard (lot 7), comme l'indique le site.
  role: z.enum(["candidate", "recruiter"], { error: "Choisissez un compte candidat ou recruteur." }),
  email,
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ().-]{8,20}$/, "Numéro de téléphone invalide.")
    .optional(),
  password,
  firstName: z.string().trim().min(1, "Le prénom est obligatoire.").max(80),
  lastName: z.string().trim().min(1, "Le nom est obligatoire.").max(80),
  acceptTerms: z.literal(true, { error: "Vous devez accepter les conditions d'utilisation." }),
  /** Communications commerciales : consentement explicite, désactivé par défaut. */
  marketingOptIn: z.boolean().default(false),
});
export type RegisterInput = z.output<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email,
  password: z.string().min(1, "Saisissez votre mot de passe.").max(128),
});
export type LoginInput = z.output<typeof LoginSchema>;

/**
 * « 70 11 22 33 » → « +22670112233 ». Un numéro local à 8 chiffres est
 * rattaché au Burkina Faso, pays de lancement ; un numéro international garde
 * son indicatif.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return `+${digits.slice(1).replace(/\+/g, "")}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  return digits.length === 8 ? `+226${digits}` : `+${digits}`;
}
