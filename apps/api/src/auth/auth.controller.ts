import { Body, Controller, HttpCode, Inject, Post, Req, Res } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { Public } from "../common/auth";
import { ApiZodBody, ZodPipe } from "../common/zod";
import { ENV, type Env } from "../config/env";
import { LoginSchema, RegisterSchema, type LoginInput, type RegisterInput } from "./auth.schemas";
import { AuthService, type AuthResult } from "./auth.service";
import { TokensService, type ClientMeta, type IssuedTokens } from "./tokens.service";

/** Le jeton de rafraîchissement ne circule que vers les routes d'authentification. */
const REFRESH_COOKIE = "sira_refresh";
const REFRESH_PATH = "/api/v1/auth";

/** Limites resserrées sur l'authentification (section 4.3 du plan). */
const AUTH_LIMIT = { default: { limit: 10, ttl: 60_000 } };

@ApiTags("Authentification")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokensService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Post("register")
  @Public()
  @Throttle(AUTH_LIMIT)
  @ApiOperation({ summary: "Créer un compte candidat ou recruteur" })
  @ApiZodBody(RegisterSchema)
  async register(
    @Body(new ZodPipe(RegisterSchema)) body: RegisterInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.respond(res, await this.auth.register(body, clientMeta(req)));
  }

  @Post("login")
  @HttpCode(200)
  @Public()
  @Throttle(AUTH_LIMIT)
  @ApiOperation({ summary: "Se connecter par e-mail et mot de passe" })
  @ApiZodBody(LoginSchema)
  async login(
    @Body(new ZodPipe(LoginSchema)) body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.respond(res, await this.auth.login(body, clientMeta(req)));
  }

  /** Publique : le jeton d'accès a souvent déjà expiré quand on rafraîchit. */
  @Post("refresh")
  @HttpCode(200)
  @Public()
  @Throttle(AUTH_LIMIT)
  @ApiOperation({ summary: "Renouveler le jeton d'accès (cookie de rafraîchissement)" })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const next = await this.tokens.rotate(readRefreshCookie(req), clientMeta(req));
    this.setRefreshCookie(res, next);
    return { accessToken: next.accessToken, tokenType: "Bearer", expiresIn: next.expiresIn };
  }

  @Post("logout")
  @HttpCode(204)
  @Public()
  @ApiOperation({ summary: "Se déconnecter et révoquer la session" })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.tokens.revoke(readRefreshCookie(req));
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_PATH });
  }

  private respond(res: Response, { user, tokens }: AuthResult) {
    this.setRefreshCookie(res, tokens);
    return {
      accessToken: tokens.accessToken,
      tokenType: "Bearer",
      expiresIn: tokens.expiresIn,
      user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
    };
  }

  private setRefreshCookie(res: Response, tokens: IssuedTokens): void {
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: this.env.NODE_ENV === "production",
      path: REFRESH_PATH,
      expires: tokens.refreshExpiresAt,
    });
  }
}

function clientMeta(req: Request): ClientMeta {
  return { ip: req.ip ?? null, userAgent: req.headers["user-agent"] ?? null };
}

function readRefreshCookie(req: Request): string | undefined {
  const value = (req.cookies as Record<string, unknown> | undefined)?.[REFRESH_COOKIE];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
