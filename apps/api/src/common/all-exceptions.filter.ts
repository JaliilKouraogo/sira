import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AppError } from "./app-error";
import { requestIdOf } from "./request-id";

interface NormalizedError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

/** Messages génériques par statut HTTP, pour les erreurs levées par le cadre. */
const GENERIC: Record<number, { code: string; message: string }> = {
  400: { code: "bad_request", message: "La requête est invalide." },
  401: { code: "unauthorized", message: "Authentification requise." },
  403: { code: "forbidden", message: "Vous n'avez pas le droit d'effectuer cette action." },
  404: { code: "not_found", message: "Ressource introuvable." },
  405: { code: "method_not_allowed", message: "Méthode non autorisée." },
  409: { code: "conflict", message: "La ressource est dans un état incompatible avec cette action." },
  413: { code: "payload_too_large", message: "La requête est trop volumineuse." },
  415: { code: "unsupported_media_type", message: "Format de contenu non pris en charge." },
  429: { code: "rate_limited", message: "Trop de requêtes. Réessayez dans un instant." },
};

/**
 * Filtre unique : toute erreur sort au format normalisé de la section 4.3
 * du plan, `{ error: { code, message, details, requestId } }`. Une erreur
 * inattendue n'expose jamais son détail technique au client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("Erreurs");

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const requestId = requestIdOf(req);
    const error = normalize(exception);

    if (error.status >= 500) {
      const stack = exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(`${req.method} ${req.originalUrl} [${requestId}] ${stack}`);
    }

    res.status(error.status).json({
      error: { code: error.code, message: error.message, details: error.details ?? null, requestId },
    });
  }
}

function normalize(exception: unknown): NormalizedError {
  if (exception instanceof AppError) {
    return { status: exception.status, code: exception.code, message: exception.message, details: exception.details };
  }
  if (exception instanceof ThrottlerException) {
    return { status: 429, ...GENERIC[429] };
  }
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    return { status, ...(GENERIC[status] ?? { code: "http_error", message: exception.message }) };
  }
  // Corps JSON illisible : l'erreur vient de l'analyseur d'Express.
  if (isBodyParserError(exception)) {
    return { status: 400, code: "invalid_json", message: "Le corps de la requête n'est pas un JSON valide." };
  }
  const prisma = prismaError(exception);
  if (prisma) return prisma;
  return { status: 500, code: "internal_error", message: "Une erreur inattendue est survenue." };
}

function isBodyParserError(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { type?: string }).type === "entity.parse.failed";
}

/** Erreurs Prisma connues, reconnues par leur code plutôt que par leur classe. */
function prismaError(e: unknown): NormalizedError | null {
  if (typeof e !== "object" || e === null) return null;
  const { name, code } = e as { name?: string; code?: string };
  if (name !== "PrismaClientKnownRequestError" || typeof code !== "string") return null;
  if (code === "P2002") {
    return { status: 409, code: "conflict", message: "Cette ressource existe déjà." };
  }
  if (code === "P2025") {
    return { status: 404, ...GENERIC[404] };
  }
  return null;
}
