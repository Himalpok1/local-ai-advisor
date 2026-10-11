import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HARDWARE, BENCHMARKS, getHardware } from "@/data";
import { EXPANDED_HARDWARE } from "@/data/hardware-expansion";
import { catalogAudit } from "@/lib/catalog-audit";
import { evaluate, contextSweep } from "@/lib/recommendations";
import { ContextChart, HardwareComparisonChart } from "@/components/advisor/performance-charts";
import type { ContextPoint } from "@/lib/schemas/results";

describe("catalog evidence and coverage", () => {
  it("adds valid reference configurations without invented prices or benchmarks", () => {
    for (const h of EXPANDED_HARDWARE) {
      const entry = getHardware(h.id);
      expect(entry.evidence?.some((e) => e.kind === "vendor-spec" && e.fields.includes("gpu.vramGB"))).toBe(true);
      expect(entry.evidence?.some((e) => e.kind === "assumption" && e.fields.includes("cpu"))).toBe(true);
      expect(entry.approxPriceUSD).toBeUndefined();
      expect(entry.source.lastVerified).toBe("2026-10-10");
      expect(BENCHMARKS.some((b) => b.chipKey === entry.chipKey)).toBe(false);
      const rec = evaluate({ hardware: entry, modelId: "qwen3-8b", quant: "q4", runtimeId: "llama.cpp", workload: { useCase: "casual-chat", toolId: "api-only" } });
      expect(rec.performance?.basis).toBe("estimated");
      expect(rec.memory.gpuLimitGB).toBeLessThanOrEqual(entry.gpu!.vramGB!);
      expect(Number.isFinite(rec.performance!.generationTps)).toBe(true);
    }
  });
  it("does not silently give unreviewed AMD devices a ROCm path", () => {
    for (const h of EXPANDED_HARDWARE.filter((h) => h.vendor === "amd")) {
      expect(h.gpu!.apis).toEqual(["vulkan"]);
      expect(h.gpu!.rocmSupport).toBeUndefined();
    }
  });
  it("makes repeatable review queues and preserves laptop/memory variant distinctions", () => {
    const devices = [
      { id: "a6000", name: "RTX A6000", family: "nvidia", laptop: false },
      { id: "a6000-laptop", name: "RTX A6000", family: "nvidia", laptop: true },
      { id: "a6000-24", name: "RTX A6000 24GB", family: "nvidia", laptop: false },
    ];
    const report = catalogAudit(HARDWARE, BENCHMARKS, devices, "2026-10-10");
    expect(report).toEqual(catalogAudit(HARDWARE, BENCHMARKS, devices, "2026-10-10"));
    expect(report.discoveries[0].possibleMatches).toHaveLength(2);
    expect(report.discoveries[1].possibleMatches).toEqual([]);
    expect(report.discoveries[2].possibleMatches).toEqual([]);
    expect(report.issues.some((i) => i.issue.includes("price"))).toBe(true);
  });
});

describe("honest chart rendering", () => {
  it("breaks a context line at a non-fitting point instead of interpolating", () => {
    const points: ContextPoint[] = [
      { context: 4096, supported: true, fits: true, level: "comfortable", generationTps: 30, coldPromptSec: 2, headroomGB: 6, basis: "estimated" },
      { context: 8192, supported: true, fits: false, level: "does-not-fit", generationTps: 999, coldPromptSec: 1, headroomGB: -2 },
      { context: 16384, supported: true, fits: true, level: "acceptable", generationTps: 20, coldPromptSec: 5, headroomGB: 2, basis: "calibrated" },
    ];
    const html = renderToStaticMarkup(createElement(ContextChart, { points, current: 4096 }));
    expect(html).toContain("does not fit or runtime unsupported");
    expect(html).not.toContain("999");
    expect(html.match(/stroke-width="3"/g)).toBeNull();
    expect(html).toContain("not validated confidence intervals");
  });
  it("carries the exact sweep basis and shows unavailable comparisons", () => {
    const input = { hardware: getHardware("pc-rtx-a5000-32"), modelId: "qwen3-8b", quant: "q4" as const, workload: { useCase: "casual-chat" as const, toolId: "api-only" } };
    for (const p of contextSweep(input)) {
      const rec = evaluate({ ...input, workload: { ...input.workload, desiredContextWindow: p.context } });
      expect(p.generationTps).toBe(rec.performance?.generationTpsFullContext ?? 0);
      expect(p.basis).toBe(rec.performance?.basis);
    }
    const large = evaluate({ ...input, modelId: "llama-3.3-70b", quant: "fp16" });
    const html = renderToStaticMarkup(createElement(HardwareComparisonChart, { recommendations: [evaluate(input), large] }));
    expect(html).toContain("estimated prediction");
    expect(html).toContain("Unavailable");
    expect(html).toContain("not measured speeds");
  });
});
