/**
 * Memory engine: estimates what an inference setup needs and what the machine
 * can actually give it. All values are GiB, labelled "GB" in the UI as
 * operating systems do.
 *
 * Unified memory (Apple Silicon, Ryzen AI Max, DGX Spark) is ONE pool shared by
 * OS, apps and GPU — with a GPU wired-memory cap. Discrete GPUs have TWO pools
 * (VRAM and system RAM) that are never treated as interchangeable: weights that
 * spill out of VRAM run at system-RAM speed.
 */
import type {
  AITool,
  HardwareConfiguration,
  KvCacheType,
  Model,
  ModelFormat,
  OS,
  Quantization,
  Runtime,
} from "@/lib/schemas";
import type { MemoryBreakdown } from "@/lib/schemas/results";

const GiB = 1024 ** 3;

export const KV_TYPE_FACTOR: Record<KvCacheType, number> = { f16: 1, q8: 0.53, q4: 0.28 };

/** Bytes per weight for a model at a quantization, honouring published file sizes. */
export function weightsGB(model: Model, quant: Quantization, format: ModelFormat): number {
  // Legacy curated sizes are GGUF; imported measurements carry their actual format.
  const known = model.knownSizesGB?.[quant.id];
  if (known && (model.knownSizeFormats?.[quant.id] ? model.knownSizeFormats[quant.id] === format : (format === "gguf" || quant.id === "mxfp4"))) return known;
  const bpw = quant.bitsPerWeight[format] ?? quant.bitsPerWeight.gguf ?? 16;
  // Embeddings / norms are often kept at higher precision: +2% for small models.
  const extra = model.parameterCount < 10 ? 1.03 : 1.01;
  return (model.parameterCount * 1e9 * bpw * extra) / 8 / GiB;
}

/** Bytes per token of the *active* weights read during decode (MoE reads only active experts). */
export function activeWeightsGB(model: Model, quant: Quantization, format: ModelFormat): number {
  const total = weightsGB(model, quant, format);
  if (model.denseOrMoE === "dense") return total;
  // Shared attention/embedding weights are always read; experts proportionally.
  return total * Math.min(1, model.activeParameterCount / model.parameterCount);
}

/** KV cache bytes per token of context at FP16, excluding sliding-window constant. */
export function kvBytesPerToken(model: Model): number {
  const a = model.architecture;
  if (a.kvBytesPerTokenOverride) return a.kvBytesPerTokenOverride;
  return 2 * a.layers * a.kvHeads * a.headDim * 2 * a.fullAttentionFraction;
}

/** Constant KV for sliding-window layers (bytes), independent of context length. */
function slidingKvBytes(model: Model, context: number): number {
  const a = model.architecture;
  if (a.fullAttentionFraction >= 1 || !a.slidingWindow) return 0;
  const window = Math.min(context, a.slidingWindow);
  if (a.slidingKvBytesPerToken) return a.slidingKvBytesPerToken * window;
  return 2 * a.layers * (1 - a.fullAttentionFraction) * a.kvHeads * a.headDim * 2 * window;
}

export function kvCacheGB(model: Model, context: number, streams: number, kvType: KvCacheType): number {
  const perStream = kvBytesPerToken(model) * context + slidingKvBytes(model, context);
  return (perStream * streams * KV_TYPE_FACTOR[kvType]) / GiB;
}

export function runtimeOverheadGB(model: Model, runtime: Runtime, context: number, batchSize: number, streams: number): number {
  const compute = 0.15 + model.activeParameterCount * 0.018 + (context / 65536) * 0.35;
  const batch = Math.max(0.5, batchSize / 512);
  return runtime.baseOverheadGB + compute * batch + (streams - 1) * 0.05;
}

export function toolOverheadGB(tool: AITool): number {
  switch (tool.category) {
    case "coding-agent":
      return 0.6;
    case "ide-agent":
    case "ide-assistant":
      return 0.4;
    case "chat-ui":
      return 1.0;
    case "runtime-app":
      return 0.6;
    case "automation":
      return 0.3;
    default:
      return 0;
  }
}

export function defaultOsReserveGB(hw: HardwareConfiguration, os: OS): number {
  const ram = hw.systemRamGB;
  if (os === "macos") return Math.min(6, Math.max(3.5, ram * 0.1));
  if (os === "windows") return Math.min(8, Math.max(4.5, ram * 0.12));
  return Math.min(4, Math.max(2, ram * 0.05));
}

export function visionEncoderGB(model: Model, needed: boolean): number {
  if (!model.vision || !needed) return 0;
  return Math.min(2, Math.max(0.4, model.parameterCount * 0.03));
}

export interface MemoryInput {
  hardware: HardwareConfiguration;
  model: Model;
  quant: Quantization;
  format: ModelFormat;
  runtime: Runtime;
  tool: AITool;
  os: OS;
  context: number;
  streams: number;
  kvCacheType: KvCacheType;
  devEnvGB: number;
  osReserveGB?: number;
  raiseGpuMemoryLimit: boolean;
  gpuOffload?: number;
  batchSize: number;
  visionNeeded: boolean;
}

export interface MemoryResult extends MemoryBreakdown {
  gpuResidentGB: number;
  cpuResidentGB: number;
  /** Fraction of decode bytes served from GPU memory. */
  offloadFraction: number;
  vramHeadroomGB?: number;
  ramHeadroomGB: number;
}

export function estimateMemory(i: MemoryInput): MemoryResult {
  const hw = i.hardware;
  const kvType = i.runtime.supportsKvQuant ? i.kvCacheType : "f16";
  const notes: string[] = [];
  if (kvType !== i.kvCacheType) notes.push(`${i.runtime.name} does not support KV-cache quantization; FP16 KV assumed.`);

  const weights = weightsGB(i.model, i.quant, i.format);
  const kv = kvCacheGB(i.model, i.context, i.streams, kvType);
  const overhead = runtimeOverheadGB(i.model, i.runtime, i.context, i.batchSize, i.streams);
  const vision = visionEncoderGB(i.model, i.visionNeeded);
  const osReserve = i.osReserveGB ?? defaultOsReserveGB(hw, i.os);
  const toolGB = toolOverheadGB(i.tool);
  const inferencePeak = weights + kv + overhead + vision;
  const ram = hw.systemRamGB;
  const systemAvailable = Math.max(0, ram - osReserve - i.devEnvGB - toolGB);

  const base = {
    installedGB: ram,
    osReserveGB: osReserve,
    devEnvReserveGB: i.devEnvGB,
    toolOverheadGB: toolGB,
    runtimeOverheadGB: overhead,
    weightsGB: weights,
    kvCacheGB: kv,
    visionEncoderGB: vision,
    inferencePeakGB: inferencePeak,
    estimatedPeakGB: osReserve + i.devEnvGB + toolGB + inferencePeak,
  };

  if (hw.memoryArchitecture === "unified" && hw.gpu) {
    const frac = i.raiseGpuMemoryLimit ? (hw.gpuMemoryFractionRaised ?? 0.9) : (hw.gpuMemoryFraction ?? 0.75);
    const gpuLimit = ram * frac;
    const gpuBudget = Math.min(gpuLimit, systemAvailable);
    const fits = inferencePeak <= systemAvailable + compressibleGB(i.devEnvGB);
    if (fits && inferencePeak > systemAvailable) {
      notes.push("Only fits by pushing other applications into compressed memory / swap — expect the rest of the system to slow down.");
    }
    let offload = 1;
    if (inferencePeak > gpuLimit) {
      offload = Math.max(0, (gpuLimit - overhead) / Math.max(0.01, weights + kv));
      notes.push(
        `Needs ${inferencePeak.toFixed(1)} GB but the default GPU memory limit is ~${gpuLimit.toFixed(0)} GB. ` +
          (hw.vendor === "apple"
            ? "Raising the limit (sudo sysctl iogpu.wired_limit_mb) lets the GPU use more of the unified memory."
            : "Raise the GPU memory allocation (BIOS / GTT settings) to keep everything on the GPU."),
      );
    }
    if (typeof i.gpuOffload === "number") offload = Math.min(offload, i.gpuOffload);
    const headroom = systemAvailable - inferencePeak;
    return {
      ...base,
      architecture: "unified",
      availableForInferenceGB: systemAvailable,
      gpuLimitGB: gpuLimit,
      headroomGB: headroom,
      headroomFraction: headroom / ram,
      gpuOffloadFraction: Math.min(1, offload),
      offloadFraction: Math.min(1, offload),
      gpuResidentGB: Math.min(inferencePeak, gpuBudget),
      cpuResidentGB: Math.max(0, inferencePeak - gpuBudget),
      ramHeadroomGB: headroom,
      fits,
      notes,
    };
  }

  if (hw.memoryArchitecture === "discrete" && hw.gpu?.vramGB) {
    const vram = hw.gpu.vramGB;
    const vramUsable = Math.max(0, vram - (hw.gpu.laptop || i.os === "windows" ? 1.0 : 0.6));
    const gpuData = weights + kv + vision;
    const maxFrac = Math.max(0, Math.min(1, (vramUsable - overhead) / gpuData));
    let f = maxFrac;
    if (typeof i.gpuOffload === "number") f = Math.min(maxFrac, i.gpuOffload);
    const gpuResident = f * gpuData + overhead;
    // Spilled layers live in system RAM; CPU also needs a working buffer.
    const cpuResident = (1 - f) * gpuData + (f < 1 ? 0.5 : 0);
    const ramHeadroom = systemAvailable - cpuResident;
    const vramHeadroom = vramUsable - gpuResident;
    const fits = gpuResident <= vramUsable + 1e-6 && cpuResident <= systemAvailable + compressibleGB(i.devEnvGB);
    if (f < 0.999 && fits) {
      notes.push(
        `Only ${Math.round(f * 100)}% of the model fits in ${vram} GB of VRAM; the rest runs from system RAM, which is much slower.`,
      );
    }
    // VRAM is dedicated to inference (other apps barely use it), so its free space counts
    // for more; RAM headroom is shared with everything else you run.
    const vramFracScore = Math.max(0, vramHeadroom) / vram;
    const ramFrac = ramHeadroom / ram;
    const headroomFraction = f >= 0.999 ? Math.min(ramFrac + 0.15, 0.1 + vramFracScore * 1.8) : Math.min(ramFrac, vramFracScore + 0.05);
    return {
      ...base,
      architecture: "discrete",
      vramGB: vram,
      installedGB: ram,
      estimatedPeakGB: osReserve + i.devEnvGB + toolGB + cpuResident,
      availableForInferenceGB: vramUsable + systemAvailable,
      gpuLimitGB: vramUsable,
      headroomGB: f >= 0.999 ? vramHeadroom : Math.min(vramHeadroom, ramHeadroom),
      headroomFraction,
      gpuOffloadFraction: f,
      offloadFraction: f,
      gpuResidentGB: gpuResident,
      cpuResidentGB: cpuResident,
      vramHeadroomGB: vramHeadroom,
      ramHeadroomGB: ramHeadroom,
      fits,
      notes,
    };
  }

  // CPU-only (or integrated GPU without useful acceleration)
  const headroom = systemAvailable - inferencePeak;
  return {
    ...base,
    architecture: hw.memoryArchitecture,
    availableForInferenceGB: systemAvailable,
    headroomGB: headroom,
    headroomFraction: headroom / ram,
    gpuOffloadFraction: 0,
    offloadFraction: 0,
    gpuResidentGB: 0,
    cpuResidentGB: inferencePeak,
    ramHeadroomGB: headroom,
    fits: inferencePeak <= systemAvailable + compressibleGB(i.devEnvGB),
    notes,
  };
}

/**
 * Other applications' memory can be partly compressed or swapped out, so a
 * model may still load when it slightly exceeds the "free" estimate — at the
 * cost of a sluggish system (reflected as zero/negative headroom).
 */
function compressibleGB(devEnvGB: number): number {
  return devEnvGB * 0.25;
}
