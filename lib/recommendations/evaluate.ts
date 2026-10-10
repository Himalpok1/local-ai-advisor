/**
 * Recommendation engine pipeline (UI-independent):
 *  1. Validate hardware support          9. Determine memory headroom
 *  2. Validate runtime support          10. Estimate prompt processing
 *  3. Validate tool → API → runtime     11. Estimate generation
 *  4. Estimate usable RAM/VRAM          12. Apply workload requirements
 *  5. Reserve OS / dev-env memory       13. Apply concurrency
 *  6. Weights                           14. Model suitability
 *  7. Runtime overhead                  15. Confidence
 *  8. KV / context memory               16. Comfort classification
 *                                       17. Human-readable explanation
 */
import { BENCHMARKS, MODEL_MAP, QUANTIZATIONS, RUNTIMES, getModel, getRuntime, getTool } from "@/data";
import type {
  AITool,
  Benchmark,
  HardwareConfiguration,
  Model,
  OS,
  QuantId,
  Runtime,
  ToolCallingLevel,
  WorkloadProfileInput,
} from "@/lib/schemas";
import {
  COMFORT_LABEL,
  COMFORT_RANK,
  type ComfortLevel,
  type DimensionKey,
  type DimensionResult,
  type MemoryBreakdown,
  type PerformanceEstimate,
  type Recommendation,
  type RecommendationExplanation,
  type ToolConnection,
} from "@/lib/schemas/results";
import {
  BACKEND_LABEL,
  SUPPORT_LABEL,
  SUPPORT_RANK,
  defaultOs,
  osLabel,
  quantAvailable,
  selectBackend,
  selectFormat,
  toolConnection,
} from "@/lib/compatibility";
import { estimateMemory, type MemoryResult } from "@/lib/memory";
import { estimatePerformance, matchBenchmarks, rawDecodeTps, type PerfContext } from "@/lib/performance";
import { resolveWorkload, CONTEXT_STEPS, type ResolvedWorkload } from "@/lib/workloads/resolve";
import { importanceLabel, type CapabilityKey, type UseCaseProfile } from "@/lib/workloads/profiles";
import { fmtCtx, fmtGB, fmtSec, fmtTokens, fmtTps } from "@/lib/format";
import { clamp, dimensionLevel, ladderScore, levelFromComposite, nextLevelThreshold } from "./scoring";

export interface EvaluateInput {
  hardware: HardwareConfiguration;
  modelId: string;
  quant: QuantId;
  /** Undefined → choose the best runtime for this hardware + tool. */
  runtimeId?: string;
  os?: OS;
  workload: WorkloadProfileInput;
  /** Inject benchmark data (tests). Defaults to the verified dataset. */
  benchmarks?: Benchmark[];
}

const TOOL_CALL_RANK: Record<ToolCallingLevel, number> = { none: 0, basic: 1, good: 2, reliable: 3 };
const MATURITY_SCORE = { mature: 4, good: 3.2, experimental: 1.8 } as const;

const DIM_LABEL: Record<DimensionKey, string> = {
  memory: "Memory",
  generation: "Generation",
  prefill: "Prompt processing",
  context: "Context",
  runtime: "Runtime",
  tool: "Tool compatibility",
  suitability: "Workload suitability",
  concurrency: "Concurrency",
  stability: "Sustained use",
};

/* ------------------------------------------------------------------ */
/* Runtime selection                                                   */
/* ------------------------------------------------------------------ */

export interface RuntimeCandidate {
  runtime: Runtime;
  score: number;
  connection: ToolConnection;
  gpuAccelerated: boolean;
}

export function rankRuntimes(hw: HardwareConfiguration, os: OS, model: Model, quant: QuantId, tool: AITool, profile?: UseCaseProfile): RuntimeCandidate[] {
  const out: RuntimeCandidate[] = [];
  for (const runtime of RUNTIMES) {
    const sel = selectBackend(hw, runtime, os);
    if (!sel.ok) continue;
    const format = selectFormat(runtime, sel.backend, model);
    if (!format || !quantAvailable(QUANTIZATIONS[quant], format, model)) continue;
    const connection = toolConnection(tool, runtime);
    if (connection.level === "unsupported") continue;
    let score = SUPPORT_RANK[connection.level] * 3;
    score += { mature: 3, good: 2, experimental: 0 }[sel.backend.maturity] * 2;
    score += sel.backend.decodeEfficiency * 10;
    score += sel.gpuAccelerated ? 10 : 0;
    if (sel.backend.usesAccelerators && hw.gpu?.acceleratedFp16Tflops) score += 3;
    if (runtime.audience === "beginner") score += 1.5;
    if (runtime.audience === "advanced") score -= 0.5;
    if (profile && (profile.id === "api-server" || profile.id === "multi-agent")) score += (1 - runtime.concurrencyPenalty) * 8;
    out.push({ runtime, score, connection, gpuAccelerated: sel.gpuAccelerated });
  }
  return out.sort((a, b) => b.score - a.score);
}

/* ------------------------------------------------------------------ */
/* Main evaluation                                                     */
/* ------------------------------------------------------------------ */

export function evaluate(input: EvaluateInput): Recommendation {
  const hw = input.hardware;
  const model = getModel(input.modelId);
  const quant = QUANTIZATIONS[input.quant];
  const tool = getTool(input.workload.toolId);
  const os = input.os && hw.os.includes(input.os) ? input.os : defaultOs(hw);
  let w = resolveWorkload(input.workload, tool);
  const profile = w.profile;
  const visionNeeded = profile.needs.vision === true || w.input.multimodalRequired;

  // 2. Runtime
  let runtime: Runtime;
  if (input.runtimeId) {
    runtime = getRuntime(input.runtimeId);
  } else {
    const ranked = rankRuntimes(hw, os, model, input.quant, tool, profile);
    runtime = ranked[0]?.runtime ?? getRuntime("llama.cpp");
  }

  const base = { hw, model, quant, tool, runtime, w, os };

  // 1–2. Hardware ↔ runtime
  const sel = selectBackend(hw, runtime, os);
  if (!sel.ok) return blocked(base, "unsupported", sel.reason);

  const format = selectFormat(runtime, sel.backend, model);
  if (!format) return blocked(base, "unsupported", `${model.name} is not published in a format ${runtime.name} can load (${runtime.formats.join(", ").toUpperCase()}).`);
  if (!quantAvailable(quant, format, model)) {
    return blocked(base, "unsupported", `${quant.label} is not available for ${model.name} in ${format.toUpperCase()} format (${runtime.name}).`);
  }

  // 3. Tool → API → runtime
  const connection = toolConnection(tool, runtime);
  if (connection.level === "unsupported") {
    return blocked(base, "unsupported", `${tool.name} cannot connect to ${runtime.name}: no shared API (${tool.name} speaks ${[...new Set(tool.connections.map((c) => c.api))].join("/")}, ${runtime.name} exposes ${runtime.apis.join("/")}).`, connection);
  }

  // Model ↔ use case hard requirement
  if (visionNeeded && !model.vision) {
    return blocked(base, "unsupported", `${model.name} is text-only and cannot understand images.`, connection);
  }

  // Context window is capped by the model.
  const requestedContext = w.contextWindow;
  const notes: string[] = [];
  if (requestedContext > model.contextWindow) {
    notes.push(`${model.name} supports at most ${fmtCtx(model.contextWindow)} context; ${fmtCtx(requestedContext)} was requested.`);
    w = shrinkContext(w, model.contextWindow);
  }
  // Thinking models emit long reasoning before answering.
  if (model.thinking && profile.id !== "reasoning") {
    w = { ...w, outputTokens: Math.round(w.outputTokens * 1.4) };
  }

  // 4–9. Memory
  const memInput = {
    hardware: hw,
    model,
    quant,
    format,
    runtime,
    tool,
    os,
    streams: w.streams,
    kvCacheType: w.input.kvCacheType,
    devEnvGB: w.devEnvGB,
    osReserveGB: w.input.osReserveGB,
    raiseGpuMemoryLimit: w.input.raiseGpuMemoryLimit,
    gpuOffload: w.input.gpuOffload,
    batchSize: w.input.batchSize,
    visionNeeded,
  };
  const memory = estimateMemory({ ...memInput, context: w.contextWindow });
  if (!memory.fits) {
    const rec = blocked(
      base,
      "does-not-fit",
      memory.architecture === "discrete"
        ? `Needs ≈${fmtGB(memory.inferencePeakGB)} but only ≈${fmtGB(memory.availableForInferenceGB)} of VRAM + system RAM is available after the OS and other apps.`
        : `Needs ≈${fmtGB(memory.inferencePeakGB)} but only ≈${fmtGB(memory.availableForInferenceGB)} is available after the OS, other apps and ${tool.name}.`,
      connection,
      memory,
    );
    rec.format = format;
    rec.tiers = { canLoad: false, canRun: false, canRunUsably: false, canRunComfortably: false };
    return rec;
  }

  // 10–11. Performance
  const batteryPenalty = w.input.batterySensitive && (hw.formFactor === "laptop" || hw.formFactor === "fanless-laptop") ? (hw.vendor === "apple" ? 0.92 : 0.6) : 1;
  const perfCtx: PerfContext = {
    hardware: hw,
    model,
    quant,
    format,
    runtime,
    backend: sel.backend,
    kvCacheType: runtime.supportsKvQuant ? w.input.kvCacheType : "f16",
    offloadFraction: memory.offloadFraction,
    batteryPenalty,
  };
  const modelMap = MODEL_MAP;
  const match = matchBenchmarks(perfCtx, input.benchmarks ?? BENCHMARKS, modelMap, QUANTIZATIONS);
  const perf = estimatePerformance(perfCtx, w, match);

  // 12–14. Dimensions
  const t = profile.thresholds;
  const dims: DimensionResult[] = [];
  const add = (key: DimensionKey, score: number, summary: string, detail: string) => {
    const weight = profile.weights[key];
    dims.push({ key, label: DIM_LABEL[key], score: clamp(score), level: dimensionLevel(clamp(score)), weight, importance: importanceLabel(weight), summary, detail });
  };

  // Memory / headroom
  {
    let s = ladderScore(memory.headroomFraction, t.headroomFraction);
    if (memory.headroomGB < 1) s = Math.min(s, 0.6);
    if (memory.architecture === "unified" && memory.offloadFraction < 0.999) s -= 1;
    const others = profile.isCoding ? "the OS, IDE, browser, terminal and your coding agent" : "the OS and your other applications";
    const detail =
      memory.architecture === "discrete"
        ? `Uses ≈${fmtGB(memory.gpuResidentGB)} of ${memory.vramGB} GB VRAM${memory.cpuResidentGB > 0.1 ? ` and ≈${fmtGB(memory.cpuResidentGB)} of system RAM` : ""}. ≈${fmtGB(Math.max(0, memory.vramHeadroomGB ?? 0))} VRAM and ≈${fmtGB(Math.max(0, memory.ramHeadroomGB))} RAM remain free.`
        : `Estimated peak ≈${fmtGB(memory.estimatedPeakGB)} of ${memory.installedGB} GB; ≈${fmtGB(Math.max(0, memory.headroomGB))} remains for ${others} to grow into.`;
    add("memory", s, headroomSummary(memory), detail);
  }

  // Generation
  add(
    "generation",
    ladderScore(perf.perStreamGenerationTps, t.genTps),
    fmtTps(perf.perStreamGenerationTps, perf.basis),
    `Expected ${fmtTps(perf.perStreamGenerationTps, perf.basis)} at ~${fmtTokens(w.typicalContextTokens)} of context${w.streams > 1 ? ` per stream (${w.streams} streams)` : ""}. ${profile.label} is comfortable from about ${t.genTps[1]} tok/s.`,
  );

  // Prompt processing (prefill + per-step latency)
  {
    const cold = ladderScore(perf.coldPromptSec, t.coldPromptSec, false);
    const step = ladderScore(perf.stepLatencySec, t.stepLatencySec, false);
    const s = w.callsPerTask > 1 ? 0.45 * cold + 0.55 * step : 0.7 * cold + 0.3 * step;
    add(
      "prefill",
      s,
      `${fmtSec(perf.coldPromptSec)} first prompt`,
      `Ingesting the first prompt (${fmtTokens(w.coldPromptTokens)}) takes ${fmtSec(perf.coldPromptSec)}` +
        (w.callsPerTask > 1
          ? `; each of the ~${w.callsPerTask} follow-up ${w.callsPerTask > 1 && tool.agenticLoopIntensity > 0.5 ? "agent steps" : "turns"} takes ${fmtSec(perf.stepLatencySec)} (${fmtSec(perf.taskMinutes * 60)} per task).`
          : `; replies start after ${fmtSec(perf.timeToFirstTokenSec)}.`),
    );
  }

  // Context
  {
    let s = ladderScore(perf.generationTpsFullContext, t.genTps);
    const ctxDetail: string[] = [`${fmtCtx(w.contextWindow)} window; generation drops to ${fmtTps(perf.generationTpsFullContext, perf.basis)} when it is full.`];
    if (requestedContext > model.contextWindow) {
      s = Math.min(s, model.contextWindow < requestedContext / 2 ? 0.8 : 1.6);
      ctxDetail.push(`The model is limited to ${fmtCtx(model.contextWindow)}.`);
    }
    if (tool.minContext > w.contextWindow) {
      s = Math.min(s, 0.9);
      ctxDetail.push(`${tool.name} needs at least ${fmtCtx(tool.minContext)} for its system prompt and tool definitions.`);
    }
    if (w.contextWindow >= 65536 && model.capabilities.longContext < 3.5) {
      s -= 0.6;
      ctxDetail.push("Answer quality tends to degrade with very long inputs on this model.");
    }
    if (memory.kvCacheGB > 0.35 * memory.inferencePeakGB) {
      s -= 0.3;
      ctxDetail.push(`KV cache is large (≈${fmtGB(memory.kvCacheGB)}).`);
    }
    add("context", s, `${fmtCtx(w.contextWindow)} context`, ctxDetail.join(" "));
  }

  // Runtime
  {
    let s: number = MATURITY_SCORE[sel.backend.maturity];
    const detail: string[] = [];
    if (!sel.gpuAccelerated && hw.gpu) {
      s = 1;
      detail.push(sel.note ?? "No GPU acceleration.");
    } else {
      detail.push(`${runtime.name} uses ${BACKEND_LABEL[sel.backend.api]} on ${osLabel(os)} (${sel.backend.maturity} support).`);
    }
    if (sel.backend.usesAccelerators && hw.gpu?.acceleratedFp16Tflops) detail.push("Uses the GPU's matrix accelerators for faster prompt processing.");
    if ((profile.id === "api-server" || profile.id === "multi-agent" || w.streams > 1) && runtime.concurrencyPenalty > 0.5) {
      s -= 0.8;
      detail.push(`${runtime.name} batches concurrent requests poorly.`);
    }
    add("runtime", s, `${runtime.name} · ${BACKEND_LABEL[sel.backend.api]}`, detail.join(" "));
  }

  // Tool
  {
    const s = { official: 4, community: 3.2, bridge: 2.2, experimental: 1.5, unsupported: 0 }[connection.level];
    add("tool", s, SUPPORT_LABEL[connection.level], `${connection.path}.${connection.note ? ` ${connection.note}` : ""}`);
  }

  // Suitability
  const suit = suitability(model, quant.qualityLoss, profile, tool);
  add("suitability", suit.score, suit.summary, suit.detail);

  // Concurrency
  {
    if (w.streams <= 1) {
      add("concurrency", 4, "Single stream", "One request at a time.");
    } else {
      const s = 0.6 * ladderScore(perf.perStreamGenerationTps, t.genTps) + 0.4 * (1 - runtime.concurrencyPenalty) * 4;
      add(
        "concurrency",
        s,
        `${w.streams} streams`,
        `${w.streams} simultaneous streams share the GPU: ≈${Math.round(perf.aggregateGenerationTps)} tok/s total, ${fmtTps(perf.perStreamGenerationTps, perf.basis)} each. Each stream also needs its own KV cache.`,
      );
    }
  }

  // Stability / sustained use
  {
    let s = 4;
    const detail: string[] = [];
    const sustained = w.input.sessionLength === "long" || w.callsPerTask > 10 || !profile.interactive;
    if (hw.formFactor === "fanless-laptop" && sustained) {
      s -= 1.2;
      detail.push("Fanless laptops throttle under sustained load — long agent sessions slow down over time.");
    }
    if (batteryPenalty < 1) {
      s -= 1;
      detail.push("Running on battery reduces performance and drains quickly.");
    }
    if (memory.headroomFraction < 0.06) {
      s -= 1.5;
      detail.push("Very little free memory: the system may start swapping or kill apps.");
    } else if (memory.headroomFraction < 0.1) {
      s -= 0.7;
      detail.push("Limited free memory can make the rest of the system sluggish.");
    }
    if (memory.offloadFraction < 0.9 && memory.architecture !== "cpu-only") {
      s -= 0.7;
      detail.push("Partial GPU offload makes speed sensitive to everything else using RAM.");
    }
    if (sel.backend.maturity === "experimental") {
      s -= 0.8;
      detail.push(`${runtime.name}'s ${BACKEND_LABEL[sel.backend.api]} backend is experimental.`);
    }
    if (memory.vramHeadroomGB !== undefined && memory.vramHeadroomGB < 0.5) {
      s -= 0.8;
      detail.push("VRAM is nearly full; long contexts may run out of memory.");
    }
    add("stability", s, s >= 3.5 ? "Stable" : s >= 2.6 ? "Mostly stable" : "At risk", detail.length ? detail.join(" ") : "No sustained-use concerns.");
  }

  // 16. Composite + caps
  const weighted = dims.filter((d) => d.weight > 0);
  let composite = weighted.reduce((a, d) => a + d.score * d.weight, 0) / weighted.reduce((a, d) => a + d.weight, 0);
  const capReasons: string[] = [];
  for (const d of dims) {
    if (!profile.critical.includes(d.key) || d.weight < 2) continue;
    // A weak critical dimension limits the overall experience no matter how good the rest is.
    // Inadequate speed/suitability → "technically runs"; squeezed memory → "borderline".
    const floorCap = d.key === "memory" || d.key === "stability" ? 1.3 : 0.95;
    const cap = d.score < 0.25 ? floorCap : d.score + (d.weight >= 3 ? 0.8 : 1.1);
    if (cap < composite) {
      composite = cap;
      capReasons.push(d.key);
    }
  }
  if (suit.unusableToolCalling) composite = Math.min(composite, 0.9);
  if (perf.generationTpsShort < 2) composite = Math.min(composite, 0.9);
  let level = levelFromComposite(composite);
  // Explicit gating rules: top levels require every heavily-weighted critical dimension to qualify.
  const gating = dims.filter((d) => profile.critical.includes(d.key) && d.weight >= 2.5);
  if (level === "excellent" && gating.some((d) => d.score < 3.2)) {
    level = "comfortable";
    composite = Math.min(composite, 3.39);
  }
  if (level === "comfortable" && gating.some((d) => d.score < 2.4)) {
    level = "acceptable";
    composite = Math.min(composite, 2.59);
  }

  // 15. Confidence
  const confidence = computeConfidence(perf, match.basis, sel.backend.maturity, memory, model, hw, w);

  // Context recommendation
  const ctx = contextRecommendation(perfCtx, match.decodeFactor, memInput, w, model);

  // 17. Explanation
  const explanation = explain({ dims, level, composite, profile, perf, memory, w, model, runtime, tool, connection, hw, notes, capReasons });

  const perfOk = perf.generationTpsShort >= 5;
  const rec: Recommendation = {
    id: recommendationId(hw.id, model.id, quant.id, runtime.id, tool.id),
    level,
    headline: `${COMFORT_LABEL[level]} for ${profile.phrase}`,
    verdict: verdict(level, profile.phrase, explanation),
    tiers: {
      canLoad: true,
      canRun: true,
      canRunUsably: perfOk && COMFORT_RANK[level] >= COMFORT_RANK.borderline,
      canRunComfortably: COMFORT_RANK[level] >= COMFORT_RANK.comfortable,
    },
    hardware: hw,
    model,
    quant,
    format,
    runtime,
    tool,
    useCase: profile.id,
    connection,
    memory: stripMemory(memory, notes),
    performance: perf,
    dimensions: dims,
    explanation,
    confidence,
    context: { requested: requestedContext, effective: w.contextWindow, maxPractical: ctx.maxPractical, recommended: ctx.recommended },
    rankValue: 0,
    composite,
  };
  rec.rankValue = rankValue(rec, w.input.priority, suit.effectiveCapability);
  return rec;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function shrinkContext(w: ResolvedWorkload, max: number): ResolvedWorkload {
  return {
    ...w,
    contextWindow: max,
    typicalContextTokens: Math.min(w.typicalContextTokens, Math.round(max * 0.9)),
    coldPromptTokens: Math.min(w.coldPromptTokens, Math.round(max * 0.85)),
  };
}

function headroomSummary(m: MemoryResult): string {
  if (m.headroomGB < 1) return "Almost no headroom";
  return `≈${fmtGB(m.headroomGB)} headroom`;
}

function stripMemory(m: MemoryResult, notes: string[]): MemoryBreakdown {
  return { ...m, notes: [...notes, ...m.notes] };
}

export function recommendationId(hw: string, model: string, quant: string, runtime: string, tool: string) {
  return [hw, model, quant, runtime, tool].join("|");
}

interface Suitability {
  score: number;
  summary: string;
  detail: string;
  effectiveCapability: number;
  unusableToolCalling: boolean;
}

export function requiredToolCalling(profile: UseCaseProfile, tool: AITool): ToolCallingLevel {
  const fromTool: ToolCallingLevel = tool.toolCallingIntensity === "heavy" ? "good" : tool.toolCallingIntensity === "light" ? "basic" : "none";
  const fromProfile = profile.needs.toolCalling ?? "none";
  // Tools without tool calling (e.g. Aider's edit formats) don't need it even for coding workloads.
  if (tool.toolCallingIntensity === "none") return "none";
  return TOOL_CALL_RANK[fromTool] >= TOOL_CALL_RANK[fromProfile] ? fromTool : fromProfile;
}

const CAP_LABEL: Record<CapabilityKey, string> = {
  general: "general",
  coding: "coding",
  reasoning: "reasoning",
  agentic: "agentic / tool-use",
  longContext: "long-context",
  writing: "writing",
};

export function effectiveCapability(model: Model, qualityLoss: number, profile: UseCaseProfile): number {
  const qp = qualityLoss * 10 * (model.parameterCount < 10 ? 1.5 : 1);
  const primary = model.capabilities[profile.needs.primary] - qp;
  const secondary = profile.needs.secondary ? model.capabilities[profile.needs.secondary] - qp : primary;
  return 0.7 * primary + 0.3 * secondary;
}

function suitability(model: Model, qualityLoss: number, profile: UseCaseProfile, tool: AITool): Suitability {
  const eff = effectiveCapability(model, qualityLoss, profile);
  const ideal = profile.needs.idealTier;
  let score = eff >= ideal ? Math.min(4, 3.3 + (eff - ideal) * 0.7) : Math.max(0, 3.3 - (ideal - eff) * 1.4);
  const detail: string[] = [];
  const capName = CAP_LABEL[profile.needs.primary];
  if (eff >= ideal + 0.3) detail.push(`Strong ${capName} capability for ${profile.phrase}.`);
  else if (eff >= ideal - 0.3) detail.push(`Good ${capName} capability for ${profile.phrase}.`);
  else if (eff >= ideal - 1) detail.push(`${capName.charAt(0).toUpperCase() + capName.slice(1)} capability is below what ${profile.phrase} ideally needs — expect more mistakes or retries.`);
  else detail.push(`Weak ${capName} capability for ${profile.phrase}.`);
  if (qualityLoss >= 0.1) detail.push("The low-bit quantization noticeably reduces quality.");

  const required = requiredToolCalling(profile, tool);
  const deficit = TOOL_CALL_RANK[required] - TOOL_CALL_RANK[model.toolCalling];
  let unusableToolCalling = false;
  if (deficit >= 2) {
    score = Math.min(score, model.toolCalling === "none" ? 0.3 : 1.0);
    unusableToolCalling = model.toolCalling === "none" && tool.toolCallingIntensity === "heavy";
    detail.push(`${tool.name} relies on structured tool calls; ${model.name}'s tool calling is ${model.toolCalling === "none" ? "not supported" : "unreliable"}.`);
  } else if (deficit === 1) {
    score = Math.min(score, 2.2);
    detail.push(`Tool calling is only ${model.toolCalling}; ${tool.name} may occasionally fail to call tools correctly.`);
  } else if (required !== "none") {
    detail.push(`Tool calling is ${model.toolCalling}.`);
  }
  const summary = score >= 3.3 ? "Well suited" : score >= 2.5 ? "Suited" : score >= 1.6 ? "Partly suited" : "Poorly suited";
  return { score, summary, detail: detail.join(" "), effectiveCapability: eff, unusableToolCalling };
}

function computeConfidence(
  perf: PerformanceEstimate,
  basis: PerformanceEstimate["basis"],
  maturity: "mature" | "good" | "experimental",
  memory: MemoryResult,
  model: Model,
  hw: HardwareConfiguration,
  w: ResolvedWorkload,
) {
  let c = basis === "anchored" ? 3 : basis === "calibrated" ? 2.2 : 1.4;
  const reasons: string[] = [];
  if (basis === "anchored") reasons.push("A verified benchmark exists for this model on this chip.");
  else if (basis === "calibrated") reasons.push("Calibrated with verified benchmarks of other models on this chip.");
  else reasons.push("No verified benchmark for this chip and backend — performance is estimated from specifications.");
  if (maturity === "experimental") {
    c -= 0.8;
    reasons.push("Runtime backend support is experimental.");
  }
  if (w.contextWindow > 32768) {
    c -= 0.4;
    reasons.push("Long-context performance is extrapolated.");
  }
  if (memory.offloadFraction < 0.999) {
    c -= 0.5;
    reasons.push("Partial GPU offload is hard to predict precisely.");
  }
  if (basis !== "anchored" && (model.denseOrMoE === "moe" || model.architecture.fullAttentionFraction < 1)) {
    c -= 0.3;
    reasons.push(`${model.denseOrMoE === "moe" ? "MoE" : "Hybrid/sliding attention"} performance varies more between runtimes.`);
  }
  if (hw.source.confidence === "low" || model.source.confidence === "low") {
    c -= 0.4;
    reasons.push("Some specifications come from lower-confidence sources.");
  }
  if (hw.gpu?.acceleratedFp16Tflops && basis !== "anchored") {
    c -= 0.3;
    reasons.push("Prefill gains from new GPU matrix accelerators are based on vendor claims.");
  }
  if (perf?.benchmarkSources.some((b) => b.assumptions.length > 0)) {
    c -= 0.5;
    reasons.push("Benchmark placement, cache and power settings are assumed; runtime version and batch are unverified.");
  }
  reasons.push("Speed ranges are heuristic; empirical coverage has not been validated.");
  const level = c >= 2.6 ? "high" : c >= 1.5 ? "medium" : "low";
  return { level: level as "high" | "medium" | "low", reasons };
}

function contextRecommendation(
  perfCtx: PerfContext,
  decodeFactor: number,
  memInput: Omit<Parameters<typeof estimateMemory>[0], "context">,
  w: ResolvedWorkload,
  model: Model,
) {
  const t = w.profile.thresholds;
  let maxPractical = 0;
  let recommended = 0;
  for (const step of CONTEXT_STEPS) {
    if (step > model.contextWindow) break;
    const mem = estimateMemory({ ...memInput, context: step });
    if (!mem.fits) break;
    const pc = { ...perfCtx, offloadFraction: mem.offloadFraction };
    const gen = rawDecodeTps(pc, step * 0.9) * decodeFactor;
    if (gen >= t.genTps[3] && mem.headroomFraction >= t.headroomFraction[3]) maxPractical = step;
    if (gen >= t.genTps[1] * 0.85 && mem.headroomFraction >= t.headroomFraction[1]) recommended = step;
  }
  return { maxPractical, recommended: recommended || Math.min(maxPractical, 8192) };
}

interface ExplainArgs {
  dims: DimensionResult[];
  level: ComfortLevel;
  composite: number;
  profile: UseCaseProfile;
  perf: PerformanceEstimate;
  memory: MemoryResult;
  w: ResolvedWorkload;
  model: Model;
  runtime: Runtime;
  tool: AITool;
  connection: ToolConnection;
  hw: HardwareConfiguration;
  notes: string[];
  capReasons: string[];
}

function explain(a: ExplainArgs): RecommendationExplanation {
  const positives: string[] = [];
  const warnings: string[] = [];
  const blockers: string[] = [];
  const get = (k: DimensionKey) => a.dims.find((d) => d.key === k)!;
  const { perf, memory, profile, w } = a;

  // Memory
  const mem = get("memory");
  if (mem.score >= 2.6) positives.push(`Model fits with approximately ${fmtGB(memory.headroomGB)} of memory headroom.`);
  else if (mem.score >= 1) warnings.push(`Only ≈${fmtGB(Math.max(0, memory.headroomGB))} of memory headroom remains${profile.isCoding ? " for the OS, IDE, browser, terminal and agent" : ""}.`);
  else blockers.push(`The model barely fits: ≈${fmtGB(Math.max(0, memory.headroomGB))} remains, so other apps will compete for memory.`);
  if (memory.architecture === "discrete" && memory.offloadFraction < 0.999) {
    warnings.push(`Only ${Math.round(memory.offloadFraction * 100)}% of the model fits in VRAM; the rest runs from much slower system RAM.`);
  }
  if (memory.architecture === "unified" && memory.offloadFraction < 0.999) {
    warnings.push("Exceeds the default GPU memory limit — raise it or part of the model runs on the CPU.");
  }

  // Runtime
  const rt = get("runtime");
  if (rt.score >= 3) positives.push(`${a.runtime.name} supports hardware acceleration on this machine (${BACKEND_LABEL[perf.backend]}).`);
  else warnings.push(rt.detail);

  // Tool
  const tl = get("tool");
  if (a.connection.level === "official") positives.push(`${a.tool.name} can connect to ${a.runtime.name} (officially supported).`);
  else if (a.connection.level === "community") positives.push(`${a.tool.name} can connect to ${a.runtime.name} (community-supported setup).`);
  else warnings.push(`${a.tool.name} → ${a.runtime.name} ${a.connection.level === "bridge" ? "requires a bridge/proxy" : "is experimental"}.`);
  void tl;

  // Generation
  const gen = get("generation");
  const genText = fmtTps(perf.perStreamGenerationTps, perf.basis);
  if (gen.score >= 2.6) positives.push(`Generation (${genText}) should be appropriate for ${profile.phrase}.`);
  else if (gen.score >= 1.8) warnings.push(`Generation (${genText}) is adequate but not ideal for ${profile.phrase}.`);
  else blockers.push(`Generation (${genText}) is slow for ${profile.phrase}${a.tool.agenticLoopIntensity > 0.5 ? " — slow steps compound across many agent iterations" : ""}.`);

  // Prefill
  const pp = get("prefill");
  const ppText = `Ingesting a prompt of ${fmtTokens(w.coldPromptTokens)} takes ${fmtSec(perf.coldPromptSec)}`;
  if (pp.score >= 2.6) positives.push(`${ppText}; prompt processing keeps up with ${profile.phrase}.`);
  else if (pp.score >= 1.8) warnings.push(`${ppText}, and each step ≈${fmtSec(perf.stepLatencySec).replace("≈", "")} — noticeable waits.`);
  else blockers.push(`${ppText} and each step ≈${fmtSec(perf.stepLatencySec).replace("≈", "")}${w.callsPerTask > 3 ? `; across ~${w.callsPerTask} calls a task takes ${fmtSec(perf.taskMinutes * 60)}` : ""}.`);

  // Context
  const cx = get("context");
  if (cx.score >= 2.6) positives.push(`${fmtCtx(w.contextWindow)} working context is reasonable.`);
  else warnings.push(cx.detail);

  // Suitability
  const st = get("suitability");
  if (st.score >= 2.6) positives.push(st.detail);
  else if (st.score >= 1.2) warnings.push(st.detail);
  else blockers.push(st.detail);

  // Concurrency
  const cc = get("concurrency");
  if (w.streams > 1) {
    if (cc.score >= 2.6) positives.push(cc.detail);
    else warnings.push(`${cc.detail} That is slow per stream.`);
  }

  // Stability
  const sb = get("stability");
  if (sb.score < 3) warnings.push(sb.detail);

  warnings.push(...a.notes);

  // Why not higher
  const whyNotHigher: string[] = [];
  const next = nextLevelThreshold(a.level);
  if (next && COMFORT_RANK[a.level] >= COMFORT_RANK["technically-runs"]) {
    const limiting = a.dims
      .filter((d) => d.weight >= 1 && d.score < Math.max(next.min + 0.2, 2.6))
      .sort((x, y) => (y.weight * (4 - y.score)) - (x.weight * (4 - x.score)))
      .slice(0, 4);
    for (const d of limiting) whyNotHigher.push(`${d.label}: ${d.detail}`);
  }

  const bottlenecks = a.dims
    .filter((d) => d.weight >= 1.5 && d.score < 2.6)
    .sort((x, y) => x.score - y.score)
    .slice(0, 3)
    .map((d) => d.label);

  // Better for / less suitable for (derived from the dimension profile, refined in the UI with cross-use-case evaluation)
  const betterFor: string[] = [];
  const lessSuitableFor: string[] = [];
  if (perf.generationTpsShort >= 35) betterFor.push("Interactive chat");
  if (perf.generationTpsShort >= 30 && a.model.capabilities.coding >= 3.5) betterFor.push("Interactive coding");
  if (perf.coldPromptSec < 15 && a.model.capabilities.coding >= 3.5) betterFor.push("Single-file changes");
  if (perf.generationTpsFullContext < 15) lessSuitableFor.push(`${fmtCtx(w.contextWindow)}+ active context`);
  if (perf.prefillTps < 400) lessSuitableFor.push("Large repositories and long documents");
  if (memory.headroomFraction < 0.15) lessSuitableFor.push("Heavy development environments alongside the model");
  if (a.runtime.concurrencyPenalty > 0.5 || perf.generationTps < 40) lessSuitableFor.push("Multiple simultaneous agents");

  return { positives, warnings, blockers, whyNotHigher, bottlenecks, betterFor, lessSuitableFor };
}

function verdict(level: ComfortLevel, phrase: string, e: RecommendationExplanation): string {
  const issues = [...e.blockers, ...e.warnings].slice(0, 2).map((s) => s.replace(/\.$/, "").replace(/^./, (c) => c.toLowerCase()));
  const why = issues.length ? `: ${issues.join("; ")}` : "";
  switch (level) {
    case "excellent":
      return `Yes — this should be excellent for ${phrase}, with plenty of headroom.`;
    case "comfortable":
      return `Yes — this should be comfortable for ${phrase}.`;
    case "acceptable":
      return `Usable for ${phrase}, but expect compromises${why}.`;
    case "borderline":
      return `It runs, but we don't recommend it for ${phrase}${why}.`;
    case "technically-runs":
      return `It technically runs, but the experience is not appropriate for ${phrase}${why}.`;
    default:
      return "";
  }
}

function rankValue(r: Recommendation, priority: "speed" | "balanced" | "quality", capability: number): number {
  const comfort = COMFORT_RANK[r.level];
  const speed = Math.log2(Math.max(1, r.performance?.perStreamGenerationTps ?? 1));
  if (priority === "speed") return comfort * 10 + speed * 2.2 + capability * 1.2 + r.composite;
  if (priority === "quality") return comfort * 6 + speed * 0.5 + capability * 4 + r.composite;
  return comfort * 10 + speed * 1.1 + capability * 2.2 + r.composite;
}

function blocked(
  b: { hw: HardwareConfiguration; model: Model; quant: (typeof QUANTIZATIONS)[QuantId]; tool: AITool; runtime: Runtime; w: ResolvedWorkload; os: OS },
  level: "unsupported" | "does-not-fit",
  reason: string,
  connection?: ToolConnection,
  memory?: MemoryResult,
): Recommendation {
  const emptyMemory: MemoryBreakdown = memory ?? {
    architecture: b.hw.memoryArchitecture,
    installedGB: b.hw.systemRamGB,
    vramGB: b.hw.gpu?.vramGB,
    osReserveGB: 0,
    devEnvReserveGB: b.w.devEnvGB,
    toolOverheadGB: 0,
    runtimeOverheadGB: 0,
    weightsGB: 0,
    kvCacheGB: 0,
    visionEncoderGB: 0,
    inferencePeakGB: 0,
    estimatedPeakGB: 0,
    availableForInferenceGB: 0,
    headroomGB: 0,
    headroomFraction: 0,
    gpuOffloadFraction: 0,
    fits: false,
    notes: [],
  };
  return {
    id: recommendationId(b.hw.id, b.model.id, b.quant.id, b.runtime.id, b.tool.id),
    level,
    headline: level === "unsupported" ? "Unsupported combination" : "Does not fit in memory",
    verdict: level === "unsupported" ? `This combination does not work: ${reason}` : `This model doesn't fit at these settings. ${reason}`,
    tiers: { canLoad: level !== "unsupported" && false, canRun: false, canRunUsably: false, canRunComfortably: false },
    hardware: b.hw,
    model: b.model,
    quant: b.quant,
    format: "gguf",
    runtime: b.runtime,
    tool: b.tool,
    useCase: b.w.profile.id,
    connection: connection ?? { level: "unsupported", path: "" },
    memory: memory ? { ...memory, notes: memory.notes } : emptyMemory,
    performance: null,
    dimensions: [],
    explanation: { positives: [], warnings: [], blockers: [reason], whyNotHigher: [], bottlenecks: [], betterFor: [], lessSuitableFor: [] },
    confidence: { level: "high", reasons: ["Compatibility and memory rules are deterministic."] },
    context: { requested: b.w.contextWindow, effective: b.w.contextWindow, maxPractical: 0, recommended: 0 },
    rankValue: level === "does-not-fit" ? -1 : -2,
    composite: -1,
  };
}

