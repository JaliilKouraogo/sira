import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserRole } from "@sira/shared";
import { AppError, forbidden } from "../common/app-error";
import { IS_PUBLIC, ROLES, type AuthedRequest } from "../common/auth";
import { TokensService } from "./tokens.service";

/**
 * Authentification par défaut sur toutes les routes, sauf celles marquées
 * `@Public()`. Sur une route publique, un jeton invalide est ignoré plutôt
 * que refusé : la personne est simplement traitée en visiteur.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokensService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (ctx.getType() !== "http") return true;
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()]) ?? false;
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();

    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : undefined;
    if (token) {
      const payload = await this.tokens.verifyAccess(token);
      if (payload) req.user = { id: payload.sub, role: payload.role };
      else if (!isPublic) throw new AppError(401, "invalid_token", "Session expirée ou invalide. Reconnectez-vous.");
    }
    if (!req.user && !isPublic) {
      throw new AppError(401, "authentication_required", "Connectez-vous pour accéder à cette ressource.");
    }
    return true;
  }
}

/** Contrôle du rôle déclaré par `@Roles(...)`, après l'authentification. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES, [ctx.getHandler(), ctx.getClass()]);
    if (!roles?.length) return true;
    const user = ctx.switchToHttp().getRequest<AuthedRequest>().user;
    if (!user) throw new AppError(401, "authentication_required", "Connectez-vous pour accéder à cette ressource.");
    if (!roles.includes(user.role)) throw forbidden("Cette action est réservée à un autre type de compte.");
    return true;
  }
}
