import { z } from "zod";
import { AiProviderError } from "./ai-provider";
import { HuggingFaceProvider } from "./huggingface.provider";

const CONFIG = {
  token: "hf_test",
  baseUrl: "https://router.test/v1",
  chatModel: "modele-conversation",
  structuredModel: "modele-structure",
  fallbackModel: "modele-secours",
  timeoutMs: 5000,
};

type Reply = { status?: number; body: unknown; headers?: Record<string, string> };

/** Faux `fetch` qui rejoue une suite de réponses et garde les requêtes reçues. */
function fakeFetch(replies: Reply[]) {
  const calls: { model: string; responseFormat?: { type: string } }[] = [];
  const impl = jest.fn(async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as { model: string; response_format?: { type: string } };
    calls.push({ model: body.model, responseFormat: body.response_format });
    const reply = replies.shift();
    if (!reply) throw new Error("Réponse inattendue");
    return new Response(JSON.stringify(reply.body), {
      status: reply.status ?? 200,
      headers: { "content-type": "application/json", ...reply.headers },
    });
  });
  return { impl: impl as unknown as typeof fetch, calls };
}

const completion = (content: string, finish = "stop") => ({
  model: "modele-renvoye",
  choices: [{ message: { content }, finish_reason: finish }],
  usage: { prompt_tokens: 12, completion_tokens: 8 },
});

const messages = [{ role: "user" as const, content: "Bonjour" }];
const schema = z.strictObject({ explanation: z.string().min(5) });

describe("HuggingFaceProvider", () => {
  it("renvoie le texte, le modèle, le fournisseur et les jetons", async () => {
    const { impl, calls } = fakeFetch([{ body: completion("Bonjour à vous."), headers: { "x-inference-provider": "nscale" } }]);
    const result = await new HuggingFaceProvider(CONFIG, impl).complete({ task: "chat", messages });
    expect(result.text).toBe("Bonjour à vous.");
    expect(result.provider).toBe("huggingface:nscale");
    expect(result.usage).toEqual({ inputTokens: 12, outputTokens: 8, cachedTokens: 0 });
    expect(calls[0].model).toBe("modele-conversation");
  });

  it("retire le raisonnement exposé entre balises", async () => {
    const { impl } = fakeFetch([{ body: completion("<think>je réfléchis</think>Réponse finale.") }]);
    const result = await new HuggingFaceProvider(CONFIG, impl).complete({ task: "chat", messages });
    expect(result.text).toBe("Réponse finale.");
  });

  it("passe au modèle de secours quand le premier est saturé", async () => {
    const { impl, calls } = fakeFetch([
      { status: 429, body: { error: "Trop de requêtes" } },
      { body: completion("Réponse du secours.") },
    ]);
    const result = await new HuggingFaceProvider(CONFIG, impl).complete({ task: "chat", messages });
    expect(result.text).toBe("Réponse du secours.");
    expect(calls.map((c) => c.model)).toEqual(["modele-conversation", "modele-secours"]);
  });

  it("n'essaie pas d'autre modèle quand le jeton est refusé", async () => {
    const { impl, calls } = fakeFetch([{ status: 401, body: { error: "Invalid token" } }]);
    await expect(new HuggingFaceProvider(CONFIG, impl).complete({ task: "chat", messages })).rejects.toMatchObject({
      code: "http_401",
      retryable: false,
    });
    expect(calls).toHaveLength(1);
  });

  it("lit le motif d'arrêt avant le contenu et ne rejoue pas un refus", async () => {
    const { impl, calls } = fakeFetch([{ body: completion("contenu", "content_filter") }]);
    await expect(new HuggingFaceProvider(CONFIG, impl).complete({ task: "chat", messages })).rejects.toBeInstanceOf(
      AiProviderError,
    );
    expect(calls).toHaveLength(1);
  });

  it("valide la sortie structurée avec le schéma imposé", async () => {
    const { impl, calls } = fakeFetch([{ body: completion('{"explanation":"Texte valide."}') }]);
    const result = await new HuggingFaceProvider(CONFIG, impl).completeStructured({ schema, schemaName: "test", messages });
    expect(result.data).toEqual({ explanation: "Texte valide." });
    expect(calls[0]).toMatchObject({ model: "modele-structure", responseFormat: { type: "json_schema" } });
  });

  it("repasse en JSON libre quand le fournisseur refuse les schémas", async () => {
    const { impl, calls } = fakeFetch([
      { status: 405, body: { message: "json_schema response format is not supported for model" } },
      { body: completion('Voici : {"explanation":"Texte valide."}') },
    ]);
    const result = await new HuggingFaceProvider(CONFIG, impl).completeStructured({ schema, schemaName: "test", messages });
    expect(result.data.explanation).toBe("Texte valide.");
    expect(calls.map((c) => c.responseFormat?.type)).toEqual(["json_schema", "json_object"]);
  });

  it("relance une fois avec les écarts quand la sortie ne respecte pas le schéma", async () => {
    const { impl, calls } = fakeFetch([
      { body: completion('{"explication":"mauvaise clé"}') },
      { body: completion('{"explanation":"Clé corrigée."}') },
    ]);
    const result = await new HuggingFaceProvider(CONFIG, impl).completeStructured({ schema, schemaName: "test", messages });
    expect(result.data.explanation).toBe("Clé corrigée.");
    expect(result.usage.inputTokens).toBe(24);
    expect(calls).toHaveLength(2);
  });

  it("échoue proprement si le modèle ne corrige pas sa sortie", async () => {
    const { impl } = fakeFetch([
      { body: completion("pas de JSON") },
      { body: completion("toujours pas") },
      { body: completion("pas de JSON non plus") },
      { body: completion("rien") },
    ]);
    await expect(
      new HuggingFaceProvider(CONFIG, impl).completeStructured({ schema, schemaName: "test", messages }),
    ).rejects.toMatchObject({ code: "invalid_output" });
  });
});
