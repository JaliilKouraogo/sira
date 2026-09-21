/**
 * Erreur métier. Le `code` est stable, en snake_case, et sert aux clients
 * pour réagir ; le `message` est en français et peut s'afficher tel quel.
 * Le filtre global la transforme en `{ error: { code, message, details, requestId } }`.
 */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (what: string) => new AppError(404, "not_found", `${what} introuvable.`);

export const forbidden = (message = "Vous n'avez pas le droit d'effectuer cette action.") =>
  new AppError(403, "forbidden", message);

export const conflict = (code: string, message: string, details?: unknown) =>
  new AppError(409, code, message, details);
