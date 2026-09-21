import {
  AiProviderError,
  type AiProvider,
  type CompletionChunk,
  type CompletionResult,
  type StructuredResult,
} from "./ai-provider";

/**
 * Fournisseur retenu quand aucun jeton n'est configuré. Il ne répond jamais :
 * chaque service le sait par `available` et sert sa réponse préparée. L'API
 * reste donc entièrement utilisable sans IA, score compris.
 */
export class OfflineProvider implements AiProvider {
  readonly name = "offline";
  readonly available = false;

  complete(): Promise<CompletionResult> {
    return Promise.reject(unavailable());
  }

  completeStructured<T>(): Promise<StructuredResult<T>> {
    return Promise.reject(unavailable());
  }

  // eslint-disable-next-line require-yield
  async *stream(): AsyncIterable<CompletionChunk> {
    throw unavailable();
  }

  async countTokens(): Promise<number> {
    return 0;
  }
}

const unavailable = () => new AiProviderError("ai_unavailable", "Aucun fournisseur IA n'est configuré.", false);
