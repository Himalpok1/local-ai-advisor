/**
 * Shared logic for the static "Can I run X on Y?" pages. Every verdict comes
 * from the same engine as the interactive tools; nothing here is hand-written.
 */
import { HARDWARE, MODELS, MODEL_MAP } from "@/data";
import type { HardwareConfiguration, Model, WorkloadProfileInput } from "@/lib/schemas";
import { COMFORT_RANK, type ComfortLevel, type Recommendation } from "@/lib/schemas/results";
import { bestQuantFor, candidateQuants, recommendModels } from "@/lib/recommendations";
import { fmtTps } from "@/lib/format";
import { encodeState } from "@/lib/share";
import { hardwareSlug } from "@/lib/slugs";

export { hardwareSlug };

export interface WorkloadPreset {
  key: string;
  label: string;
  /** Lower-case phrase for sentences ("for agentic coding"). */
  phrase: string;
  workload: WorkloadProfileInput;
}

/** The everyday workloads each page rates, lightest first. */
export const WORKLOADS: WorkloadPreset[] = [
  { key: "chat", label: "Chat", phrase: "chat", workload: { useCase: "casual-chat", toolId: "open-webui", devEnv: "normal" } },
  { key: "coding", label: "Coding questions", phrase: "coding questions", workload: { useCase: "coding-questions", toolId: "continue", devEnv: "normal" } },
  { key: "repo", label: "Coding in a repository", phrase: "coding in a repository", workload: { useCase: "coding-repo", toolId: "aider", repositorySize: "medium", devEnv: "normal" } },
  { key: "agent", label: "Agentic coding", phrase: "agentic coding", workload: { useCase: "agentic-coding", toolId: "opencode", repositorySize: "medium", devEnv: "normal" } },
  { key: "docs", label: "Long documents (64K)", phrase: "64K-token documents", workload: { useCase: "long-doc-qa", toolId: "open-webui", desiredContextWindow: 65536, devEnv: "normal" } },
];

export const CHAT = WORKLOADS[0];
export const AGENT = WORKLOADS[3];

/** Popular machines pre-rendered at build time; every other pair renders on first visit. */
export const FEATURED_HARDWARE_IDS = [
  "mba-m4-10c-16",
  "mba-m5-10c-24",
  "mbp-m4-pro-20c-24",
  "mbp-m4-pro-20c-48",
  "mbp-m4-max-40c-128",
  "mbp-m5-pro-20c-48",
  "mini-m4-10c-16",
  "mini-m4-pro-20c-64",
  "studio-m4-max-40c-128",
  "studio-m3-ultra-80c-512",
  "pc-rtx-3060-12-32",
  "pc-rtx-3090-64",
  "pc-rtx-4060-ti-16-32",
  "pc-rtx-4090-64",
  "pc-rtx-5090-64",
  "pc-rx-7900-xtx-64",
  "laptop-rtx-4060-laptop-32",
  "strix-halo-395-128",
  "dgx-spark-128",
];

/* ------------------------------------------------------------------ */
/* Slugs                                                               */
/* ------------------------------------------------------------------ */

const BY_SLUG = new Map(HARDWARE.map((h) => [hardwareSlug(h), h]));

export function hardwareBySlug(slug: string): HardwareConfiguration | undefined {
  return BY_SLUG.get(slug);
}

/** Curated, recommendable models only (no imported or reference models). */
export function modelBySlug(slug: string): Model | undefined {
  const m = MODEL_MAP.get(slug);
  return m && !m.referenceOnly && !m.id.startsWith("hf:") ? m : undefined;
}

export const canIRunHref = (m: Model, h: HardwareConfiguration) => `/can-i-run/${m.id}/${hardwareSlug(h)}`;
export const modelHref = (m: Model) => `/can-i-run/${m.id}`;
export const hardwareHref = (h: HardwareConfiguration) => `/what-runs-on/${hardwareSlug(h)}`;

/* ------------------------------------------------------------------ */
/* Evaluation                                                          */
/* ------------------------------------------------------------------ */

/** Best quantization for this workload (FP16 excluded: it's never the practical pick). */
export function rate(model: Model, hardware: HardwareConfiguration, preset: WorkloadPreset): Recommendation {
  const quants = candidateQuants(model.id).filter((q) => q !== "fp16");
  return bestQuantFor({ hardware, modelId: model.id, workload: preset.workload }, quants.length ? quants : candidateQuants(model.id));
}

export const usable = (l: ComfortLevel) => COMFORT_RANK[l] >= COMFORT_RANK.acceptable;
export const blocked = (l: ComfortLevel) => l === "does-not-fit" || l === "unsupported";

/** One-line answer, e.g. "Yes: comfortable for chat, borderline for agentic coding". */
export function shortAnswer(results: { preset: WorkloadPreset; rec: Recommendation }[]): { yes: boolean | "partly"; text: string } {
  const chat = results.find((r) => r.preset.key === "chat")!.rec;
  if (blocked(chat.level)) return { yes: false, text: chat.level === "unsupported" ? "No. This combination isn't supported" : "No. It doesn't fit in memory" };
  const best = results.filter((r) => usable(r.rec.level));
  const worst = [...results].sort((a, b) => COMFORT_RANK[a.rec.level] - COMFORT_RANK[b.rec.level])[0];
  if (!best.length) return { yes: "partly", text: `It loads, but it's ${chat.level === "borderline" ? "borderline" : "too slow"} even for chat` };
  const lead = `${COMFORT_LABEL_LOWER[chat.level]} for chat`;
  if (!usable(worst.rec.level)) return { yes: "partly", text: `Yes, ${lead}; ${COMFORT_LABEL_LOWER[worst.rec.level]} for ${worst.preset.phrase}` };
  return { yes: true, text: `Yes, ${lead} and ${COMFORT_LABEL_LOWER[worst.rec.level]} or better for every workload we test` };
}

const COMFORT_LABEL_LOWER: Record<ComfortLevel, string> = {
  excellent: "excellent",
  comfortable: "comfortable",
  acceptable: "acceptable",
  borderline: "borderline",
  "technically-runs": "too slow",
  "does-not-fit": "doesn't fit",
  unsupported: "unsupported",
};

/** Link into the interactive evaluation with the same inputs. */
export function evaluateHref(rec: Recommendation, preset: WorkloadPreset): string {
  return `/evaluate?${encodeState({ hardwareId: rec.hardware.id, modelId: rec.model.id, quant: rec.quant.id, workload: preset.workload })}`;
}

/** Models a page can link to, newest first. */
export function catalogModels(): Model[] {
  return [...MODELS].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate) || a.name.localeCompare(b.name));
}

/** Short memory description ("48 GB unified", "24 GB VRAM + 64 GB RAM"). */
export function memoryLine(h: HardwareConfiguration): string {
  if (h.memoryArchitecture === "discrete") return `${h.gpu?.vramGB} GB VRAM + ${h.systemRamGB} GB RAM`;
  if (h.memoryArchitecture === "unified") return `${h.systemRamGB} GB unified`;
  return `${h.systemRamGB} GB RAM, no GPU`;
}

/** Group label for hardware lists. */
export function hardwareGroup(h: HardwareConfiguration): string {
  if (h.vendor === "apple") return h.device;
  if (h.formFactor === "laptop") return "Laptops";
  if (h.memoryArchitecture === "unified") return "Unified-memory PCs";
  if (h.memoryArchitecture === "cpu-only") return "CPU only";
  return h.vendor === "nvidia" ? "NVIDIA desktops" : h.vendor === "amd" ? "AMD desktops" : "Intel desktops";
}

/* ------------------------------------------------------------------ */
/* Homepage "popular rigs" (engine-derived, never hand-written)        */
/* ------------------------------------------------------------------ */

export interface RigPick {
  model: string;
  href: string;
  level: ComfortLevel;
  quant: string;
  speed: string;
}

export interface RigSummary {
  id: string;
  name: string;
  href: string;
  checkHref: string;
  memory: string;
  price?: number;
  usableForChat: number;
  total: number;
  chat?: RigPick;
  agent?: RigPick;
}

function pick(rec: Recommendation | undefined): RigPick | undefined {
  if (!rec || !usable(rec.level)) return undefined;
  const p = rec.performance;
  return {
    model: rec.model.name,
    href: canIRunHref(rec.model, rec.hardware),
    level: rec.level,
    quant: rec.quant.formatNames[rec.format] ?? rec.quant.label,
    speed: p ? fmtTps(p.perStreamGenerationTps, p.basis) : "—",
  };
}

/** Best chat and agentic-coding picks for a machine, straight from the engine. */
export function rigSummary(hardware: HardwareConfiguration): RigSummary {
  const chat = recommendModels({ hardware, workload: CHAT.workload });
  const agent = recommendModels({ hardware, workload: AGENT.workload });
  return {
    id: hardware.id,
    name: hardware.name,
    href: hardwareHref(hardware),
    checkHref: `/check?hw=${hardware.id}`,
    memory: `${memoryLine(hardware)} · ${hardware.gpu ? hardware.gpu.bandwidthGBs : hardware.systemRamBandwidthGBs} GB/s`,
    price: hardware.approxPriceUSD,
    usableForChat: chat.all.filter((r) => usable(r.level)).length,
    total: chat.all.length,
    chat: pick(chat.picks.recommended),
    agent: pick(agent.picks.recommended),
  };
}
