import { z } from "zod";

/**
 * Variables d'environnement, validées au démarrage : une valeur manquante ou
 * mal formée arrête l'API avec un message clair, plutôt qu'une erreur plus
 * tard au milieu d'une requête. Le modèle commenté est dans `.env.example`.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL est obligatoire."),
  WEB_ORIGIN: z.string().default("http://localhost:3100"),
  /**
   * Derrière un proxy (hébergement, répartiteur de charge) : nombre de proxys
   * de confiance ou liste d'adresses. Sans ce réglage, toutes les requêtes
   * sembleraient venir du proxy, et la limitation de débit les compterait
   * ensemble.
   */
  TRUST_PROXY: z.string().trim().min(1).optional(),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET doit compter au moins 32 caractères."),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  AI_PROVIDER: z.enum(["huggingface", "offline"]).optional(),
  HF_TOKEN: z.string().optional(),
  HF_BASE_URL: z.url().default("https://router.huggingface.co/v1"),
  // Choix vérifiés à la mise en place : Llama 3.1 8B rédige le mieux en
  // français mais ignore les schémas JSON ; Qwen3 4B respecte les schémas.
  HF_CHAT_MODEL: z.string().default("meta-llama/Llama-3.1-8B-Instruct"),
  HF_STRUCTURED_MODEL: z.string().default("Qwen/Qwen3-4B-Instruct-2507"),
  HF_FALLBACK_MODEL: z.string().default("Qwen/Qwen3-4B-Instruct-2507"),
  HF_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
});

export type Env = z.infer<typeof EnvSchema> & {
  /** Fournisseur IA retenu : Hugging Face si un jeton est présent, sinon hors ligne. */
  aiProvider: "huggingface" | "offline";
  webOrigins: string[];
};

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join(".")} : ${i.message}`);
    throw new Error(`Configuration invalide :\n${lines.join("\n")}`);
  }
  const env = parsed.data;
  const token = env.HF_TOKEN?.trim() || undefined;
  const aiProvider = env.AI_PROVIDER ?? (token ? "huggingface" : "offline");
  if (aiProvider === "huggingface" && !token) {
    throw new Error("Configuration invalide :\n  - HF_TOKEN : obligatoire quand AI_PROVIDER vaut huggingface.");
  }
  return {
    ...env,
    HF_TOKEN: token,
    aiProvider,
    webOrigins: env.WEB_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean),
  };
}

/** Jeton d'injection de la configuration. */
export const ENV = Symbol("ENV");
