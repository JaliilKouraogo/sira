import { AiJobsService } from "./ai-jobs.service";
import { CvAssistantService, CvAssistInputSchema } from "./cv-assistant.service";
import type { AiProvider } from "./providers/ai-provider";

const CV_TEXT = "Gestion de stock pendant cinq ans. Organisation des inventaires et coordination quotidienne des livraisons.";

describe("CvAssistInputSchema", () => {
  it("requires a job description for adaptation", () => {
    expect(CvAssistInputSchema.safeParse({ mode: "adapt", cvText: CV_TEXT }).success).toBe(false);
  });

  it("accepts an improvement request without an offer", () => {
    expect(CvAssistInputSchema.safeParse({ mode: "improve", cvText: CV_TEXT }).success).toBe(true);
  });

  it("bounds CV text to avoid oversized model requests", () => {
    expect(CvAssistInputSchema.safeParse({ mode: "improve", cvText: "x".repeat(16_001) }).success).toBe(false);
  });
});

describe("CvAssistantService", () => {
  it("returns unavailable without calling the provider when AI is offline", async () => {
    const record = jest.fn();
    const service = new CvAssistantService(
      { record } as unknown as AiJobsService,
      { available: false } as AiProvider,
    );

    await expect(service.assist({ mode: "improve", cvText: CV_TEXT })).resolves.toEqual({
      source: "unavailable",
      proposal: null,
    });
    expect(record).not.toHaveBeenCalled();
  });

  it("logs only the task reference, never the CV content", async () => {
    const aiResult = {
      data: { rewrittenText: CV_TEXT, changes: [], warnings: [] },
      provider: "test",
      model: "test-model",
      usage: { inputTokens: 1, outputTokens: 1, cachedTokens: 0 },
      latencyMs: 1,
    };
    const record = jest.fn(async (_meta: unknown, task: () => Promise<typeof aiResult>) => ({ result: await task(), aiJobId: "ai-1" }));
    const provider = { available: true, completeStructured: jest.fn().mockResolvedValue(aiResult) } as unknown as AiProvider;
    const service = new CvAssistantService({ record } as unknown as AiJobsService, provider);

    await service.assist({ mode: "improve", cvText: CV_TEXT }, "candidate-1");

    expect(record).toHaveBeenCalledWith(
      { userId: "candidate-1", type: "cv_adaptation", inputRef: "cv-assist:improve" },
      expect.any(Function),
    );
    expect(JSON.stringify(record.mock.calls[0][0])).not.toContain(CV_TEXT);
  });
});