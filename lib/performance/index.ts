/**
 * Performance engine.
 *
 * Decode (generation) is memory-bandwidth bound: every generated token reads
 * the active weights plus the KV cache. Prefill (prompt processing) is compute
 * bound: ~2 × active-params FLOPs per prompt token, getting slower as the
 * context grows (attention cost).
 *
 * Estimates are calibrated with verified benchmarks when the same chip has
 * measured data, and replaced by measured numbers when the exact
 * chip + model + quant combination was benchmarked. Nothing here invents a
 * "measured" number: when no benchmark applies the basis is "estimated".
 */
import type {
  Benchmark,
  BackendSupport,
  HardwareConfiguration,
  KvCacheType,
  Model,
  ModelFormat,
  Quantization,
  Runtime,
} from "@/lib/schemas";
import type { PerformanceBasis, PerformanceEstimate } from "@/lib/schemas/results";
import { activeWeightsGB, kvBytesPerToken, KV_TYPE_FACTOR, weightsGB } from "@/lib/memory";
import type { ResolvedWorkload } from "@/lib/workloads/resolve";

const GB = 1e9;
const GiB = 1024 ** 3;
/** Effective PCIe host→device bandwidth used when prefill streams CPU-resident weights. */
const PCIE_GBS = 24;
/** Fixed per-request overhead (HTTP, tokenization, sampling setup). */
const REQUEST_OVERHEAD_SEC = 0.35;

export interface PerfContext {
  hardware: HardwareConfiguration;
  model: Model;
  quant: Quantization;
  format: ModelFormat;
  runtime: Runtime;
  backend: BackendSupport;
  kvCacheType: KvCacheType;
  /** Fraction of decode bytes resident on the GPU (1 = fully offloaded). */
  offloadFraction: number;
  batteryPenalty: number;
}

/** Vendor-specific multiplier on backend efficiency (e.g. Vulkan on AMD vs NVIDIA). */
function vendorBackendFactor(hw: HardwareConfiguration, backend: BackendSupport): { decode: number; prefill: number } {
  const v = hw.gpu?.vendor;
  if (backend.api === "vulkan" && v === "amd") return { decode: 1.05, prefill: 0.55 };
  // Intel prefill via Vulkan is far below peak XMX throughput (Arc B580 scoreboard).
  if (backend.api === "vulkan" && v === "intel") return { decode: 0.8, prefill: 0.12 };
  if (backend.api === "rocm") return { decode: 0.9, prefill: 0.6 };
  if (backend.api === "sycl") return { decode: 0.8, prefill: 0.3 };
  // Ultra chips (two dies) do not scale bandwidth linearly in practice.
  if (backend.api === "metal" && /ultra/i.test(hw.cpu.name + hw.name)) return { decode: 0.78, prefill: 1 };
  return { decode: 1, prefill: 1 };
}

function gpuBandwidth(hw: HardwareConfiguration): number {
  return hw.gpu?.bandwidthGBs ?? hw.systemRamBandwidthGBs;
}

function prefillTflops(hw: HardwareConfiguration, backend: BackendSupport): number {
  if (backend.api === "cpu" || !hw.gpu) return hw.cpu.gflops / 1000;
  const accel = backend.usesAccelerators ? hw.gpu.acceleratedFp16Tflops : undefined;
  return accel ?? hw.gpu.fp16Tflops;
}

/** Raw (uncalibrated) decode tokens/s at a given context depth. */
export function rawDecodeTps(c: PerfContext, contextTokens: number): number {
  const { hardware: hw, model, backend } = c;
  const active = activeWeightsGB(model, c.quant, c.format) * GiB;
  const kvRead = kvBytesPerToken(model) * KV_TYPE_FACTOR[c.kvCacheType] * contextTokens;
  const bytes = active + kvRead;
  // Expert routing + higher-precision shared weights make MoE decode less
  // efficient per active byte (fitted against gpt-oss / Qwen3-Coder benchmarks).
  const moeFactor = model.denseOrMoE === "moe" ? 0.75 : 1;
  const vf = vendorBackendFactor(hw, backend);

  if (backend.api === "cpu" || !hw.gpu) {
    const cpuBw = hw.systemRamBandwidthGBs * GB * 0.55;
    return (cpuBw / bytes) * moeFactor * c.batteryPenalty;
  }
  const gpuBw = gpuBandwidth(hw) * GB * backend.decodeEfficiency * vf.decode;
  const f = Math.max(0, Math.min(1, c.offloadFraction));
  const cpuBw = hw.systemRamBandwidthGBs * GB * (hw.memoryArchitecture === "unified" ? 0.6 : 0.55);
  const seconds = (bytes * f) / gpuBw + (bytes * (1 - f)) / cpuBw;
  return (1 / seconds) * moeFactor * c.batteryPenalty;
}

/** Raw prefill tokens/s at a short prompt (~512 tokens). */
export function rawPrefillTps(c: PerfContext): number {
  const { hardware: hw, model, backend } = c;
  const flopsPerToken = 2 * model.activeParameterCount * 1e9;
  const vf = vendorBackendFactor(hw, backend);
  const isCpu = backend.api === "cpu" || !hw.gpu;
  const eff = isCpu ? 0.5 : backend.prefillEfficiency * vf.prefill;
  // MoE prefill efficiency per active FLOP is backend-dependent: llama.cpp
  // benchmarks show ~0.5× the naive estimate on CUDA (DGX Spark, RTX 5090) but
  // close to 1× on Metal (M2 Ultra: Qwen3-Coder-30B-A3B, gpt-oss-20b).
  const moeFactor = model.denseOrMoE === "moe" ? (backend.api === "metal" ? 0.95 : 0.5) : 1;
  let tps = ((prefillTflops(hw, backend) * 1e12 * eff) / flopsPerToken) * moeFactor;
  // Low-bit quants need dequantization work during prefill.
  if (c.quant.id === "q3") tps *= 0.85;
  if (!isCpu && c.offloadFraction < 0.999 && hw.memoryArchitecture === "discrete") {
    // CPU-resident weights are streamed over PCIe once per batch.
    const spilled = weightsGB(model, c.quant, c.format) * (1 - c.offloadFraction) * GiB;
    const batch = 512;
    const secPerBatch = batch / tps + spilled / (PCIE_GBS * GB);
    tps = batch / secPerBatch;
  }
  return tps * c.batteryPenalty;
}

/** Attention makes prefill slower as depth grows; K is the depth where speed halves. */
function prefillHalfDepth(model: Model): number {
  return 24000 / Math.max(0.2, model.architecture.fullAttentionFraction);
}

/** Average prefill speed when ingesting `tokens` starting at depth 0. */
export function averagePrefillTps(base: number, tokens: number, model: Model): number {
  const K = prefillHalfDepth(model);
  if (tokens <= 512) return base;
  const avgFactor = (K / tokens) * Math.log(1 + tokens / K);
  return base * avgFactor;
}

/** Prefill speed for new tokens appended at a given depth. */
export function prefillTpsAtDepth(base: number, depth: number, model: Model): number {
  return base / (1 + depth / prefillHalfDepth(model));
}

/* ------------------------------------------------------------------ */
/* Benchmark matching                                                  */
/* ------------------------------------------------------------------ */

export function runtimeEngine(runtime: Runtime, backend: BackendSupport): string {
  return backend.engine ?? runtime.engine;
}

export interface BenchmarkMatch {
  basis: PerformanceBasis;
  decodeFactor: number;
  prefillFactor: number;
  direct?: Benchmark;
  used: Benchmark[];
  explanation: string;
}

/**
 * Find benchmarks for this chip. A direct hit (same model + quant + engine)
 * yields "measured"; otherwise any same-chip benchmark calibrates the
 * hardware-efficiency assumptions ("calibrated").
 */
export function matchBenchmarks(c: PerfContext, benchmarks: Benchmark[], models: Map<string, Model>, quants: Record<string, Quantization>): BenchmarkMatch {
  const engine = runtimeEngine(c.runtime, c.backend);
  const sameChip = benchmarks.filter((b) => b.verified && b.chipKey === c.hardware.chipKey && b.backend === c.backend.api);
  if (sameChip.length === 0) {
    return {
      basis: "estimated",
      decodeFactor: 1,
      prefillFactor: 1,
      used: [],
      explanation:
        "No verified benchmark exists for this chip with this backend. Speeds are estimated from memory bandwidth (generation) and compute throughput (prompt processing).",
    };
  }
  const direct = sameChip.find((b) => b.modelId === c.model.id && b.quant === c.quant.id && engineFamily(b.runtimeId) === engine);
  // Calibration: ratio between measured and our raw estimate for the benchmarked model.
  const decodeRatios: number[] = [];
  const prefillRatios: number[] = [];
  for (const b of sameChip) {
    const bm = models.get(b.modelId);
    const bq = quants[b.quant];
    if (!bm || !bq) continue;
    const ctx: PerfContext = { ...c, model: bm, quant: bq, format: "gguf", offloadFraction: 1, batteryPenalty: 1, kvCacheType: "f16" };
    const estDecode = rawDecodeTps(ctx, b.contextTokens + b.outputTokens / 2);
    decodeRatios.push(b.generationTps / estDecode);
    if (b.prefillTps) {
      const estPrefill = averagePrefillTps(rawPrefillTps(ctx), b.promptTokens, bm);
      prefillRatios.push(b.prefillTps / estPrefill);
    }
  }
  const clamp = (x: number) => Math.min(1.6, Math.max(0.55, x));
  const median = (xs: number[]) => {
    if (!xs.length) return 1;
    const s = [...xs].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };
  // Cross-engine calibration is weaker: blend halfway back to 1.
  const crossEngine = sameChip.every((b) => engineFamily(b.runtimeId) !== engine);
  const blend = (r: number) => (crossEngine ? 1 + (r - 1) * 0.5 : r);
  const decodeFactor = clamp(blend(median(decodeRatios)));
  const prefillFactor = clamp(blend(median(prefillRatios)));

  if (direct) {
    return {
      basis: "measured",
      decodeFactor,
      prefillFactor,
      direct,
      used: [direct],
      explanation: `Based on a verified ${direct.quantLabel} benchmark of this model on this chip (${direct.source.title ?? "source"}, ${direct.date}). Context-dependent values are extrapolated from it.`,
    };
  }
  return {
    basis: "calibrated",
    decodeFactor,
    prefillFactor,
    used: sameChip,
    explanation: `Estimated from bandwidth and compute, calibrated against ${sameChip.length} verified benchmark${sameChip.length > 1 ? "s" : ""} of other models on this same chip${crossEngine ? " (measured with a different engine, so calibration is partial)" : ""}.`,
  };
}

function engineFamily(runtimeId: string): string {
  if (["llama.cpp", "ollama", "lm-studio", "jan", "localai", "lemonade", "koboldcpp"].includes(runtimeId)) return "llama.cpp";
  if (runtimeId.startsWith("mlx")) return "mlx";
  return runtimeId;
}

/* ------------------------------------------------------------------ */
/* Full estimate                                                       */
/* ------------------------------------------------------------------ */

export function estimatePerformance(
  c: PerfContext,
  w: ResolvedWorkload,
  match: BenchmarkMatch,
): PerformanceEstimate {
  const { model, runtime } = c;
  // Measured anchor: scale raw estimate so that it reproduces the benchmark exactly.
  let decodeScale = match.decodeFactor;
  let prefillScale = match.prefillFactor;
  if (match.direct) {
    const b = match.direct;
    const benchCtx: PerfContext = { ...c, offloadFraction: Math.max(c.offloadFraction, 0), batteryPenalty: 1 };
    decodeScale = b.generationTps / rawDecodeTps(benchCtx, b.contextTokens + b.outputTokens / 2);
    if (b.prefillTps) prefillScale = b.prefillTps / averagePrefillTps(rawPrefillTps(benchCtx), b.promptTokens, model);
    // Engine wrappers (Ollama, LM Studio…) add small overheads vs bare llama.cpp.
    if (runtime.id !== b.runtimeId) {
      decodeScale *= 0.95;
      prefillScale *= 0.92;
    }
  }

  const decodeAt = (ctx: number) => rawDecodeTps(c, ctx) * decodeScale;
  const basePrefill = rawPrefillTps(c) * prefillScale;

  const genShort = decodeAt(512);
  const genTypical = decodeAt(w.typicalContextTokens);
  const genFull = decodeAt(w.contextWindow * 0.95);

  // Concurrency: batching lets several streams share each weight read.
  const n = w.streams;
  const perStream = genTypical / (1 + (n - 1) * runtime.concurrencyPenalty);
  const aggregate = perStream * n;

  const coldPrefillTps = averagePrefillTps(basePrefill, w.coldPromptTokens, model);
  const coldPromptSec = w.coldPromptTokens / coldPrefillTps + REQUEST_OVERHEAD_SEC;

  // Follow-up turns: new tokens plus any cache misses (tools that rewrite
  // history or runtimes without prefix caching re-process context).
  const cacheMiss = w.typicalContextTokens * (1 - runtime.promptCacheReuse) * w.tool.contextPersistence * 0.3;
  const stepPrompt = w.stepNewTokens + cacheMiss;
  // Concurrent streams also compete for prefill compute.
  const prefillShare = 1 + (n - 1) * Math.max(0.5, runtime.concurrencyPenalty);
  const stepPrefillSec = (stepPrompt / prefillTpsAtDepth(basePrefill, w.typicalContextTokens, model)) * prefillShare;
  const ttft = stepPrefillSec + REQUEST_OVERHEAD_SEC;
  const stepLatency = ttft + w.outputTokens / perStream;
  const taskMinutes = (coldPromptSec + stepLatency * w.callsPerTask) / 60;

  const diskGBs = c.hardware.vendor === "apple" ? 4 : 2.5;
  const loadTimeSec = weightsGB(model, c.quant, c.format) / diskGBs + 2;

  return {
    basis: match.basis,
    basisExplanation: match.explanation,
    generationTpsShort: genShort,
    generationTps: genTypical,
    generationTpsFullContext: genFull,
    perStreamGenerationTps: perStream,
    aggregateGenerationTps: aggregate,
    prefillTps: basePrefill,
    coldPromptSec,
    timeToFirstTokenSec: ttft,
    stepLatencySec: stepLatency,
    taskMinutes,
    loadTimeSec,
    backend: c.backend.api,
    benchmarkIds: match.used.map((b) => b.id),
  };
}
