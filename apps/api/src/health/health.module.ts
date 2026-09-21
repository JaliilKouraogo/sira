import { Controller, Get, Inject, Module } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { Public } from "../common/auth";
import { ENV, type Env } from "../config/env";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("Santé")
@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /** État de l'API, de la base et du fournisseur IA configuré. */
  @Get()
  @Public()
  @SkipThrottle()
  @ApiOperation({ summary: "État de l'API" })
  async check() {
    const database = await this.prisma.$queryRaw`SELECT 1`.then(
      () => "ok" as const,
      () => "indisponible" as const,
    );
    return {
      status: database === "ok" ? "ok" : "degrade",
      database,
      ai:
        this.env.aiProvider === "huggingface"
          ? { provider: "huggingface", chatModel: this.env.HF_CHAT_MODEL, structuredModel: this.env.HF_STRUCTURED_MODEL }
          : { provider: "offline" },
    };
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
