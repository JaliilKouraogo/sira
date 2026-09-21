import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 ne charge plus le fichier .env tout seul.
const envFile = path.join(__dirname, ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Vide lors d'une simple génération du client, qui ne se connecte pas.
    url: process.env.DATABASE_URL ?? "",
  },
});
