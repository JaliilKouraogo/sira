import { Body, Controller, Get, Injectable, Module, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { notFound } from "../common/app-error";
import { CurrentUser, type AuthUser } from "../common/auth";
import { ApiZodBody, ZodPipe } from "../common/zod";
import { PrismaService } from "../prisma/prisma.service";

export const UpdateMeSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    locale: z.enum(["fr", "en"]),
  })
  .partial();
type UpdateMeInput = z.output<typeof UpdateMeSchema>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { memberships: { include: { organization: true }, orderBy: { createdAt: "asc" } } },
    });
    if (!user || user.deletedAt) throw notFound("Compte");
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      locale: user.locale,
      emailVerifiedAt: user.emailVerifiedAt,
      phoneVerifiedAt: user.phoneVerifiedAt,
      twoFactorEnabled: user.twoFactorSecret !== null,
      createdAt: user.createdAt,
      organizations: user.memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.tradeName ?? m.organization.legalName,
        role: m.role,
        verificationStatus: m.organization.verificationStatus,
      })),
    };
  }

  async update(userId: string, input: UpdateMeInput) {
    await this.prisma.user.update({ where: { id: userId }, data: input });
    return this.me(userId);
  }
}

@ApiTags("Comptes")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  @ApiOperation({ summary: "Compte courant et organisations rattachées" })
  me(@CurrentUser() user: AuthUser) {
    return this.users.me(user.id);
  }

  @Patch("me")
  @ApiOperation({ summary: "Modifier son compte" })
  @ApiZodBody(UpdateMeSchema)
  update(@CurrentUser() user: AuthUser, @Body(new ZodPipe(UpdateMeSchema)) body: UpdateMeInput) {
    return this.users.update(user.id, body);
  }
}

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
