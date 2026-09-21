import { execSync } from "node:child_process";
import path from "node:path";
import { Client } from "pg";
import { useTestEnvironment } from "./test-env";

/** Avant les tests e2e : base de test vidée, puis toutes les migrations appliquées. */
export default async function globalSetup(): Promise<void> {
  const url = useTestEnvironment();
  const client = new Client({ connectionString: url });
  await client.connect();
  await client.query("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;");
  await client.end();

  execSync("npx prisma migrate deploy", {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });
}
