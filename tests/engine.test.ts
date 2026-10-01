import { describe, expect, it } from "vitest";
import { BENCHMARKS, QUANTIZATIONS, getHardware, getModel } from "@/data";
import { evaluate, type EvaluateInput } from "@/lib/recommendations";
import { COMFORT_RANK } from "@/lib/schemas/results";
import { activeWeightsGB, estimateMemory, kvCacheGB, weightsGB } from "@/lib/memory";
import { getRuntime, getTool } from "@/data";

const rank = (r: { level: keyof typeof COMFORT_RANK }) => COMFORT_RANK[r.level];

const MBP_48 = getHardware("mbp-m4-pro-20c-48");
const AGENTIC = { useCase: "agentic-coding", toolId: "opencode", repositorySize: "medium" } as const;

function run(over: Omit<Partial<EvaluateInput>, "workload"> & { workload?: Partial<EvaluateInput["workload"]> } = {}) {
  const { workload, ...rest } = over;
  return evaluate({
    hardware: MBP_48,
    modelId: "qwen3-coder-30b-a3b",
    quant: "q4",
    ...rest,
    workload: { ...AGENTIC, desiredContextWindow: 32768, ...workload },
  });
}

describe("comfort is workload-specific, not just 'fits'", () => {
  it("a model can fit in memory but still be rated Borderline", () => {
    // Plenty of memory on a 48 GB machine — but too slow and too weak for an agent loop.
    const r = run({ modelId: "qwen3-14b" });
    expect(r.memory.fits).toBe(true);
    expect(r.memory.headroomGB).toBeGreaterThan(15);
    expect(r.tiers.canLoad).toBe(true);
    expect(r.tiers.canRunComfortably).toBe(false);
    expect(r.level).toBe("borderline");
    expect(r.explanation.blockers.length + r.explanation.warnings.length).toBeGreaterThan(0);
  });

  it("casual chat and agentic coding produce different results for the same hardware + model", () => {
    const chat = run({ modelId: "qwen3.6-27b", workload: { useCase: "casual-chat", toolId: "open-webui", devEnv: "light", desiredContextWindow: 8192 } });
    const agent = run({ modelId: "qwen3.6-27b" });
    expect(rank(chat)).toBeGreaterThan(rank(agent));
    expect(chat.headline).toMatch(/casual chat/);
    expect(agent.headline).toMatch(/agentic coding/);
  });

  it("16K and 64K context produce different recommendations", () => {
    const k16 = run({ workload: { toolId: "pi", desiredContextWindow: 16384 } });
    const k64 = run({ workload: { toolId: "pi", desiredContextWindow: 65536 } });
    expect(k64.memory.kvCacheGB).toBeGreaterThan(k16.memory.kvCacheGB * 3.5);
    expect(rank(k16)).toBeGreaterThan(rank(k64));
  });

  it("two simultaneous agents lower the comfort level", () => {
    const one = run({ workload: { numberOfAgents: 1 } });
    const two = run({ workload: { numberOfAgents: 2 } });
    expect(two.memory.kvCacheGB).toBeCloseTo(one.memory.kvCacheGB * 2, 5);
    expect(two.performance!.perStreamGenerationTps).toBeLessThan(one.performance!.perStreamGenerationTps);
    expect(rank(two)).toBeLessThan(rank(one));
  });

  it("larger memory headroom improves the recommendation", () => {
    const wl = { useCase: "casual-chat", toolId: "open-webui", devEnv: "heavy" } as const;
    const small = evaluate({ hardware: getHardware("mbp-m4-pro-20c-24"), modelId: "qwen3-14b", quant: "q4", workload: wl });
    const big = evaluate({ hardware: MBP_48, modelId: "qwen3-14b", quant: "q4", workload: wl });
    expect(small.memory.fits).toBe(true);
    expect(big.memory.headroomGB).toBeGreaterThan(small.memory.headroomGB + 20);
    const mem = (r: typeof big) => r.dimensions.find((d) => d.key === "memory")!.score;
    expect(mem(big)).toBeGreaterThan(mem(small));
    expect(rank(big)).toBeGreaterThan(rank(small));
  });
});

describe("memory engine", () => {
  it("Q4 and Q8 produce different memory results", () => {
    const q4 = run({ quant: "q4" });
    const q8 = run({ quant: "q8" });
    expect(q8.memory.weightsGB).toBeGreaterThan(q4.memory.weightsGB * 1.6);
    expect(q8.memory.headroomGB).toBeLessThan(q4.memory.headroomGB);
  });

  it("a heavy development environment lowers memory available to the model", () => {
    const light = run({ workload: { devEnv: "light" } });
    const heavy = run({ workload: { devEnv: "heavy" } });
    expect(light.memory.availableForInferenceGB - heavy.memory.availableForInferenceGB).toBeCloseTo(9, 5);
    expect(heavy.memory.headroomGB).toBeLessThan(light.memory.headroomGB);
  });

  it("calculates MoE memory from total parameters and decode bytes from active parameters", () => {
    const moe = getModel("qwen3-coder-30b-a3b");
    const q4 = QUANTIZATIONS.q4;
    // Published GGUF Q4_K_M size (18.56 GB → GiB) — all experts must be resident.
    expect(weightsGB(moe, q4, "gguf")).toBeCloseTo((18.56e9) / 1024 ** 3, 1);
    // MLX derived from all 30.5B params at 4.5 bpw, not from 3.3B active.
    expect(weightsGB(moe, q4, "mlx")).toBeGreaterThan(15);
    const active = activeWeightsGB(moe, q4, "gguf");
    expect(active).toBeCloseTo(weightsGB(moe, q4, "gguf") * (3.3 / 30.5), 3);
    // A dense model with similar active size needs far less memory, but a 30B dense one needs similar memory.
    const dense3b = getModel("qwen3.5-4b");
    expect(weightsGB(dense3b, q4, "gguf")).toBeLessThan(weightsGB(moe, q4, "gguf") / 5);
  });

  it("handles Apple unified memory: one shared pool with a GPU wired-memory limit", () => {
    const hw = getHardware("mbp-m4-pro-20c-24");
    expect(hw.memoryArchitecture).toBe("unified");
    const base = {
      hardware: hw,
      model: getModel("gpt-oss-20b"),
      quant: QUANTIZATIONS.mxfp4,
      format: "gguf" as const,
      runtime: getRuntime("llama.cpp"),
      tool: getTool("api-only"),
      os: "macos" as const,
      context: 32768,
      streams: 1,
      kvCacheType: "f16" as const,
      devEnvGB: 0,
      batchSize: 512,
      visionNeeded: false,
    };
    const def = estimateMemory({ ...base, raiseGpuMemoryLimit: false });
    expect(def.gpuLimitGB).toBeCloseTo(24 * 0.67, 5);
    // OS reserve and model share the same pool.
    expect(def.availableForInferenceGB).toBeCloseTo(24 - def.osReserveGB, 5);
    expect(def.vramGB).toBeUndefined();

    // A bigger model that fits in RAM but exceeds the default GPU limit → partial GPU residency until the limit is raised.
    const big = { ...base, model: getModel("qwen3-coder-30b-a3b"), quant: QUANTIZATIONS.q4, context: 4096 };
    const capped = estimateMemory({ ...big, raiseGpuMemoryLimit: false });
    const raised = estimateMemory({ ...big, raiseGpuMemoryLimit: true });
    expect(capped.offloadFraction).toBeLessThan(1);
    expect(raised.offloadFraction).toBe(1);
  });

  it("does not treat discrete VRAM and system RAM as identical", () => {
    const pc = getHardware("pc-rtx-4090-64");
    expect(pc.memoryArchitecture).toBe("discrete");
    const r = evaluate({ hardware: pc, modelId: "llama-3.3-70b", quant: "q4", workload: { useCase: "casual-chat", toolId: "open-webui", devEnv: "light" } });
    // 24 GB VRAM + 64 GB RAM "adds up" to 88 GB, yet the 40+ GB model cannot live in VRAM.
    expect(r.memory.fits).toBe(true);
    expect(r.memory.gpuOffloadFraction).toBeLessThan(0.6);
    expect(r.memory.notes.join(" ")).toMatch(/system RAM/);
    // The spilled part runs at system-RAM speed → painfully slow despite "fitting".
    expect(r.performance!.generationTpsShort).toBeLessThan(6);
    expect(rank(r)).toBeLessThanOrEqual(COMFORT_RANK.borderline);

    // The same model on a GPU with enough VRAM is fully resident.
    const pro = evaluate({ hardware: getHardware("pc-rtx-pro-6000-128"), modelId: "llama-3.3-70b", quant: "q4", workload: { useCase: "casual-chat", toolId: "open-webui" } });
    expect(pro.memory.gpuOffloadFraction).toBe(1);
    expect(pro.performance!.generationTpsShort).toBeGreaterThan(r.performance!.generationTpsShort * 4);
  });

  it("KV cache scales with context and streams, and shrinks for hybrid-attention models", () => {
    const dense = getModel("qwen3-32b");
    const hybrid = getModel("qwen3.6-27b");
    expect(kvCacheGB(dense, 65536, 1, "f16")).toBeCloseTo(kvCacheGB(dense, 32768, 1, "f16") * 2, 5);
    expect(kvCacheGB(dense, 32768, 2, "f16")).toBeCloseTo(kvCacheGB(dense, 32768, 1, "f16") * 2, 5);
    expect(kvCacheGB(hybrid, 32768, 1, "f16")).toBeLessThan(kvCacheGB(dense, 32768, 1, "f16") / 3);
    expect(kvCacheGB(dense, 32768, 1, "q8")).toBeLessThan(kvCacheGB(dense, 32768, 1, "f16") * 0.6);
  });
});

describe("compatibility", () => {
  it("rejects an unsupported tool / runtime combination", () => {
    const r = run({ runtimeId: "ollama", workload: { useCase: "casual-chat", toolId: "lm-studio-chat" } });
    expect(r.level).toBe("unsupported");
    expect(r.performance).toBeNull();
    expect(r.explanation.blockers[0]).toMatch(/cannot connect/);
  });

  it("rejects MLX on non-Apple hardware", () => {
    const r = evaluate({ hardware: getHardware("pc-rtx-4090-64"), modelId: "qwen3-8b", quant: "q4", runtimeId: "mlx-lm", workload: { useCase: "casual-chat", toolId: "api-only" } });
    expect(r.level).toBe("unsupported");
  });

  it("marks Anthropic-only tools on OpenAI-only runtimes as requiring a bridge", () => {
    const r = run({ runtimeId: "mlx-lm", workload: { toolId: "claude-code" } });
    expect(r.connection.level).toBe("bridge");
    expect(r.dimensions.find((d) => d.key === "tool")!.score).toBeLessThan(3);
  });

  it("switching runtimes changes hardware acceleration", () => {
    const arc = getHardware("pc-arc-b580-32");
    const wl = { useCase: "casual-chat", toolId: "api-only" } as const;
    const gpu = evaluate({ hardware: arc, os: "linux", modelId: "qwen3-8b", quant: "q4", runtimeId: "llama.cpp", workload: wl });
    const cpu = evaluate({ hardware: arc, os: "linux", modelId: "qwen3-8b", quant: "q4", runtimeId: "vllm", workload: wl });
    expect(gpu.performance!.backend).not.toBe("cpu");
    expect(cpu.performance!.backend).toBe("cpu");
    expect(gpu.performance!.generationTps).toBeGreaterThan(cpu.performance!.generationTps * 2);

    // On an M5 Mac, MLX uses the GPU Neural Accelerators for prefill; llama.cpp (Metal) does not here.
    const m5 = getHardware("mbp-m5-pro-20c-48");
    const mlx = evaluate({ hardware: m5, modelId: "qwen3-14b", quant: "q4", runtimeId: "mlx-lm", workload: wl });
    const lcpp = evaluate({ hardware: m5, modelId: "qwen3-14b", quant: "q4", runtimeId: "llama.cpp", workload: wl });
    expect(mlx.performance!.prefillTps).toBeGreaterThan(lcpp.performance!.prefillTps * 2);
  });

  it("excludes text-only models when vision is required", () => {
    const r = run({ modelId: "qwen3-coder-30b-a3b", workload: { useCase: "vision", toolId: "open-webui" } });
    expect(r.level).toBe("unsupported");
    const ok = run({ modelId: "gemma-4-12b", workload: { useCase: "vision", toolId: "open-webui" } });
    expect(ok.level).not.toBe("unsupported");
  });
});

describe("benchmarks and confidence", () => {
  const input: EvaluateInput = {
    hardware: getHardware("pc-rtx-4090-64"),
    modelId: "gpt-oss-20b",
    quant: "mxfp4",
    runtimeId: "llama.cpp",
    workload: { useCase: "casual-chat", toolId: "api-only" },
  };

  it("verified benchmark data increases confidence", () => {
    const withBench = evaluate(input);
    const without = evaluate({ ...input, benchmarks: [] });
    expect(withBench.performance!.basis).toBe("measured");
    expect(withBench.confidence.level).toBe("high");
    expect(COMFORT_RANK).toBeDefined();
    const order = { low: 0, medium: 1, high: 2 };
    expect(order[withBench.confidence.level]).toBeGreaterThan(order[without.confidence.level]);
    // Measured short-context decode reproduces the benchmark (225 tok/s) closely.
    expect(withBench.performance!.generationTpsShort).toBeGreaterThan(200);
    expect(withBench.performance!.generationTpsShort).toBeLessThan(240);
  });

  it("absence of benchmark data does not create fake measured numbers", () => {
    const without = evaluate({ ...input, benchmarks: [] });
    expect(without.performance!.basis).toBe("estimated");
    expect(without.performance!.benchmarkIds).toEqual([]);
    expect(without.performance!.basisExplanation).toMatch(/estimated/i);

    // A chip with no published benchmark is always "estimated".
    const m5 = evaluate({ ...input, hardware: getHardware("mbp-m5-max-40c-128"), runtimeId: undefined });
    expect(m5.performance!.basis).toBe("estimated");
    expect(BENCHMARKS.some((b) => b.chipKey === m5.hardware.chipKey)).toBe(false);
  });

  it("every benchmark is verified, sourced and references known data", () => {
    for (const b of BENCHMARKS) {
      expect(b.verified).toBe(true);
      expect(b.source.url).toMatch(/^https:\/\//);
      expect(() => getModel(b.modelId)).not.toThrow();
    }
    expect(new Set(BENCHMARKS.map((b) => b.id)).size).toBe(BENCHMARKS.length);
  });
});

describe("explanations", () => {
  it("never returns an unexplained recommendation", () => {
    const r = run({ workload: { desiredContextWindow: 65536, devEnv: "heavy" } });
    expect(r.verdict.length).toBeGreaterThan(10);
    expect(r.dimensions).toHaveLength(9);
    expect(r.explanation.positives.length + r.explanation.warnings.length).toBeGreaterThan(2);
    if (r.level !== "excellent") expect(r.explanation.whyNotHigher.length).toBeGreaterThan(0);
  });

  it("frames the headline around the workload", () => {
    const r = run();
    expect(r.headline).toMatch(/^(Excellent|Comfortable|Acceptable|Borderline|Technically Runs) for agentic coding$/);
  });
});
