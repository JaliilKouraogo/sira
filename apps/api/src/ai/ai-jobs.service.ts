import { Inject, Injectable } from "@nestjs/common";
import type { AiJobType } from "@sira/shared";
import { notFound } from "../common/app-error";
import type { AuthUser } from "../common/auth";
import { PrismaService } from "../prisma/prisma.service";
import { AI_PROVIDER, type AiProvider, type CallMeta } from "./providers/ai-provider";

/**
 * Journal systématique des appels IA (section 9.1 du plan) : chaque appel
 * crée une ligne `AiJob` avec le fournisseur, le modèle, les jetons et la
 * latence, qu'il réussisse ou échoue. C'est la base du suivi du coût IA par
 * utilisateur et du tableau des coûts du back-office.
 *
 * Le contenu des échanges n'est pas conservé : seule une référence à l'objet
 * traité l'est (`job:<id>` par exemple).
 */
@Injectable()
export class AiJobsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
  ) {}

  async record<T extends CallMeta>(
    input: { userId?: string | null; type: AiJobType; inputRef?: string },
    task: () => Promise<T>,
  ): Promise<{ result: T; aiJobId: string }> {
    const job = await this.prisma.aiJob.create({
      data: {
        userId: input.userId ?? null,
        type: input.type,
        status: "running",
        provider: this.provider.name,
        model: "en attente",
        inputRef: input.inputRef ?? null,
      },
    });
    const started = Date.now();
    try {
      const result = await task();
      await this.prisma.aiJob.update({
        where: { id: job.id },
        data: {
          status: "succeeded",
          provider: result.provider,
          model: result.model,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          cachedTokens: result.usage.cachedTokens,
          // Crédits gratuits Hugging Face : aucun coût facturé à ce stade.
          costUsd: 0,
          latencyMs: result.latencyMs,
          completedAt: new Date(),
        },
      });
      return { result, aiJobId: job.id };
    } catch (error) {
      await this.prisma.aiJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          error: (error instanceof Error ? error.message : String(error)).slice(0, 500),
          latencyMs: Date.now() - started,
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  /** État d'une tâche IA, visible par son auteur et par l'administration. */
  async get(user: AuthUser, id: string) {
    const job = await this.prisma.aiJob.findUnique({ where: { id } });
    if (!job || (job.userId !== user.id && user.role !== "admin")) throw notFound("Tâche IA");
    return {
      id: job.id,
      type: job.type,
      status: job.status,
      provider: job.provider,
      model: job.model,
      inputTokens: job.inputTokens,
      outputTokens: job.outputTokens,
      latencyMs: job.latencyMs,
      error: job.status === "failed" ? "La tâche n'a pas abouti." : null,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    };
  }
}
