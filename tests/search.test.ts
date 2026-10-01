import { describe, expect, it } from "vitest";
import { ALL_MODELS, HARDWARE, RUNTIMES, TOOLS, getHardware } from "@/data";
import { contextSweep, recommendHardware, recommendModels, stackFor, whatIf, evaluate } from "@/lib/recommendations";
import { COMFORT_RANK } from "@/lib/schemas/results";
import { decodeState, encodeState, resolveHardware } from "@/lib/share";
import { ladderScore, levelFromComposite } from "@/lib/recommendations/scoring";

describe("what should I run?", () => {
  const res = recommendModels({
    hardware: getHardware("mini-m4-pro-20c-64"),
    workload: { useCase: "agentic-coding", toolId: "opencode", repositorySize: "medium", desiredContextWindow: 32768 },
  });

  it("returns distinct, workload-aware picks instead of every model that fits", () => {
    const { recommended, fastest, quality } = res.picks;
    expect(recommended).toBeDefined();
    expect(COMFORT_RANK[recommended!.level]).toBeGreaterThanOrEqual(COMFORT_RANK.comfortable);
    if (fastest) expect(fastest.model.id).not.toBe(recommended!.model.id);
    if (quality) expect(quality.model.id).not.toBe(recommended!.model.id);
  });

  it("lists technically-possible models separately from recommended ones", () => {
    for (const r of res.picks.technicallyPossible) expect(["borderline", "technically-runs"]).toContain(r.level);
  });

  it("prefers the speed-oriented pick when priority is speed", () => {
    const speed = recommendModels({ hardware: getHardware("mini-m4-pro-20c-64"), workload: { useCase: "agentic-coding", toolId: "opencode", priority: "speed" } });
    const quality = recommendModels({ hardware: getHardware("mini-m4-pro-20c-64"), workload: { useCase: "agentic-coding", toolId: "opencode", priority: "quality" } });
    expect(speed.picks.recommended!.performance!.perStreamGenerationTps).toBeGreaterThanOrEqual(quality.picks.recommended!.performance!.perStreamGenerationTps * 0.99);
  });
});

describe("what hardware do I need?", () => {
  it("groups hardware by the experience target, not by whether it loads", () => {
    const res = recommendHardware({ modelId: "qwen3-coder-30b-a3b", workload: { useCase: "agentic-coding", toolId: "opencode", repositorySize: "medium" }, target: "comfortable" });
    expect(res.meetsTarget.length).toBeGreaterThan(0);
    for (const r of res.meetsTarget) expect(COMFORT_RANK[r.level]).toBeGreaterThanOrEqual(COMFORT_RANK.comfortable);
    for (const r of res.belowTarget) expect(r.memory.fits).toBe(true);
    for (const r of res.cannotRun) expect(["does-not-fit", "unsupported"]).toContain(r.level);
  });

  it("respects the budget filter", () => {
    const res = recommendHardware({ modelId: "gpt-oss-20b", workload: { useCase: "casual-chat", toolId: "open-webui" }, target: "comfortable", budgetUSD: 1500 });
    for (const r of [...res.meetsTarget, ...res.meetsAcceptable]) expect(r.hardware.approxPriceUSD ?? 0).toBeLessThanOrEqual(1500);
    expect(res.overBudget).toBeGreaterThan(0);
  });
});

describe("what-if and context sweep", () => {
  const input = { hardware: getHardware("mbp-m4-pro-20c-48"), modelId: "qwen3-coder-30b-a3b", quant: "q4" as const, workload: { useCase: "agentic-coding" as const, toolId: "opencode", desiredContextWindow: 65536 } };

  it("shows which single change moves the rating and why", () => {
    const s = whatIf(input);
    const ctx = s.find((x) => x.id === "ctx-down");
    expect(ctx).toBeDefined();
    expect(COMFORT_RANK[ctx!.to]).toBeGreaterThan(COMFORT_RANK[ctx!.from]);
    expect(ctx!.reason.length).toBeGreaterThan(5);
  });

  it("degrades monotonically with context in headroom", () => {
    const sweep = contextSweep(input);
    const fitting = sweep.filter((p) => p.fits);
    for (let i = 1; i < fitting.length; i++) expect(fitting[i].headroomGB).toBeLessThan(fitting[i - 1].headroomGB);
  });

  it("builds a five-layer stack", () => {
    const layers = stackFor(evaluate(input));
    expect(layers.map((l) => l.layer)).toEqual(["Hardware", "Runtime", "Model", "Local API", "AI tool"]);
  });
});

describe("shareable state", () => {
  it("round-trips through the URL and drops invalid values", () => {
    const state = { hardwareId: "mbp-m4-pro-20c-48", modelId: "gpt-oss-20b", quant: "mxfp4" as const, workload: { useCase: "agentic-coding" as const, toolId: "claude-code", desiredContextWindow: 32768, numberOfAgents: 2, raiseGpuMemoryLimit: true } };
    const decoded = decodeState(new URLSearchParams(encodeState(state)));
    expect(decoded.hardwareId).toBe(state.hardwareId);
    expect(decoded.workload).toMatchObject(state.workload);
    const bad = decodeState(new URLSearchParams("hw=nope&uc=hacking&ctx=-5&tool=evil&m=gpt-oss-20b"));
    expect(bad.hardwareId).toBeUndefined();
    expect(bad.workload.useCase).toBe("agentic-coding");
    expect(bad.workload.toolId).toBe("opencode");
    expect(bad.modelId).toBe("gpt-oss-20b");
  });

  it("supports custom hardware", () => {
    const custom = { architecture: "discrete" as const, gpuVendor: "nvidia" as const, vramGB: 16, ramGB: 64, bandwidthGBs: 900, os: "linux" as const };
    const decoded = decodeState(new URLSearchParams(encodeState({ hardwareId: "custom", custom, workload: { useCase: "casual-chat", toolId: "open-webui" } })));
    const hw = resolveHardware(decoded)!;
    expect(hw.gpu?.vramGB).toBe(16);
    expect(evaluate({ hardware: hw, modelId: "qwen3-8b", quant: "q4", workload: decoded.workload }).memory.fits).toBe(true);
  });
});

describe("data integrity and scoring primitives", () => {
  it("has unique ids and source metadata everywhere", () => {
    for (const list of [HARDWARE, ALL_MODELS, RUNTIMES, TOOLS] as { id: string; source: { url: string; lastVerified: string } }[][]) {
      expect(new Set(list.map((x) => x.id)).size).toBe(list.length);
      for (const x of list) {
        expect(x.source.url).toMatch(/^https:\/\//);
        expect(x.source.lastVerified).toMatch(/^\d{4}-\d{2}/);
      }
    }
  });

  it("never stores a recommendation status on model entries", () => {
    for (const m of ALL_MODELS) for (const k of ["level", "rating", "status", "comfort"]) expect(m).not.toHaveProperty(k);
  });

  it("ladder scores are monotonic", () => {
    const ladder: [number, number, number, number] = [40, 20, 10, 5];
    let prev = -1;
    for (const v of [1, 5, 8, 10, 15, 20, 30, 40, 80]) {
      const s = ladderScore(v, ladder);
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
    expect(levelFromComposite(3.5)).toBe("excellent");
    expect(levelFromComposite(0.5)).toBe("technically-runs");
  });
});
