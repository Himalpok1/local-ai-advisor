import { describe, expect, it } from "vitest";
import { BENCHMARKS, getHardware } from "@/data";
import { evaluate } from "@/lib/recommendations";
import { MIN_REPORTS, aggregateReports, assessReport, communityBenchmarks, type ReportRow, type SpeedReportInput } from "@/lib/community/reports";
import { normalizeQuery, rigQuery } from "@/lib/me/shared";
import { DEFAULT_WORKLOAD, decodeState } from "@/lib/share";

const HW = "mbp-m4-pro-20c-48";
const base: SpeedReportInput = {
  hardwareId: HW,
  modelId: "qwen3.5-9b",
  quant: "q4",
  runtimeId: "llama.cpp",
  os: "macos",
  contextTokens: 0,
  promptTokens: 512,
  outputTokens: 128,
  generationTps: 30,
};

const row = (userId: string, generationTps: number, extra: Partial<ReportRow> = {}): ReportRow => ({
  userId,
  hardwareId: HW,
  chipKey: getHardware(HW).chipKey,
  modelId: "qwen3.5-9b",
  quant: "q4",
  runtimeId: "llama.cpp",
  backend: "metal",
  contextTokens: 0,
  promptTokens: 512,
  outputTokens: 128,
  generationTps,
  prefillTps: 400,
  createdAt: new Date("2026-09-01"),
  ...extra,
});

describe("speed report checks", () => {
  it("accepts a plausible report and finds the backend", () => {
    const a = assessReport(base);
    expect(a.ok).toBe(true);
    expect(a.backend).toBe("metal");
    expect(a.flags).toEqual([]);
  });

  it("holds numbers above the bandwidth ceiling for review", () => {
    const a = assessReport({ ...base, generationTps: 5000 });
    expect(a.ok).toBe(true);
    expect(a.flags.join(" ")).toMatch(/ceiling/);
  });

  it("flags swapped prompt and generation speeds", () => {
    expect(assessReport({ ...base, generationTps: 30, prefillTps: 5 }).flags.join(" ")).toMatch(/swapped/);
  });

  it("rejects runtimes that can't run on the hardware", () => {
    const a = assessReport({ ...base, hardwareId: "pc-rtx-4090-64", os: "windows", runtimeId: "mlx-lm" });
    expect(a.ok).toBe(false);
  });
});

describe("community aggregation", () => {
  it("counts each user once, keeping their latest report", () => {
    const [s] = aggregateReports([row("a", 10, { createdAt: new Date("2026-01-01") }), row("a", 40), row("b", 30)]);
    expect(s.count).toBe(2);
    expect(s.medianGenerationTps).toBe(35);
  });

  it("groups llama.cpp wrappers into one engine family", () => {
    expect(aggregateReports([row("a", 30), row("b", 32, { runtimeId: "ollama" })])).toHaveLength(1);
  });

  it(`only calibrates with ${MIN_REPORTS}+ independent reports`, () => {
    const two = aggregateReports([row("a", 30), row("b", 31)]);
    expect(communityBenchmarks(two)).toHaveLength(0);
    const three = aggregateReports([row("a", 30), row("b", 31), row("c", 1000)]);
    const [bench] = communityBenchmarks(three);
    // The median ignores the outlier.
    expect(bench.generationTps).toBe(31);
    expect(bench.verified).toBe(true);
  });

  it("anchors the engine to the community median for that exact setup", () => {
    const stats = aggregateReports([row("a", 20), row("b", 21), row("c", 22)]);
    const input = { hardware: getHardware(HW), modelId: "qwen3.5-9b", quant: "q4" as const, runtimeId: "llama.cpp", workload: DEFAULT_WORKLOAD };
    const rec = evaluate({ ...input, benchmarks: [...BENCHMARKS, ...communityBenchmarks(stats)] });
    expect(rec.performance?.basis).toBe("measured");
    expect(rec.performance?.generationTpsShort).toBeGreaterThan(15);
    expect(rec.performance?.generationTpsShort).toBeLessThan(25);
  });
});

describe("rigs and saved items", () => {
  it("keeps only hardware, OS and workload in a rig", () => {
    const q = rigQuery(decodeState(new URLSearchParams(`hw=${HW}&m=qwen3.5-9b&q=q4&uc=casual-chat&tool=open-webui`)))!;
    const params = new URLSearchParams(q);
    expect(params.get("hw")).toBe(HW);
    expect(params.get("uc")).toBe("casual-chat");
    expect(params.has("m")).toBe(false);
  });

  it("rejects unknown hardware", () => {
    expect(rigQuery(decodeState(new URLSearchParams("hw=not-a-machine")))).toBeUndefined();
  });

  it("normalizes bookmarked query strings", () => {
    expect(normalizeQuery("?hw=a&m=b")).toBe("hw=a&m=b");
    expect(normalizeQuery("a=<script>")).toBe("a=%3Cscript%3E");
  });
});
