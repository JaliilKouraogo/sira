import { z } from "zod";
import {
  AiProviderError,
  type AiProvider,
  type ChatMessage,
  type CompletionChunk,
  type CompletionRequest,
  type CompletionResult,
  type StructuredRequest,
  type StructuredResult,
} from "./ai-provider";

export interface HuggingFaceConfig {
  token: string;
  baseUrl: string;
  chatModel: string;
  structuredModel: string;
  fallbackModel: string;
  timeoutMs: number;
}

type ResponseFormat =
  | { type: "json_schema"; json_schema: { name: string; schema: unknown; strict: boolean } }
  | { type: "json_object" };

interface ChatCompletionBody {
  model?: string;
  choices?: { message?: { content?: string | null }; finish_reason?: string }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } };
  error?: { message?: string } | string;
  message?: string;
}

/**
 * Adaptateur Hugging Face : routeur d'inférence compatible OpenAI, avec un
 * jeton gratuit. Deux modèles par défaut, choisis après essai :
 *
 * - conversation : Llama 3.1 8B, le plus juste en français ;
 * - sorties structurées : Qwen3 4B, qui respecte les schémas JSON imposés,
 *   ce que Llama refuse chez le fournisseur qui le sert.
 *
 * Un modèle indisponible, saturé ou trop lent cède la place au modèle de
 * secours. Un refus du modèle n'est pas rejoué : l'appelant bascule sur sa
 * réponse préparée.
 */
export class HuggingFaceProvider implements AiProvider {
  readonly name = "huggingface";
  readonly available = true;

  constructor(
    private readonly config: HuggingFaceConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    return this.withFallback(request.model ?? this.modelFor(request.task), (model) => this.call(model, request));
  }

  async completeStructured<T>(request: StructuredRequest<T>): Promise<StructuredResult<T>> {
    const schema = z.toJSONSchema(request.schema, { unrepresentable: "any" }) as Record<string, unknown>;
    delete schema.$schema;
    const format: ResponseFormat = {
      type: "json_schema",
      json_schema: { name: request.schemaName, schema, strict: true },
    };
    const base: CompletionRequest = { ...request, task: "structured" };

    return this.withFallback(request.model ?? this.config.structuredModel, async (model) => {
      let result: CompletionResult;
      try {
        result = await this.call(model, base, format);
      } catch (error) {
        // Certains fournisseurs refusent les schémas imposés : on demande
        // alors du JSON libre, en décrivant le schéma dans les consignes.
        if (!(error instanceof AiProviderError) || !isFormatUnsupported(error)) throw error;
        result = await this.call(model, withSchemaInstructions(base, schema), { type: "json_object" });
      }

      const first = parseAndValidate(result.text, request.schema);
      if (first.ok) return { ...result, data: first.data };

      // Une seule relance, avec les écarts constatés.
      const repair: CompletionRequest = {
        ...base,
        messages: [
          ...base.messages,
          { role: "assistant", content: result.text },
          {
            role: "user",
            content: `Ta réponse ne respecte pas le format attendu (${first.error}). Renvoie uniquement le JSON corrigé, sans aucun texte autour.`,
          },
        ],
      };
      const second = await this.call(model, repair, { type: "json_object" }).catch(() => null);
      const retried = second ? parseAndValidate(second.text, request.schema) : null;
      if (second && retried?.ok) {
        return { ...second, usage: sumUsage(result.usage, second.usage), latencyMs: result.latencyMs + second.latencyMs, data: retried.data };
      }
      throw new AiProviderError("invalid_output", "La réponse du modèle ne respecte pas le schéma attendu.", true);
    });
  }

  async *stream(request: CompletionRequest): AsyncIterable<CompletionChunk> {
    const response = await this.post(request.model ?? this.modelFor(request.task), request, undefined, true);
    if (!response.body) throw new AiProviderError("empty_output", "Flux vide.", true);
    const decoder = new TextDecoder();
    let buffer = "";
    for await (const bytes of response.body as unknown as AsyncIterable<Uint8Array>) {
      buffer += decoder.decode(bytes, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const data = line.startsWith("data:") ? line.slice(5).trim() : "";
        if (!data || data === "[DONE]") continue;
        try {
          const delta = (JSON.parse(data) as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta?.content;
          if (delta) yield { delta };
        } catch {
          // Ligne incomplète ou commentaire du flux : ignorée.
        }
      }
    }
  }

  /** Estimation : le routeur n'expose pas de comptage. Environ 4 caractères par jeton. */
  async countTokens(request: CompletionRequest): Promise<number> {
    const chars = request.messages.reduce((sum, m) => sum + m.content.length, 0);
    return Math.ceil(chars / 4);
  }

  // -------------------------------------------------------------------------

  private modelFor(task: CompletionRequest["task"]): string {
    return task === "structured" ? this.config.structuredModel : this.config.chatModel;
  }

  private async withFallback<T>(primary: string, attempt: (model: string) => Promise<T>): Promise<T> {
    const models = [...new Set([primary, this.config.fallbackModel])];
    let lastError: unknown;
    for (const model of models) {
      try {
        return await attempt(model);
      } catch (error) {
        lastError = error;
        if (!(error instanceof AiProviderError) || !error.retryable) throw error;
      }
    }
    throw lastError;
  }

  private async call(model: string, request: CompletionRequest, format?: ResponseFormat): Promise<CompletionResult> {
    const started = Date.now();
    const response = await this.post(model, request, format, false);
    const body = (await response.json().catch(() => ({}))) as ChatCompletionBody;
    const choice = body.choices?.[0];

    // Le motif d'arrêt est lu avant le contenu (section 9.2 du plan).
    if (choice?.finish_reason === "content_filter") {
      throw new AiProviderError("refused", "Le modèle a refusé de répondre.", false);
    }
    const text = stripReasoning(choice?.message?.content ?? "");
    if (!text) throw new AiProviderError("empty_output", "Le modèle n'a rien renvoyé.", true);

    return {
      text,
      finishReason: choice?.finish_reason,
      model: body.model ?? model,
      provider: `huggingface:${response.headers.get("x-inference-provider") ?? "auto"}`,
      usage: {
        inputTokens: body.usage?.prompt_tokens ?? 0,
        outputTokens: body.usage?.completion_tokens ?? 0,
        cachedTokens: body.usage?.prompt_tokens_details?.cached_tokens ?? 0,
      },
      latencyMs: Date.now() - started,
    };
  }

  private async post(model: string, request: CompletionRequest, format: ResponseFormat | undefined, stream: boolean) {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.config.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: request.messages,
          max_tokens: request.maxTokens ?? 512,
          temperature: request.temperature ?? 0.3,
          stream,
          ...(format && { response_format: format }),
        }),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (error) {
      const timeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      throw new AiProviderError(
        timeout ? "timeout" : "network_error",
        timeout ? "Le modèle n'a pas répondu à temps." : "Hugging Face est injoignable.",
        true,
      );
    }
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as ChatCompletionBody;
      const detail = typeof body.error === "string" ? body.error : (body.error?.message ?? body.message ?? response.statusText);
      throw new AiProviderError(`http_${response.status}`, detail, isRetryableStatus(response.status), response.status);
    }
    return response;
  }
}

/** 401 et 403 signalent un jeton refusé : inutile d'essayer un autre modèle. */
function isRetryableStatus(status: number): boolean {
  return status === 404 || status === 408 || status === 409 || status === 429 || status >= 500;
}

function isFormatUnsupported(error: AiProviderError): boolean {
  return (
    (error.status === 400 || error.status === 405 || error.status === 422) &&
    /response_format|json_schema|not supported/i.test(error.message)
  );
}

function withSchemaInstructions(request: CompletionRequest, schema: Record<string, unknown>): CompletionRequest {
  const instruction: ChatMessage = {
    role: "system",
    content: `Réponds uniquement par un objet JSON conforme à ce schéma, sans texte autour : ${JSON.stringify(schema)}`,
  };
  return { ...request, messages: [...request.messages, instruction] };
}

/** Certains modèles exposent leur raisonnement entre balises : il n'est jamais renvoyé. */
function stripReasoning(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

function parseAndValidate<T>(text: string, schema: z.ZodType<T>): { ok: true; data: T } | { ok: false; error: string } {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return { ok: false, error: "aucun objet JSON" };
  let value: unknown;
  try {
    value = JSON.parse(text.slice(start, end + 1));
  } catch {
    return { ok: false, error: "JSON illisible" };
  }
  const result = schema.safeParse(value);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: result.error.issues.map((i) => `${i.path.join(".") || "racine"} : ${i.message}`).join(" ; ") };
}

function sumUsage(a: CompletionResult["usage"], b: CompletionResult["usage"]) {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    cachedTokens: a.cachedTokens + b.cachedTokens,
  };
}
