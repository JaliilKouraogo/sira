import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const REQUEST_ID = Symbol("requestId");
/** Un identifiant fourni par le client n'est repris que s'il est sûr à journaliser. */
const SAFE_ID = /^[A-Za-z0-9._-]{8,64}$/;

/**
 * Attribue un identifiant à chaque requête, repris dans l'en-tête
 * `x-request-id` de la réponse et dans le corps des erreurs : un utilisateur
 * qui signale un problème peut le citer, et l'équipe retrouve la trace.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header("x-request-id");
  const id = incoming && SAFE_ID.test(incoming) ? incoming : randomUUID();
  (req as unknown as Record<symbol, string>)[REQUEST_ID] = id;
  res.setHeader("x-request-id", id);
  next();
}

export function requestIdOf(req: Request): string | null {
  return (req as unknown as Record<symbol, string | undefined>)[REQUEST_ID] ?? null;
}
