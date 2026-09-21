import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import type { Application, NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { z } from "zod";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";
import { requestIdMiddleware } from "./common/request-id";
import type { Env } from "./config/env";

// Messages de validation en français, pour toutes les routes.
z.config(z.locales.fr());

export const API_PREFIX = "api/v1";
const DOCS_PATH = "api/docs";

/**
 * Réglages communs au serveur et aux tests e2e : préfixe, en-têtes de
 * sécurité, cookies, CORS, format d'erreur et documentation OpenAPI.
 */
export function configureApp(app: INestApplication, env: Env): void {
  // « 1 » : nombre de proxys de confiance ; « true » : tous ; sinon, liste d'adresses.
  if (env.TRUST_PROXY) {
    const value = /^\d+$/.test(env.TRUST_PROXY) ? Number(env.TRUST_PROXY) : env.TRUST_PROXY === "true" || env.TRUST_PROXY;
    (app.getHttpAdapter().getInstance() as Application).set("trust proxy", value);
  }
  app.setGlobalPrefix(API_PREFIX);
  app.use(requestIdMiddleware);
  app.use(securityHeaders());
  app.use(cookieParser());
  app.enableCors({ origin: env.webOrigins, credentials: true, exposedHeaders: ["x-request-id"] });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle("API SIRA")
    .setDescription(
      "API REST de SIRA. Erreurs au format `{ error: { code, message, details, requestId } }`, " +
        "pagination par curseur, jeton d'accès dans l'en-tête `Authorization`.",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(DOCS_PATH, app, document, { jsonDocumentUrl: `${DOCS_PATH}/openapi.json` });
}

/**
 * En-têtes Helmet partout. La politique de contenu est assouplie sur la seule
 * page de documentation, dont l'interface charge ses propres scripts.
 */
function securityHeaders() {
  const strict = helmet();
  const docs = helmet({ contentSecurityPolicy: false });
  return (req: Request, res: Response, next: NextFunction) =>
    req.path.startsWith(`/${DOCS_PATH}`) ? docs(req, res, next) : strict(req, res, next);
}
