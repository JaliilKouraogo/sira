import { Body, Controller, Get, HttpCode, Module, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { z } from "zod";
import { CandidatesModule } from "../candidates/candidates.module";
import { CurrentUser, Public, Roles, type AuthUser } from "../common/auth";
import { ApiZodBody, ZodPipe } from "../common/zod";
import { ENV, type Env } from "../config/env";
import { JobsModule } from "../jobs/jobs.module";
import { AiJobsService } from "./ai-jobs.service";
import { ChatSchema, ChatService, type ChatInput } from "./chat.service";
import { MatchService } from "./match.service";
import { AI_PROVIDER, type AiProvider } from "./providers/ai-provider";
import { HuggingFaceProvider } from "./providers/huggingface.provider";
import { OfflineProvider } from "./providers/offline.provider";

/** Limites resserrées sur l'IA (section 4.3 du plan) : chaque appel consomme des crédits. */
const AI_LIMIT = { default: { limit: 10, ttl: 60_000 } };

const MatchRequestSchema = z.object({ jobId: z.string().min(1) });

@ApiTags("IA")
@ApiBearerAuth()
@Controller("ai")
export class AiController {
  constructor(
    private readonly match: MatchService,
    private readonly chat: ChatService,
    private readonly aiJobs: AiJobsService,
  ) {}

  @Post("match")
  @HttpCode(200)
  @Roles("candidate")
  @Throttle(AI_LIMIT)
  @ApiOperation({ summary: "Calculer mon score de compatibilité avec une offre" })
  @ApiZodBody(MatchRequestSchema)
  compute(@CurrentUser() user: AuthUser, @Body(new ZodPipe(MatchRequestSchema)) body: z.output<typeof MatchRequestSchema>) {
    return this.match.compute(user, body.jobId);
  }

  @Get("match-scores/:jobId")
  @Roles("candidate")
  @ApiOperation({ summary: "Dernier score calculé pour une offre" })
  latest(@CurrentUser() user: AuthUser, @Param("jobId") jobId: string) {
    return this.match.latest(user, jobId);
  }

  /** Ouvert aux visiteurs : c'est l'assistant du site public. */
  @Post("chat")
  @HttpCode(200)
  @Public()
  @Throttle(AI_LIMIT)
  @ApiOperation({ summary: "Poser une question à l'assistant SIRA" })
  @ApiZodBody(ChatSchema)
  ask(@Body(new ZodPipe(ChatSchema)) body: ChatInput, @CurrentUser() user?: AuthUser) {
    return this.chat.reply(body, user);
  }

  @Get("jobs/:id")
  @ApiOperation({ summary: "État d'une tâche IA" })
  job(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.aiJobs.get(user, id);
  }
}

@Module({
  imports: [CandidatesModule, JobsModule],
  controllers: [AiController],
  providers: [
    {
      provide: AI_PROVIDER,
      inject: [ENV],
      useFactory: (env: Env): AiProvider =>
        env.aiProvider === "huggingface" && env.HF_TOKEN
          ? new HuggingFaceProvider({
              token: env.HF_TOKEN,
              baseUrl: env.HF_BASE_URL,
              chatModel: env.HF_CHAT_MODEL,
              structuredModel: env.HF_STRUCTURED_MODEL,
              fallbackModel: env.HF_FALLBACK_MODEL,
              timeoutMs: env.HF_TIMEOUT_MS,
            })
          : new OfflineProvider(),
    },
    AiJobsService,
    MatchService,
    ChatService,
  ],
  exports: [MatchService],
})
export class AiModule {}
