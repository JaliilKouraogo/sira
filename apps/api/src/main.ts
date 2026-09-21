import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { existsSync } from "node:fs";
import path from "node:path";
import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";
import { ENV, type Env } from "./config/env";

async function bootstrap(): Promise<void> {
  // En local, les variables viennent de apps/api/.env ; en production, de l'environnement.
  const envFile = path.resolve(__dirname, "..", ".env");
  if (existsSync(envFile)) process.loadEnvFile(envFile);

  const app = await NestFactory.create(AppModule);
  const env = app.get<Env>(ENV);
  configureApp(app, env);
  await app.listen(env.PORT);

  const logger = new Logger("SIRA");
  logger.log(`API prête sur http://localhost:${env.PORT}/api/v1`);
  logger.log(`Documentation : http://localhost:${env.PORT}/api/docs`);
  logger.log(
    env.aiProvider === "huggingface"
      ? `IA : Hugging Face (${env.HF_CHAT_MODEL}, ${env.HF_STRUCTURED_MODEL})`
      : "IA : hors ligne, réponses préparées",
  );
}

void bootstrap();
