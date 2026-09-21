import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Environnement des tests e2e : base de test, IA coupée, secret de test.
 * Chargé avant chaque fichier de test et par la préparation globale.
 */
export function useTestEnvironment(): string {
  const envFile = path.join(__dirname, "..", ".env");
  if (existsSync(envFile)) process.loadEnvFile(envFile);

  const url = process.env.DATABASE_URL_TEST;
  if (!url) throw new Error("DATABASE_URL_TEST est obligatoire pour les tests e2e (voir .env.example).");
  // Garde-fou : les tests vident la base. Jamais une base dont le nom ne dit pas « test ».
  const database = new URL(url).pathname.slice(1);
  if (!/test/i.test(database)) {
    throw new Error(`Refus de lancer les tests sur la base « ${database} » : son nom doit contenir « test ».`);
  }

  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = url;
  process.env.AI_PROVIDER = "offline";
  process.env.JWT_ACCESS_SECRET = "secret-des-tests-e2e-assez-long-pour-hs256";
  return url;
}

useTestEnvironment();
