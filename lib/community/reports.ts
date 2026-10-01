/**
 * Community speed reports: validation, plausibility checks and aggregation.
 * Pure functions shared by the server (submission, stats API) and tests.
 *
 * A single report never overrides the engine. Reports are grouped by
 * chip + model + quant + engine family + backend, each user counts once per
 * group (their latest report), and a group only becomes a calibration
 * benchmark once MIN_REPORTS people agree.
 */
import { z } from "zod";
import { HARDWARE_MAP, MODEL_MAP, QUANTIZATIONS, RUNTIME_MAP } from "@/data";
import type { Benchmark, ComputeApi, HardwareConfiguration, Model, OS, QuantId, Runtime } from "@/lib/schemas";
import { OSSchema, QuantIdSchema } from "@/lib/schemas";
import { defaultOs, quantAvailable, selectBackend, selectFormat } from "@/lib/compatibility";
import { activeWeightsGB } from "@/lib/memory";
import { engineFamily, rawDecodeTps, rawPrefillTps } from "@/lib/performance";

/** Distinct users needed before a group calibrates the engine. */
export const MIN_REPORTS = 3;

export const SpeedReportInputSchema = z.object({
  hardwareId: z.string().refine((id) => HARDWARE_MAP.has(id), "Pick a computer from the catalog"),
  modelId: z.string().refine((id) => MODEL_MAP.has(id) && !id.startsWith("hf:"), "Pick a model from the catalog"),
  quant: QuantIdSchema,
  runtimeId: z.string().refine((id) => RUNTIME_MAP.has(id), "Pick a runtime"),
  os: OSSchema,
  contextTokens: z.coerce.number().int().min(0).max(1_048_576),
  promptTokens: z.coerce.number().int().min(1).max(1_048_576),
  outputTokens: z.coerce.number().int().min(1).max(100_000),
  generationTps: z.coerce.number().min(0.1).max(10_000),
  prefillTps: z.coerce.number().min(0.1).max(1_000_000).optional(),
  notes: z.string().trim().max(500).optional(),
});
export type SpeedReportInput = z.infer<typeof SpeedReportInputSchema>;

export interface Assessment {
  ok: boolean;
  /** Why the combination itself is impossible (rejected outright). */
  error?: string;
  backend?: ComputeApi;
  /** Engine estimate at the reported depth, before any calibration. */
  estimateTps?: number;
  /** Hard bandwidth ceiling: every token reads the active weights at least once. */
  ceilingTps?: number;
  /** Reasons to hold the report for review instead of publishing it. */
  flags: string[];
}

/**
 * Check a report against physics and the engine. Impossible combinations are
 * rejected; numbers far outside the plausible range are held for review.
 */
export function assessReport(r: SpeedReportInput): Assessment {
  const hw = HARDWARE_MAP.get(r.hardwareId)!;
  const model = MODEL_MAP.get(r.modelId)!;
  const runtime = RUNTIME_MAP.get(r.runtimeId)!;
  const quant = QUANTIZATIONS[r.quant];
  const os: OS = hw.os.includes(r.os) ? r.os : defaultOs(hw);

  if (!model.supportedQuantizations.includes(r.quant)) return { ok: false, error: `${model.name} isn't available in ${quant.label}.`, flags: [] };
  const sel = selectBackend(hw, runtime, os);
  if (!sel.ok) return { ok: false, error: sel.reason, flags: [] };
  const format = selectFormat(runtime, sel.backend, model);
  if (!format || !quantAvailable(quant, format, model)) return { ok: false, error: `${runtime.name} can't load ${model.name} in ${quant.label}.`, flags: [] };

  const ctx = { hardware: hw, model, quant, format, runtime, backend: sel.backend, kvCacheType: "f16" as const, offloadFraction: 1, batteryPenalty: 1 };
  const depth = r.contextTokens + r.outputTokens / 2;
  const estimateTps = rawDecodeTps(ctx, depth);
  const ceilingTps = bandwidthCeiling(hw, model, r.quant, format);
  const flags: string[] = [];
  if (r.generationTps > ceilingTps * 1.25)
    flags.push(`Generation ${r.generationTps} tok/s is above the ${Math.round(ceilingTps)} tok/s memory-bandwidth ceiling for this machine.`);
  if (r.generationTps < estimateTps * 0.12)
    flags.push(`Generation is under 12% of the engine estimate (${Math.round(estimateTps)} tok/s); the model may have run partly on the CPU.`);
  if (r.prefillTps) {
    const prefillEstimate = rawPrefillTps(ctx);
    if (r.prefillTps > prefillEstimate * 4) flags.push(`Prompt processing is over 4× the engine estimate (${Math.round(prefillEstimate)} tok/s).`);
    if (r.prefillTps < r.generationTps * 0.5) flags.push("Prompt processing is slower than generation, which usually means the two numbers were swapped.");
  }
  return { ok: true, backend: sel.backend.api, estimateTps, ceilingTps, flags };
}

function bandwidthCeiling(hw: HardwareConfiguration, model: Model, quant: QuantId, format: Parameters<typeof activeWeightsGB>[2]): number {
  const gbps = hw.gpu?.bandwidthGBs ?? hw.systemRamBandwidthGBs;
  return (gbps * 1e9) / (activeWeightsGB(model, QUANTIZATIONS[quant], format) * 1024 ** 3);
}

/* ------------------------------------------------------------------ */
/* Aggregation                                                         */
/* ------------------------------------------------------------------ */

export interface ReportRow {
  userId: string;
  hardwareId: string;
  chipKey: string;
  modelId: string;
  quant: string;
  runtimeId: string;
  backend: string;
  contextTokens: number;
  promptTokens: number;
  outputTokens: number;
  generationTps: number;
  prefillTps: number | null;
  createdAt: Date;
}

export interface CommunityStat {
  key: string;
  chipKey: string;
  hardwareIds: string[];
  modelId: string;
  quant: QuantId;
  /** Most reported runtime in the group. */
  runtimeId: string;
  engine: string;
  backend: ComputeApi;
  /** Distinct users. */
  count: number;
  medianGenerationTps: number;
  minGenerationTps: number;
  maxGenerationTps: number;
  medianPrefillTps?: number;
  contextTokens: number;
  promptTokens: number;
  outputTokens: number;
  latest: string;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const mostCommon = (xs: string[]) => {
  const counts = new Map<string, number>();
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
};

/** Group approved reports, keeping each user's latest report per group. */
export function aggregateReports(rows: ReportRow[]): CommunityStat[] {
  const groups = new Map<string, Map<string, ReportRow>>();
  for (const r of rows) {
    const key = [r.chipKey, r.modelId, r.quant, engineFamily(r.runtimeId), r.backend].join("|");
    const byUser = groups.get(key) ?? new Map<string, ReportRow>();
    const prev = byUser.get(r.userId);
    if (!prev || r.createdAt > prev.createdAt) byUser.set(r.userId, r);
    groups.set(key, byUser);
  }
  const stats: CommunityStat[] = [];
  for (const [key, byUser] of groups) {
    const rs = [...byUser.values()];
    const gens = rs.map((r) => r.generationTps);
    const prefills = rs.map((r) => r.prefillTps).filter((x): x is number => x != null);
    const first = rs[0];
    stats.push({
      key,
      chipKey: first.chipKey,
      hardwareIds: [...new Set(rs.map((r) => r.hardwareId))],
      modelId: first.modelId,
      quant: first.quant as QuantId,
      runtimeId: mostCommon(rs.map((r) => r.runtimeId)),
      engine: engineFamily(first.runtimeId),
      backend: first.backend as ComputeApi,
      count: rs.length,
      medianGenerationTps: median(gens),
      minGenerationTps: Math.min(...gens),
      maxGenerationTps: Math.max(...gens),
      medianPrefillTps: prefills.length ? median(prefills) : undefined,
      contextTokens: Math.round(median(rs.map((r) => r.contextTokens))),
      promptTokens: Math.round(median(rs.map((r) => r.promptTokens))),
      outputTokens: Math.round(median(rs.map((r) => r.outputTokens))),
      latest: new Date(Math.max(...rs.map((r) => r.createdAt.getTime()))).toISOString(),
    });
  }
  return stats.sort((a, b) => b.count - a.count || b.latest.localeCompare(a.latest));
}

/** Groups with enough independent reports become benchmarks the engine calibrates against. */
export function communityBenchmarks(stats: CommunityStat[]): Benchmark[] {
  return stats
    .filter((s) => s.count >= MIN_REPORTS && MODEL_MAP.has(s.modelId) && s.hardwareIds.some((id) => HARDWARE_MAP.has(id)))
    .map((s) => ({
      id: `community:${s.key}`,
      hardwareId: s.hardwareIds.find((id) => HARDWARE_MAP.has(id))!,
      chipKey: s.chipKey,
      modelId: s.modelId,
      quant: s.quant,
      quantLabel: QUANTIZATIONS[s.quant]?.label ?? s.quant,
      runtimeId: s.runtimeId,
      backend: s.backend,
      contextTokens: s.contextTokens,
      promptTokens: Math.max(1, s.promptTokens),
      outputTokens: Math.max(1, s.outputTokens),
      generationTps: s.medianGenerationTps,
      prefillTps: s.medianPrefillTps,
      source: {
        url: "https://iownchatgpt.com/community",
        title: `median of ${s.count} community reports`,
        lastVerified: s.latest.slice(0, 10),
        confidence: "medium" as const,
      },
      date: s.latest.slice(0, 10),
      verified: true,
    }));
}

/** Runtimes that can run on this hardware + OS, for the report form. */
export function runtimesFor(hw: HardwareConfiguration, os: OS, all: Runtime[]): Runtime[] {
  return all.filter((r) => selectBackend(hw, r, os).ok);
}
