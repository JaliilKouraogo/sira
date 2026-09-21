import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { UserRole } from "@sira/shared";
import { AppError } from "../common/app-error";
import { ENV, type Env } from "../config/env";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

export interface ClientMeta {
  ip?: string | null;
  userAgent?: string | null;
}

export interface IssuedTokens {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresAt: Date;
}

interface AccessPayload {
  sub: string;
  role: UserRole;
}

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/**
 * Jetons de la section 4.3 du plan : accès JWT de 15 minutes, rafraîchissement
 * rotatif conservé haché. Chaque rafraîchissement remplace le jeton ; présenter
 * un jeton déjà remplacé signe un vol probable et révoque toute la famille.
 */
@Injectable()
export class TokensService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async issue(user: { id: string; role: UserRole }, meta: ClientMeta, family: string = randomUUID()): Promise<IssuedTokens> {
    const accessToken = await this.signAccess(user);
    const refreshToken = randomBytes(32).toString("base64url");
    const refreshExpiresAt = new Date(Date.now() + this.env.REFRESH_TTL_DAYS * 86_400_000);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(refreshToken),
        family,
        expiresAt: refreshExpiresAt,
        ip: meta.ip ?? null,
        userAgent: meta.userAgent?.slice(0, 300) ?? null,
      },
    });
    return { accessToken, expiresIn: this.env.JWT_ACCESS_TTL_SECONDS, refreshToken, refreshExpiresAt };
  }

  async rotate(rawToken: string | undefined, meta: ClientMeta): Promise<IssuedTokens & { userId: string }> {
    if (!rawToken) throw invalidRefresh();
    const current = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(rawToken) },
      include: { user: { select: { id: true, role: true, status: true, deletedAt: true } } },
    });
    if (!current) throw invalidRefresh();

    if (current.revokedAt) {
      await this.revokeFamily(current.family);
      await this.audit.log({
        actorId: current.userId,
        action: "auth.refresh_token_reused",
        objectType: "user",
        objectId: current.userId,
        ip: meta.ip,
      });
      throw new AppError(401, "refresh_token_reused", "Session expirée. Reconnectez-vous.");
    }
    if (current.expiresAt.getTime() <= Date.now()) throw invalidRefresh();
    if (current.user.status !== "active" || current.user.deletedAt) {
      await this.revokeFamily(current.family);
      throw new AppError(403, "account_inactive", "Ce compte n'est plus actif.");
    }

    const next = await this.issue(current.user, meta, current.family);
    await this.prisma.refreshToken.update({
      where: { id: current.id },
      data: { revokedAt: new Date(), replacedBy: sha256(next.refreshToken) },
    });
    return { ...next, userId: current.userId };
  }

  /** Déconnexion : toute la famille du jeton présenté est révoquée. */
  async revoke(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    const current = await this.prisma.refreshToken.findUnique({ where: { tokenHash: sha256(rawToken) } });
    if (current) await this.revokeFamily(current.family);
  }

  async verifyAccess(token: string): Promise<AccessPayload | null> {
    try {
      const payload = await this.jwt.verifyAsync<AccessPayload>(token, {
        secret: this.env.JWT_ACCESS_SECRET,
        algorithms: ["HS256"],
      });
      return typeof payload.sub === "string" && typeof payload.role === "string" ? payload : null;
    } catch {
      return null;
    }
  }

  private signAccess(user: { id: string; role: UserRole }): Promise<string> {
    const payload: AccessPayload = { sub: user.id, role: user.role };
    return this.jwt.signAsync(payload, {
      secret: this.env.JWT_ACCESS_SECRET,
      expiresIn: this.env.JWT_ACCESS_TTL_SECONDS,
      algorithm: "HS256",
    });
  }

  private async revokeFamily(family: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

const invalidRefresh = () => new AppError(401, "invalid_refresh_token", "Session expirée. Reconnectez-vous.");
