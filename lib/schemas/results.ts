/**
 * Output types produced by the recommendation engine.
 * These are plain TypeScript types (engine output is trusted, not parsed).
 */
import type {
  AITool,
  Benchmark,
  ApiKind,
  ComputeApi,
  Confidence,
  HardwareConfiguration,
  Model,
  ModelFormat,
  Quantization,
  Runtime,
  SupportLevel,
  UseCaseId,
} from "./index";

export const COMFORT_LEVELS = [
  "excellent",
  "comfortable",
  "acceptable",
  "borderline",
  "technically-runs",
  "does-not-fit",
  "unsupported",
] as const;
export type ComfortLevel = (typeof COMFORT_LEVELS)[number];

/** Higher = better. Used for ordering and comparisons. */
export const COMFORT_RANK: Record<ComfortLevel, number> = {
  excellent: 6,
  comfortable: 5,
  acceptable: 4,
  borderline: 3,
  "technically-runs": 2,
  "does-not-fit": 1,
  unsupported: 0,
};

export const COMFORT_LABEL: Record<ComfortLevel, string> = {
  excellent: "Excellent",
  comfortable: "Comfortable",
  acceptable: "Acceptable",
  borderline: "Borderline",
  "technically-runs": "Technically Runs",
  "does-not-fit": "Does Not Fit",
  unsupported: "Unsupported",
};

export const COMFORT_DESCRIPTION: Record<ComfortLevel, string> = {
  excellent: "Substantial headroom for this workload. Expect a highly responsive experience.",
  comfortable: "A good practical setup for this workload: reasonable latency, memory headroom and context.",
  acceptable: "Usable, but you will notice compromises.",
  borderline: "Technically usable, but likely frustrating for this workload.",
  "technically-runs": "Loads and executes, but the experience is inappropriate for this workload.",
  "does-not-fit": "Not enough usable memory for this model at these settings.",
  unsupported: "This hardware / runtime / tool combination does not work.",
};

/** Qualitative per-dimension level (0 = worst, 4 = best). */
export type DimensionLevel = "excellent" | "good" | "fair" | "poor" | "inadequate";

export type DimensionKey =
  | "memory"
  | "generation"
  | "prefill"
  | "context"
  | "runtime"
  | "tool"
  | "suitability"
  | "concurrency"
  | "stability";

export interface DimensionResult {
  key: DimensionKey;
  label: string;
  /** Internal 0–4 score. Never shown as a number. */
  score: number;
  level: DimensionLevel;
  /** Importance of this dimension for the selected workload (0–3). */
  weight: number;
  importance: "low" | "medium" | "high" | "very-high" | "critical";
  /** Short human summary for the gauge. */
  summary: string;
  detail: string;
}

export interface MemoryBreakdown {
  architecture: HardwareConfiguration["memoryArchitecture"];
  installedGB: number;
  /** VRAM for discrete GPUs. */
  vramGB?: number;
  osReserveGB: number;
  devEnvReserveGB: number;
  toolOverheadGB: number;
  runtimeOverheadGB: number;
  weightsGB: number;
  kvCacheGB: number;
  visionEncoderGB: number;
  /** Total memory the inference process needs. */
  inferencePeakGB: number;
  /** Total memory in use including OS, dev env, tool. */
  estimatedPeakGB: number;
  /** Memory available to inference after reservations (and GPU limits). */
  availableForInferenceGB: number;
  headroomGB: number;
  headroomFraction: number;
  /** Discrete GPUs: fraction of weights resident in VRAM. */
  gpuOffloadFraction: number;
  /** GPU memory cap that applied (unified: wired limit; discrete: VRAM). */
  gpuLimitGB?: number;
  fits: boolean;
  notes: string[];
  /** Discrete GPUs: free VRAM after the model. */
  vramHeadroomGB?: number;
  gpuResidentGB?: number;
  cpuResidentGB?: number;
}

export type PerformanceBasis = "anchored" | "calibrated" | "estimated";

export interface PerformanceEstimate {
  basis: PerformanceBasis;
  basisExplanation: string;
  benchmarkSources: { id: string; title: string; url: string; date: string; quantLabel: string;
    runtimeId: string; contextTokens: number; promptTokens: number; outputTokens: number; generationTps: number; prefillTps?: number;
    referenceSettings?: Benchmark["referenceSettings"]; assumptions: string[]; sourceNote?: string }[];
  uncertainty: { kind: "heuristic"; relativeSpread: number; empiricallyValidated: false };
  /** Decode speed with an empty-ish context. */
  generationTpsShort: number;
  /** Decode speed at the workload's typical context fill. */
  generationTps: number;
  /** Decode speed with the context window full. */
  generationTpsFullContext: number;
  /** Per-stream speed when the workload's concurrency is applied. */
  perStreamGenerationTps: number;
  aggregateGenerationTps: number;
  prefillTps: number;
  /** Seconds to ingest the full cold prompt (first request of a session). */
  coldPromptSec: number;
  /** Seconds to first token for a typical follow-up request. */
  timeToFirstTokenSec: number;
  /** Seconds per agent/tool step (prefill delta + output). */
  stepLatencySec: number;
  /** Minutes for a typical task (calls × step latency). */
  taskMinutes: number;
  loadTimeSec: number;
  backend: ComputeApi;
  /** Benchmark ids used. */
  benchmarkIds: string[];
}

export interface ContextPoint {
  basis?: PerformanceBasis;
  context: number;
  fits: boolean;
  supported: boolean;
  level: ComfortLevel;
  generationTps: number;
  coldPromptSec: number;
  headroomGB: number;
}

export interface ToolConnection {
  level: SupportLevel;
  api?: ApiKind;
  path: string;
  note?: string;
}

export interface RecommendationExplanation {
  positives: string[];
  warnings: string[];
  blockers: string[];
  /** Why the rating isn't one level higher. */
  whyNotHigher: string[];
  bottlenecks: string[];
  betterFor: string[];
  lessSuitableFor: string[];
}

export interface Recommendation {
  id: string;
  level: ComfortLevel;
  headline: string;
  verdict: string;
  /** The four capability tiers that underpin the product. */
  tiers: { canLoad: boolean; canRun: boolean; canRunUsably: boolean; canRunComfortably: boolean };
  hardware: HardwareConfiguration;
  model: Model;
  quant: Quantization;
  format: ModelFormat;
  runtime: Runtime;
  tool: AITool;
  useCase: UseCaseId;
  connection: ToolConnection;
  memory: MemoryBreakdown;
  performance: PerformanceEstimate | null;
  dimensions: DimensionResult[];
  explanation: RecommendationExplanation;
  confidence: { level: Confidence; reasons: string[] };
  context: { requested: number; effective: number; maxPractical: number; recommended: number };
  /** Internal ranking value used to sort; not displayed. */
  rankValue: number;
  /** Internal 0–4 composite. Not displayed. */
  composite: number;
}

export interface WhatIfSuggestion {
  id: string;
  label: string;
  change: string;
  from: ComfortLevel;
  to: ComfortLevel;
  reason: string;
  patch: Record<string, unknown>;
}
