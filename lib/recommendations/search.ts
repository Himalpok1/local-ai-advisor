import { HARDWARE, MODELS, getModel, getTool } from "@/data";
import type { ComfortTarget, HardwareConfiguration, OS, QuantId, UseCaseId, WorkloadProfileInput } from "@/lib/schemas";
import { COMFORT_RANK, type ComfortLevel, type ContextPoint, type Recommendation, type WhatIfSuggestion } from "@/lib/schemas/results";
import { getUseCase } from "@/lib/workloads/profiles";
import { CONTEXT_STEPS, resolveWorkload } from "@/lib/workloads/resolve";
import { fmtCtx } from "@/lib/format";
import { effectiveCapability, evaluate, rankRuntimes, type EvaluateInput } from "./evaluate";
import { defaultOs } from "@/lib/compatibility";

/** Quantizations worth considering for recommendations (FP16 only for small models). */
export function candidateQuants(modelId: string): QuantId[] {
  const m = getModel(modelId);
  return m.supportedQuantizations.filter((q) => q !== "fp16" || m.parameterCount <= 9);
}

export function capabilityFor(rec: Recommendation): number {
  return effectiveCapability(rec.model, rec.quant.qualityLoss, getUseCase(rec.useCase));
}

/** Evaluate every quant of a model and keep the best one for this workload. */
export function bestQuantFor(base: Omit<EvaluateInput, "quant">, quants = candidateQuants(base.modelId)): Recommendation {
  let best: Recommendation | null = null;
  for (const q of quants) {
    const r = evaluate({ ...base, quant: q });
    if (!best || r.rankValue > best.rankValue || (r.rankValue === best.rankValue && r.quant.qualityLoss < best.quant.qualityLoss)) best = r;
  }
  return best!;
}

export interface ModelSearchResult {
  all: Recommendation[];
  picks: {
    recommended?: Recommendation;
    fastest?: Recommendation;
    quality?: Recommendation;
    technicallyPossible: Recommendation[];
  };
  counts: Record<ComfortLevel, number>;
}

export function recommendModels(args: {
  hardware: HardwareConfiguration;
  workload: WorkloadProfileInput;
  os?: OS;
  runtimeId?: string;
  modelIds?: string[];
}): ModelSearchResult {
  const models = args.modelIds ? args.modelIds.map(getModel) : MODELS;
  const all = models
    .map((m) => bestQuantFor({ hardware: args.hardware, modelId: m.id, workload: args.workload, os: args.os, runtimeId: args.runtimeId }))
    .sort((a, b) => b.rankValue - a.rankValue);

  const usable = all.filter((r) => COMFORT_RANK[r.level] >= COMFORT_RANK.acceptable);
  const comfy = all.filter((r) => COMFORT_RANK[r.level] >= COMFORT_RANK.comfortable);
  const recommended = usable[0];
  const speedPool = (comfy.length > 1 ? comfy : usable).filter((r) => r !== recommended);
  const fastest = [...speedPool].sort((a, b) => (b.performance?.perStreamGenerationTps ?? 0) - (a.performance?.perStreamGenerationTps ?? 0))[0];
  const qualityPool = usable.filter((r) => r !== recommended && r !== fastest);
  const quality = [...qualityPool].sort((a, b) => capabilityFor(b) - capabilityFor(a))[0];
  const picked = new Set([recommended, fastest, quality].filter(Boolean).map((r) => r!.model.family + r!.model.parameterCount));
  const technicallyPossible = all
    .filter((r) => r.level === "borderline" || r.level === "technically-runs")
    .filter((r) => !recommended || capabilityFor(r) > capabilityFor(recommended) - 0.2)
    .filter((r) => !picked.has(r.model.family + r.model.parameterCount))
    .sort((a, b) => capabilityFor(b) - capabilityFor(a))
    .slice(0, 3);

  const counts = Object.fromEntries(Object.keys(COMFORT_RANK).map((k) => [k, 0])) as Record<ComfortLevel, number>;
  for (const r of all) counts[r.level]++;

  return {
    all,
    picks: {
      recommended,
      fastest,
      quality: quality && recommended && capabilityFor(quality) > capabilityFor(recommended) ? quality : undefined,
      technicallyPossible,
    },
    counts,
  };
}

export const TARGET_LEVEL: Record<ComfortTarget, ComfortLevel> = {
  usable: "acceptable",
  comfortable: "comfortable",
  excellent: "excellent",
};

export interface HardwareSearchResult {
  meetsTarget: Recommendation[];
  meetsAcceptable: Recommendation[];
  belowTarget: Recommendation[];
  cannotRun: Recommendation[];
  overBudget: number;
}

export function recommendHardware(args: {
  modelId: string;
  quant?: QuantId;
  workload: WorkloadProfileInput;
  runtimeId?: string;
  target: ComfortTarget;
  budgetUSD?: number;
  hardware?: HardwareConfiguration[];
  vendors?: string[];
}): HardwareSearchResult {
  const target = TARGET_LEVEL[args.target];
  const pool = (args.hardware ?? HARDWARE).filter((h) => !args.vendors?.length || args.vendors.includes(h.vendor));
  const quants = args.quant ? [args.quant] : candidateQuants(args.modelId).filter((q) => q !== "q3" && q !== "fp16");
  const out: HardwareSearchResult = { meetsTarget: [], meetsAcceptable: [], belowTarget: [], cannotRun: [], overBudget: 0 };
  for (const hw of pool) {
    if (args.budgetUSD && hw.approxPriceUSD && hw.approxPriceUSD > args.budgetUSD) {
      out.overBudget++;
      continue;
    }
    const rec = bestQuantFor({ hardware: hw, modelId: args.modelId, workload: args.workload, runtimeId: args.runtimeId }, quants);
    const rank = COMFORT_RANK[rec.level];
    if (rank >= COMFORT_RANK[target]) out.meetsTarget.push(rec);
    else if (rank >= COMFORT_RANK.acceptable) out.meetsAcceptable.push(rec);
    else if (rank >= COMFORT_RANK["technically-runs"]) out.belowTarget.push(rec);
    else out.cannotRun.push(rec);
  }
  const byValue = (a: Recommendation, b: Recommendation) =>
    (a.hardware.approxPriceUSD ?? 1e9) - (b.hardware.approxPriceUSD ?? 1e9) || b.composite - a.composite;
  out.meetsTarget.sort(byValue);
  out.meetsAcceptable.sort((a, b) => b.composite - a.composite);
  out.belowTarget.sort((a, b) => b.composite - a.composite);
  out.cannotRun.sort((a, b) => b.hardware.systemRamGB - a.hardware.systemRamGB);
  return out;
}

/* ------------------------------------------------------------------ */
/* Context sweep                                                       */
/* ------------------------------------------------------------------ */

export function contextSweep(input: EvaluateInput): ContextPoint[] {
  const model = getModel(input.modelId);
  return CONTEXT_STEPS.map((context) => {
    const supported = context <= model.contextWindow;
    const r = evaluate({ ...input, workload: { ...input.workload, desiredContextWindow: context } });
    return {
      context,
      supported,
      fits: r.memory.fits,
      level: supported ? r.level : r.level === "unsupported" ? "unsupported" : r.level,
      generationTps: r.performance?.generationTpsFullContext ?? 0,
      coldPromptSec: r.performance?.coldPromptSec ?? 0,
      headroomGB: r.memory.headroomGB,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Use-case fit ("better for / less suitable for")                     */
/* ------------------------------------------------------------------ */

const FIT_CASES: { useCase: UseCaseId; toolId: string; label: string; extra?: Partial<WorkloadProfileInput> }[] = [
  { useCase: "casual-chat", toolId: "open-webui", label: "Casual chat" },
  { useCase: "coding-questions", toolId: "continue", label: "Coding questions" },
  { useCase: "coding-repo", toolId: "aider", label: "Interactive coding on a normal repository" },
  { useCase: "agentic-coding", toolId: "opencode", label: "Agentic coding (medium repository)", extra: { repositorySize: "medium" } },
  { useCase: "agentic-coding", toolId: "opencode", label: "Agentic coding on very large repositories", extra: { repositorySize: "very-large" } },
  { useCase: "long-doc-qa", toolId: "open-webui", label: "64K+ long-document Q&A", extra: { desiredContextWindow: 65536 } },
  { useCase: "reasoning", toolId: "open-webui", label: "Reasoning" },
  { useCase: "multi-agent", toolId: "opencode", label: "Multiple simultaneous agents", extra: { numberOfAgents: 3 } },
  { useCase: "api-server", toolId: "api-only", label: "Serving several concurrent users", extra: { concurrentRequests: 4 } },
];

export function fitAcrossUseCases(input: EvaluateInput): { label: string; level: ComfortLevel }[] {
  return FIT_CASES.map((c) => {
    const r = evaluate({
      ...input,
      runtimeId: undefined,
      workload: {
        useCase: c.useCase,
        toolId: c.toolId,
        devEnv: input.workload.devEnv,
        customDevEnvGB: input.workload.customDevEnvGB,
        ...c.extra,
      },
    });
    return { label: c.label, level: r.level };
  });
}

/* ------------------------------------------------------------------ */
/* What-if suggestions                                                 */
/* ------------------------------------------------------------------ */

type Patch = { workload?: Partial<WorkloadProfileInput>; quant?: QuantId; modelId?: string; runtimeId?: string };

export function whatIf(input: EvaluateInput, current?: Recommendation): WhatIfSuggestion[] {
  const cur = current ?? evaluate(input);
  const tool = getTool(input.workload.toolId);
  const w = resolveWorkload(input.workload, tool);
  const model = getModel(input.modelId);
  const candidates: { id: string; label: string; change: string; patch: Patch }[] = [];

  const ctx = w.contextWindow;
  const lower = CONTEXT_STEPS.filter((c) => c < ctx && c >= Math.max(tool.minContext, 4096)).reverse();
  if (lower[0]) candidates.push({ id: "ctx-down", label: `${fmtCtx(lower[0])} context`, change: `${fmtCtx(ctx)} → ${fmtCtx(lower[0])}`, patch: { workload: { desiredContextWindow: lower[0] } } });
  const higher = CONTEXT_STEPS.find((c) => c > ctx && c <= model.contextWindow);
  if (higher) candidates.push({ id: "ctx-up", label: `${fmtCtx(higher)} context`, change: `${fmtCtx(ctx)} → ${fmtCtx(higher)}`, patch: { workload: { desiredContextWindow: higher } } });

  const quants = candidateQuants(model.id);
  const qi = quants.indexOf(input.quant);
  if (qi > 0) candidates.push({ id: "quant-down", label: `${quants[qi - 1].toUpperCase()} quantization`, change: `${input.quant.toUpperCase()} → ${quants[qi - 1].toUpperCase()}`, patch: { quant: quants[qi - 1] } });
  if (qi >= 0 && qi < quants.length - 1) candidates.push({ id: "quant-up", label: `${quants[qi + 1].toUpperCase()} quantization`, change: `${input.quant.toUpperCase()} → ${quants[qi + 1].toUpperCase()}`, patch: { quant: quants[qi + 1] } });

  if ((input.workload.kvCacheType ?? "f16") === "f16") candidates.push({ id: "kv-q8", label: "8-bit KV cache", change: "KV cache FP16 → Q8", patch: { workload: { kvCacheType: "q8" } } });

  const devOrder = ["none", "light", "normal", "heavy", "very-heavy"] as const;
  const dev = input.workload.devEnv ?? "normal";
  const di = devOrder.indexOf(dev as (typeof devOrder)[number]);
  if (di > 1) candidates.push({ id: "dev-lighter", label: `${devOrder[di - 1]} dev environment`, change: `Close some apps (${dev} → ${devOrder[di - 1]})`, patch: { workload: { devEnv: devOrder[di - 1] } } });

  const agents = input.workload.numberOfAgents ?? 1;
  if (agents > 1) candidates.push({ id: "agents-down", label: `${agents - 1} agent${agents - 1 > 1 ? "s" : ""}`, change: `${agents} → ${agents - 1} concurrent agents`, patch: { workload: { numberOfAgents: agents - 1 } } });
  const reqs = input.workload.concurrentRequests ?? 1;
  if (reqs > 1) candidates.push({ id: "reqs-down", label: `${Math.ceil(reqs / 2)} concurrent requests`, change: `${reqs} → ${Math.ceil(reqs / 2)} requests`, patch: { workload: { concurrentRequests: Math.ceil(reqs / 2) } } });

  if (input.hardware.memoryArchitecture === "unified" && !input.workload.raiseGpuMemoryLimit && cur.memory.gpuOffloadFraction < 0.999) {
    candidates.push({ id: "raise-limit", label: "Raise GPU memory limit", change: "Allow the GPU to use more unified memory", patch: { workload: { raiseGpuMemoryLimit: true } } });
  }

  // Smaller / larger sibling models in the same family
  const siblings = MODELS_BY_FAMILY(model.family).filter((m) => m.id !== model.id);
  const smaller = siblings.filter((m) => m.parameterCount < model.parameterCount).sort((a, b) => b.parameterCount - a.parameterCount)[0];
  if (smaller) candidates.push({ id: "model-smaller", label: smaller.name, change: `Smaller model: ${smaller.name}`, patch: { modelId: smaller.id, quant: pickQuant(smaller.id, input.quant) } });

  // Alternative runtimes
  const os = input.os ?? defaultOs(input.hardware);
  for (const rc of rankRuntimes(input.hardware, os, model, input.quant, tool).slice(0, 4)) {
    if (rc.runtime.id === cur.runtime.id) continue;
    candidates.push({ id: `rt-${rc.runtime.id}`, label: rc.runtime.name, change: `Runtime ${cur.runtime.name} → ${rc.runtime.name}`, patch: { runtimeId: rc.runtime.id } });
  }

  const out: WhatIfSuggestion[] = [];
  for (const c of candidates) {
    const next: EvaluateInput = {
      ...input,
      quant: c.patch.quant ?? input.quant,
      modelId: c.patch.modelId ?? input.modelId,
      runtimeId: c.patch.runtimeId ?? input.runtimeId,
      workload: { ...input.workload, ...c.patch.workload },
    };
    const r = evaluate(next);
    if (r.level === cur.level && Math.abs(r.composite - cur.composite) < 0.15) continue;
    const better = COMFORT_RANK[r.level] > COMFORT_RANK[cur.level] || (r.level === cur.level && r.composite > cur.composite);
    out.push({
      id: c.id,
      label: c.label,
      change: c.change,
      from: cur.level,
      to: r.level,
      reason: describeChange(cur, r, better),
      patch: c.patch as Record<string, unknown>,
    });
  }
  return out.sort((a, b) => COMFORT_RANK[b.to] - COMFORT_RANK[a.to]);
}

export function describeChange(a: Recommendation, b: Recommendation, better: boolean): string {
  if (b.level === "does-not-fit" || b.level === "unsupported") return b.explanation.blockers[0] ?? b.verdict;
  const pa = a.performance;
  const pb = b.performance;
  const parts: string[] = [];
  if (a.memory.fits && b.memory.fits && Math.abs(b.memory.headroomGB - a.memory.headroomGB) > 0.8) {
    parts.push(`headroom ${b.memory.headroomGB > a.memory.headroomGB ? "rises" : "falls"} to ≈${Math.max(0, Math.round(b.memory.headroomGB))} GB`);
  }
  if (pa && pb && Math.abs(pb.perStreamGenerationTps / pa.perStreamGenerationTps - 1) > 0.08) {
    parts.push(`generation ${pb.perStreamGenerationTps > pa.perStreamGenerationTps ? "speeds up" : "slows"} to ≈${Math.round(pb.perStreamGenerationTps)} tok/s`);
  }
  if (pa && pb && Math.abs(pb.stepLatencySec / pa.stepLatencySec - 1) > 0.1) {
    parts.push(`each step takes ≈${Math.round(pb.stepLatencySec)} s`);
  }
  const sa = a.dimensions.find((d) => d.key === "suitability")?.score ?? 0;
  const sb = b.dimensions.find((d) => d.key === "suitability")?.score ?? 0;
  if (Math.abs(sb - sa) > 0.3) parts.push(sb > sa ? "better model quality for this task" : "lower model quality for this task");
  if (!a.memory.fits && b.memory.fits) parts.push("the model now fits");
  if (!parts.length) parts.push(better ? "small improvements across several factors" : "small regressions across several factors");
  return parts.join(", ").replace(/^./, (c) => c.toUpperCase()) + ".";
}

function MODELS_BY_FAMILY(family: string) {
  return MODELS.filter((m) => m.family === family);
}

function pickQuant(modelId: string, preferred: QuantId): QuantId {
  const q = candidateQuants(modelId);
  return q.includes(preferred) ? preferred : q.includes("q4") ? "q4" : q[0];
}

/* ------------------------------------------------------------------ */
/* Stack builder                                                       */
/* ------------------------------------------------------------------ */

export interface StackLayer {
  layer: "Hardware" | "Runtime" | "Model" | "Local API" | "AI tool";
  name: string;
  detail: string;
}

export function stackFor(rec: Recommendation): StackLayer[] {
  const apiName = rec.connection.api === "anthropic" ? "Anthropic-compatible endpoint" : rec.connection.api === "ollama" ? "Ollama API" : "OpenAI-compatible endpoint";
  const port: Record<string, string> = { ollama: "localhost:11434", "lm-studio": "localhost:1234", "llama.cpp": "localhost:8080", "mlx-lm": "localhost:8080", jan: "localhost:1337", vllm: "localhost:8000", sglang: "localhost:30000", localai: "localhost:8080", lemonade: "localhost:13305" };
  return [
    { layer: "Hardware", name: rec.hardware.name, detail: `${rec.hardware.memoryArchitecture === "discrete" ? `${rec.hardware.gpu?.vramGB} GB VRAM + ${rec.hardware.systemRamGB} GB RAM` : `${rec.hardware.systemRamGB} GB ${rec.hardware.memoryArchitecture === "unified" ? "unified memory" : "RAM"}`}` },
    { layer: "Runtime", name: rec.runtime.name, detail: `${rec.performance ? rec.performance.backend.toUpperCase() : ""} backend · ${rec.format.toUpperCase()} weights` },
    { layer: "Model", name: `${rec.model.name} — ${rec.quant.formatNames[rec.format] ?? rec.quant.label}`, detail: `${Math.round(rec.memory.weightsGB)} GB weights · ${fmtCtx(rec.context.effective)} context` },
    { layer: "Local API", name: apiName, detail: `http://${port[rec.runtime.id] ?? "localhost"}` + (rec.connection.level === "bridge" ? " via a bridge/proxy" : "") },
    { layer: "AI tool", name: rec.tool.name, detail: rec.connection.note ?? rec.tool.description.split(".")[0] },
  ];
}

