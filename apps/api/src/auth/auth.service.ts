import { Injectable } from "@nestjs/common";
import { CONSENT_MATRIX, CONSENT_TYPES, type ConsentType, type NotificationChannel } from "@sira/shared";
import { AppError, conflict } from "../common/app-error";
import { AuditService } from "../audit/audit.service";
import type { Prisma, User } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { normalizePhone, type LoginInput, type RegisterInput } from "./auth.schemas";
import { PasswordService } from "./password.service";
import { TokensService, type ClientMeta, type IssuedTokens } from "./tokens.service";

export interface AuthResult {
  user: User;
  tokens: IssuedTokens;
}

/** Canaux ouverts dès l'inscription. WhatsApp exige un accord donné au moment de la liaison. */
const SIGNUP_CHANNELS: NotificationChannel[] = ["in_app", "email"];

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokensService,
    private readonly audit: AuditService,
  ) {}

  async register(input: RegisterInput, meta: ClientMeta): Promise<AuthResult> {
    const phone = input.phone ? normalizePhone(input.phone) : null;
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: input.email }, ...(phone ? [{ phone }] : [])] },
      select: { email: true },
    });
    if (existing) {
      throw existing.email === input.email
        ? conflict("email_taken", "Un compte existe déjà avec cette adresse e-mail.")
        : conflict("phone_taken", "Un compte existe déjà avec ce numéro de téléphone.");
    }

    const passwordHash = await this.passwords.hash(input.password);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: input.email,
          phone,
          passwordHash,
          role: input.role,
          firstName: input.firstName,
          lastName: input.lastName,
          ...(input.role === "candidate" ? { candidateProfile: { create: {} } } : {}),
        },
      });
      await tx.consent.createMany({ data: signupConsents(created.id, input.marketingOptIn, meta) });
      return created;
    });

    await this.audit.log({ actorId: user.id, action: "user.registered", objectType: "user", objectId: user.id, ip: meta.ip });
    return { user, tokens: await this.tokens.issue(user, meta) };
  }

  async login(input: LoginInput, meta: ClientMeta): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    const valid = user
      ? await this.passwords.verify(user.passwordHash, input.password)
      : await this.passwords.verifyAgainstDummy(input.password);
    if (!user || !valid) {
      throw new AppError(401, "invalid_credentials", "Adresse e-mail ou mot de passe incorrect.");
    }
    if (user.status !== "active" || user.deletedAt) {
      throw new AppError(403, "account_inactive", "Ce compte est suspendu ou fermé. Contactez l'équipe SIRA.");
    }
    return { user, tokens: await this.tokens.issue(user, meta) };
  }
}

/**
 * Consentements enregistrés à l'inscription, d'après la matrice de la
 * section 10.2 : le nécessaire au service et les préférences sont actifs,
 * les communications commerciales suivent le choix explicite de la personne.
 */
function signupConsents(userId: string, marketingOptIn: boolean, meta: ClientMeta): Prisma.ConsentCreateManyInput[] {
  return CONSENT_TYPES.flatMap((consentType: ConsentType) =>
    SIGNUP_CHANNELS.map((channel) => {
      const basis = CONSENT_MATRIX[consentType][channel];
      return {
        userId,
        consentType,
        channel,
        basis,
        granted: basis === "consentement" ? marketingOptIn : true,
        source: "inscription",
        ip: meta.ip ?? null,
        userAgent: meta.userAgent?.slice(0, 300) ?? null,
      };
    }),
  );
}
