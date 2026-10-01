/**
 * Compatibility layer: validates each hop of
 *   AI tool → provider API → runtime → model format → hardware backend.
 */
import type {
  AITool,
  BackendSupport,
  CompatibilityRule,
  HardwareConfiguration,
  Model,
  ModelFormat,
  OS,
  Quantization,
  Runtime,
  SupportLevel,
} from "@/lib/schemas";
import type { ToolConnection } from "@/lib/schemas/results";

export const COMPATIBILITY_RULES: CompatibilityRule[] = [
  { id: "os-runtime", layer: "hardware-runtime", severity: "blocker", description: "The runtime must ship for the selected operating system." },
  { id: "apple-only", layer: "hardware-runtime", severity: "blocker", description: "MLX-based runtimes require Apple Silicon." },
  { id: "backend", layer: "hardware-runtime", severity: "warning", description: "If no GPU backend of the runtime matches the hardware, inference falls back to the CPU (much slower)." },
  { id: "format", layer: "runtime-model", severity: "blocker", description: "The runtime must load a format the model is published in (GGUF, MLX, safetensors)." },
  { id: "quant-format", layer: "runtime-model", severity: "blocker", description: "The quantization must exist for that format (e.g. vLLM does not load GGUF Q5_K_M)." },
  { id: "tool-api", layer: "tool-runtime", severity: "blocker", description: "The tool must speak an API the runtime exposes (OpenAI-compatible, Anthropic-compatible or Ollama), possibly through a bridge." },
  { id: "tool-context", layer: "tool-runtime", severity: "warning", description: "Agentic tools need a minimum context window for their system prompt and tool definitions." },
  { id: "vision", layer: "model-usecase", severity: "blocker", description: "Image understanding requires a vision-capable model." },
  { id: "tool-calling", layer: "model-usecase", severity: "warning", description: "Agentic tools need reliable structured tool calling from the model." },
];

const MATURITY_RANK = { mature: 3, good: 2, experimental: 1 } as const;
export const SUPPORT_RANK: Record<SupportLevel, number> = { official: 4, community: 3, bridge: 2, experimental: 1, unsupported: 0 };
export const SUPPORT_LABEL: Record<SupportLevel, string> = {
  official: "Official",
  community: "Community-supported",
  bridge: "Requires bridge",
  experimental: "Experimental",
  unsupported: "Unsupported",
};

export type BackendSelection = { ok: true; backend: BackendSupport; gpuAccelerated: boolean; note?: string } | { ok: false; reason: string };

export function isAppleSilicon(hw: HardwareConfiguration) {
  return hw.vendor === "apple" && hw.cpu.arch === "arm64";
}

export function defaultOs(hw: HardwareConfiguration): OS {
  if (hw.os.includes("macos")) return "macos";
  if (hw.os.includes("windows")) return "windows";
  return hw.os[0];
}

export function selectBackend(hw: HardwareConfiguration, runtime: Runtime, os: OS): BackendSelection {
  if (!hw.os.includes(os)) return { ok: false, reason: `${hw.name} does not run ${osLabel(os)}.` };
  if (runtime.appleSiliconOnly && !isAppleSilicon(hw)) {
    return { ok: false, reason: `${runtime.name} only runs on Apple Silicon Macs.` };
  }
  if (runtime.hardwareVendors && !runtime.hardwareVendors.includes(hw.gpu?.vendor === "amd" ? "amd" : hw.vendor)) {
    return { ok: false, reason: `${runtime.name} targets ${runtime.hardwareVendors.map((v) => v.toUpperCase()).join("/")} hardware only.` };
  }
  const forOs = runtime.backends.filter((b) => b.os.includes(os));
  if (forOs.length === 0) return { ok: false, reason: `${runtime.name} is not available for ${osLabel(os)}.` };

  const gpuApis = new Set(hw.gpu?.apis ?? []);
  const gpuCandidates = forOs
    .filter((b) => b.api !== "cpu" && gpuApis.has(b.api))
    .sort((a, b) => MATURITY_RANK[b.maturity] - MATURITY_RANK[a.maturity] || b.decodeEfficiency - a.decodeEfficiency);
  if (gpuCandidates.length > 0) return { ok: true, backend: gpuCandidates[0], gpuAccelerated: true };

  const cpu = forOs.find((b) => b.api === "cpu");
  if (cpu) {
    return {
      ok: true,
      backend: cpu,
      gpuAccelerated: false,
      note: hw.gpu
        ? `${runtime.name} has no ${osLabel(os)} backend for the ${hw.gpu.name}; it would run on the CPU only.`
        : "No supported GPU — inference runs on the CPU.",
    };
  }
  return { ok: false, reason: `${runtime.name} has no backend for this hardware on ${osLabel(os)}.` };
}

export function selectFormat(runtime: Runtime, backend: BackendSupport, model: Model): ModelFormat | null {
  const engine = backend.engine ?? runtime.engine;
  const preferred: ModelFormat[] = engine === "mlx" ? ["mlx"] : engine === "llama.cpp" ? ["gguf"] : ["safetensors", "gguf"];
  for (const f of preferred) {
    if (runtime.formats.includes(f) && model.supportedFormats.includes(f)) return f;
  }
  return null;
}

export function quantAvailable(quant: Quantization, format: ModelFormat, model: Model): boolean {
  if (!model.supportedQuantizations.includes(quant.id)) return false;
  return quant.bitsPerWeight[format] !== undefined;
}

export function toolConnection(tool: AITool, runtime: Runtime): ToolConnection {
  let best: ToolConnection = {
    level: "unsupported",
    path: `${tool.name} cannot talk to ${runtime.name}.`,
  };
  for (const c of tool.connections) {
    if (c.runtimes && !c.runtimes.includes(runtime.id)) continue;
    let level: SupportLevel = c.level;
    let path: string;
    if (runtime.apis.includes(c.api)) {
      path = `${tool.name} → ${apiLabel(c.api)} → ${runtime.name}`;
    } else if (c.api === "anthropic" && runtime.apis.includes("openai")) {
      // An Anthropic-only tool can reach an OpenAI-compatible server through a proxy.
      level = "bridge";
      path = `${tool.name} → Anthropic API → bridge (e.g. LiteLLM proxy) → OpenAI-compatible API → ${runtime.name}`;
    } else {
      continue;
    }
    if (SUPPORT_RANK[level] > SUPPORT_RANK[best.level]) best = { level, api: c.api, path, note: c.note };
  }
  return best;
}

export function osLabel(os: OS) {
  return os === "macos" ? "macOS" : os === "windows" ? "Windows" : "Linux";
}

export function apiLabel(api: string) {
  return api === "openai" ? "OpenAI-compatible API" : api === "anthropic" ? "Anthropic-compatible API" : "Ollama API";
}

export const BACKEND_LABEL: Record<string, string> = {
  metal: "Metal (Apple GPU)",
  cuda: "CUDA (NVIDIA)",
  rocm: "ROCm (AMD)",
  vulkan: "Vulkan",
  sycl: "SYCL / oneAPI (Intel)",
  cpu: "CPU only",
};
