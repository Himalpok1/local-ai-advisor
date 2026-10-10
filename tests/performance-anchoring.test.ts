import { describe, expect, it } from "vitest";
import { getHardware, getModel, getRuntime, getTool, QUANTIZATIONS, BENCHMARKS } from "@/data";
import { estimatePerformance, matchBenchmarks, averagePrefillTps, type PerfContext } from "@/lib/performance";
import { resolveWorkload } from "@/lib/workloads/resolve";
import type { Benchmark } from "@/lib/schemas";

// Synthetic regression fixture: never part of the published measurement dataset.
const runtime = getRuntime("llama.cpp");
const c: PerfContext = {
  hardware: getHardware("pc-rtx-4090-64"), model: getModel("qwen3-8b"),
  quant: QUANTIZATIONS.q4, format: "gguf", runtime,
  backend: runtime.backends.find((b) => b.api === "cuda")!,
  kvCacheType: "f16", offloadFraction: 1, batteryPenalty: 1,
};
const b: Benchmark = { ...BENCHMARKS[0], id: "synthetic-only", chipKey: c.hardware.chipKey,
  modelId: c.model.id, quant: "q4", quantLabel: "Q4_K_M", runtimeId: runtime.id,
  backend: "cuda", generationTps: 100, prefillTps: 1000,
  contextTokens: 0, outputTokens: 128, promptTokens: 512,
  referenceSettings: { format: "gguf", kvCacheType: "f16", offloadFraction: 1, batteryPenalty: 1 },
};
const w = resolveWorkload({ useCase: "casual-chat", toolId: "api-only" }, getTool("api-only"));
function predict(ctx = c, benchmark = b, depth = 64) {
  const match = matchBenchmarks(ctx, [benchmark], new Map([[c.model.id, c.model]]), QUANTIZATIONS);
  return estimatePerformance(ctx, { ...w, typicalContextTokens: depth }, match);
}

describe("independent benchmark normalization", () => {
  it("reproduces reference decode and average prefill", () => {
    const p = predict();
    expect(p.generationTps).toBeCloseTo(100, 8);
    expect(averagePrefillTps(p.prefillTps, b.promptTokens, c.model)).toBeCloseTo(1000, 8);
    expect(p.basis).toBe("anchored");
    expect(p.uncertainty.empiricallyValidated).toBe(false);
  });
  it("retains full, partial and zero GPU placement penalties", () => {
    const full = predict();
    const partial = predict({ ...c, offloadFraction: 0.25 });
    const cpu = predict({ ...c, offloadFraction: 0 });
    expect(full.generationTps).toBeGreaterThan(partial.generationTps);
    expect(partial.generationTps).toBeGreaterThan(cpu.generationTps);
    expect(full.prefillTps).toBeGreaterThan(partial.prefillTps);
    expect(partial.prefillTps).toBeGreaterThan(cpu.prefillTps);
  });
  it("preserves battery, cache, context and wrapper effects", () => {
    expect(predict({ ...c, batteryPenalty: 0.7 }).generationTps).toBeCloseTo(70, 8);
    expect(predict(c, b, 8192).generationTps).toBeLessThan(predict().generationTps);
    expect(predict({ ...c, kvCacheType: "q4" }, b, 8192).generationTps).toBeGreaterThan(predict(c, b, 8192).generationTps);
    const wrapper = predict({ ...c, runtime: { ...runtime, id: "ollama" } });
    expect(wrapper.generationTps).toBeCloseTo(95, 8);
    expect(wrapper.prefillTps).toBeCloseTo(920, 8);
  });
  it("normalizes explicit partial placement and cache settings independently", () => {
    const ref = { ...b, referenceSettings: { ...b.referenceSettings!, offloadFraction: 0.25, kvCacheType: "q4" as const, batteryPenalty: 0.7 } };
    expect(predict({ ...c, offloadFraction: 0.25, kvCacheType: "q4", batteryPenalty: 0.7 }, ref).generationTps).toBeCloseTo(100, 8);
  });
  it("does not directly anchor a different quant variant or format", () => {
    expect(predict(c, { ...b, quantLabel: "Q4_0" }).basis).toBe("calibrated");
    expect(predict({ ...c, format: "mlx" }).basis).toBe("calibrated");
  });
  it("labels legacy assumptions without fabricating settings", () => {
    const p = predict(c, { ...b, referenceSettings: undefined });
    expect(p.benchmarkSources[0].referenceSettings).toBeUndefined();
    expect(p.benchmarkSources[0].assumptions).toContain("full GPU placement");
    expect(p.basisExplanation).toContain("unverified");
  });
});
