import type { z } from "zod";

/**
 * Contrat unique de la couche IA (section 9.1 du plan). Aucun module métier
 * n'appelle un fournisseur directement : changer de fournisseur ou de modèle
 * revient à changer d'adaptateur, sans toucher au reste de l'API.
 *
 * L'envoi par lots (`submitBatch` dans le plan) n'est pas exposé : Hugging
 * Face ne le propose pas. Il reviendra avec un fournisseur qui l'offre.
 */
export interface AiProvider {
  readonly name: string;
  /** Faux quand aucun modèle n'est joignable : les appelants passent alors en repli. */
  readonly available: boolean;
  complete(request: CompletionRequest): Promise<CompletionResult>;
  /** Sortie JSON validée par le schéma : jamais de texte libre analysé à la main. */
  completeStructured<T>(request: StructuredRequest<T>): Promise<StructuredResult<T>>;
  stream(request: CompletionRequest): AsyncIterable<CompletionChunk>;
  countTokens(request: CompletionRequest): Promise<number>;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Nature de la tâche : elle détermine le modèle par défaut. */
export type AiTask = "chat" | "structured";

export interface CompletionRequest {
  task: AiTask;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  /** Modèle imposé ; sinon celui de la tâche, puis le modèle de secours. */
  model?: string;
}

export interface StructuredRequest<T> extends Omit<CompletionRequest, "task"> {
  schema: z.ZodType<T>;
  schemaName: string;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
}

export interface CallMeta {
  provider: string;
  model: string;
  usage: Usage;
  latencyMs: number;
}

export interface CompletionResult extends CallMeta {
  text: string;
  finishReason?: string;
}

export interface StructuredResult<T> extends CallMeta {
  data: T;
}

export interface CompletionChunk {
  delta: string;
}

export const AI_PROVIDER = Symbol("AI_PROVIDER");

/** Échec d'un appel au fournisseur ; `retryable` indique si un autre modèle peut réussir. */
export class AiProviderError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retryable: boolean,
    readonly status?: number,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}
