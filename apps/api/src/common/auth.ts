import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import type { UserRole } from "@sira/shared";
import type { Request } from "express";

/** Utilisateur authentifié, tel que porté par le jeton d'accès. */
export interface AuthUser {
  id: string;
  role: UserRole;
}

export type AuthedRequest = Request & { user?: AuthUser };

export const IS_PUBLIC = "sira:isPublic";
export const ROLES = "sira:roles";

/**
 * Route accessible sans compte. Un jeton valide reste lu s'il est fourni :
 * la réponse peut alors dépendre de l'utilisateur (offre en brouillon vue
 * par son auteur, par exemple).
 */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Rôles autorisés, en plus de l'authentification (matrice RBAC, section 11.2). */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES, roles);

/** Utilisateur courant ; `undefined` sur une route publique appelée sans jeton. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest<AuthedRequest>().user;
});
