/**
 * Turn Hugging Face Hub metadata + config.json into the engine's Model schema.
 *
 * Exact facts (parameter count, layers, KV heads, attention layout, context,
 * file sizes) come from the Hub. Capability tiers cannot be read from a config,
 * so they are ESTIMATED from model size and naming and flagged as such.
 */
import { ModelSchema, type Model, type ModelInput, type QuantId } from "@/lib/schemas";

export const HF_REPO_RE = /^[A-Za-z0-9][\w.-]{0,95}\/[\w.-]{1,96}$/;
export const HF_ID_PREFIX = "hf:";

export interface HfModelInfo {
  id: string;
  author?: string;
  pipeline_tag?: string;
  library_name?: string;
  tags?: string[];
  gated?: boolean | string;
  downloads?: number;
  likes?: number;
  createdAt?: string;
  lastModified?: string;
  cardData?: { license?: string; base_model?: string | string[]; pipeline_tag?: string };
  safetensors?: { total?: number; parameters?: Record<string, number> };
  gguf?: { total?: number; architecture?: string; context_length?: number; chat_template?: string };
  config?: { architectures?: string[]; model_type?: string; tokenizer_config?: { chat_template?: string | { template: string }[] } };
}

export interface HfFile {
  path: string;
  size?: number;
}

/** Raw config.json — loosely typed because every architecture differs. */
export type HfConfig = Record<string, unknown>;

export interface HfFacts {
  repo: string;
  configSource?: string;
  attention: "full" | "sliding-window" | "hybrid-linear" | "mla";
  layers: number;
  kvHeads: number;
  headDim: number;
  fullAttentionLayers: number;
  experts?: { total: number; active: number };
  parametersExact: boolean;
  activeParametersEstimated: boolean;
  ggufFiles: Partial<Record<QuantId, { file: string; bytes: number }>>;
  downloads?: number;
  likes?: number;
  gated: boolean;
  pipelineTag?: string;
  isGgufRepo: boolean;
  isMlxRepo: boolean;
}

export interface ParsedHfModel {
  model: Model;
  facts: HfFacts;
  warnings: string[];
}

const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const GiB = 1024 ** 3;

/** Quantization name patterns in GGUF filenames, best match first. */
const GGUF_PATTERNS: [QuantId, RegExp[]][] = [
  ["q3", [/(^|[-_.])Q3_K_M\b/i, /Q3_K_XL/i, /Q3_K_S/i, /IQ3_(M|S|XS)/i]],
  ["q4", [/(^|[-_.])Q4_K_M\b/i, /Q4_K_XL/i, /Q4_K_S/i, /(^|[-_.])Q4_0\b/i, /IQ4_(NL|XS)/i]],
  ["q5", [/(^|[-_.])Q5_K_M\b/i, /Q5_K_XL/i, /Q5_K_S/i]],
  ["q6", [/(^|[-_.])Q6_K\b(?!_)/i, /Q6_K_(M|L|XL)/i]],
  ["q8", [/(^|[-_.])Q8_0\b/i, /Q8_K_(L|XL)/i]],
  ["fp16", [/(^|[-_.])BF16\b/i, /(^|[-_.])F16\b/i]],
  ["mxfp4", [/MXFP4/i]],
];

/** Group split GGUF shards (…-00001-of-00003.gguf) and sum their sizes per quant. */
export function ggufSizes(files: HfFile[]): Partial<Record<QuantId, { file: string; bytes: number }>> {
  const groups = new Map<string, number>();
  for (const f of files) {
    if (!f.path.toLowerCase().endsWith(".gguf")) continue;
    if (/mmproj|imatrix|(^|\/)mtp[-/]/i.test(f.path)) continue;
    const key = f.path.replace(/-\d{5}-of-\d{5}\.gguf$/i, ".gguf");
    groups.set(key, (groups.get(key) ?? 0) + (f.size ?? 0));
  }
  const out: Partial<Record<QuantId, { file: string; bytes: number }>> = {};
  for (const [quant, patterns] of GGUF_PATTERNS) {
    for (const re of patterns) {
      const hit = [...groups.entries()].find(([name, size]) => size > 0 && re.test(name.split("/").pop()!));
      if (hit) {
        out[quant] = { file: hit[0], bytes: hit[1] };
        break;
      }
    }
  }
  return out;
}

function chatTemplate(info: HfModelInfo): string {
  const t = info.config?.tokenizer_config?.chat_template ?? info.gguf?.chat_template;
  if (!t) return "";
  return typeof t === "string" ? t : t.map((x) => x.template).join("\n");
}

/** Rough parameter count from architecture when the Hub doesn't report one. */
function estimateParams(tc: HfConfig, layers: number, hidden: number, heads: number, kvHeads: number, headDim: number): number {
  const vocab = num(tc.vocab_size) ?? 32000;
  const inter = num(tc.intermediate_size) ?? hidden * 4;
  const attn = hidden * headDim * (heads + 2 * kvHeads) + heads * headDim * hidden;
  const experts = num(tc.num_experts) ?? num(tc.num_local_experts) ?? num(tc.n_routed_experts);
  const moeInter = num(tc.moe_intermediate_size) ?? inter;
  const mlp = experts ? experts * 3 * hidden * moeInter : 3 * hidden * inter;
  const emb = vocab * hidden * (tc.tie_word_embeddings ? 1 : 2);
  return layers * (attn + mlp) + emb;
}

export function parseHfModel(args: { repo: string; info: HfModelInfo; config?: HfConfig; configSource?: string; files?: HfFile[]; today?: string }): ParsedHfModel {
  const { repo, info } = args;
  const warnings: string[] = [];
  const config = args.config ?? {};
  const tc = ((config.text_config as HfConfig | undefined) ?? config) as HfConfig;
  const today = args.today ?? new Date().toISOString().slice(0, 10);
  const isGgufRepo = !!info.gguf || (args.files ?? []).some((f) => f.path.endsWith(".gguf"));
  const isMlxRepo = info.library_name === "mlx" || (info.tags ?? []).includes("mlx");

  const layers = num(tc.num_hidden_layers) ?? num(tc.n_layer) ?? num(tc.num_layers);
  if (!layers) throw new HfParseError(`Couldn't read the architecture of ${repo} (no num_hidden_layers in config.json).`);
  const hidden = num(tc.hidden_size) ?? num(tc.d_model) ?? 4096;
  const heads = num(tc.num_attention_heads) ?? 32;
  const kvHeads = num(tc.num_key_value_heads) ?? heads;
  const headDim = num(tc.head_dim) ?? Math.round(hidden / heads);

  // ---- Attention layout → KV cache size ----
  const layerTypes = Array.isArray(tc.layer_types) ? (tc.layer_types as string[]) : undefined;
  let full = layers;
  let sliding = 0;
  let linear = 0;
  if (layerTypes) {
    full = layerTypes.filter((t) => t === "full_attention" || t === "attention" || t === "global_attention").length;
    sliding = layerTypes.filter((t) => /sliding|chunked|local/.test(t)).length;
    linear = layerTypes.filter((t) => /linear|mamba|ssm|recurrent|delta/.test(t)).length;
  } else if (num(tc.full_attention_interval)) {
    full = Math.ceil(layers / num(tc.full_attention_interval)!);
    linear = layers - full;
  } else if (num(tc.sliding_window_pattern) && num(tc.sliding_window)) {
    full = Math.floor(layers / num(tc.sliding_window_pattern)!);
    sliding = layers - full;
  } else if (num(tc.sliding_window) && tc.use_sliding_window !== false && !num(tc.kv_lora_rank)) {
    // Every layer is windowed (e.g. original Mistral 7B).
    sliding = layers;
    full = 0;
  }
  const window = num(tc.sliding_window);
  const kvLora = num(tc.kv_lora_rank);
  let kvOverride: number | undefined;
  let slidingOverride: number | undefined;
  let attention: HfFacts["attention"] = linear > 0 ? "hybrid-linear" : sliding > 0 ? "sliding-window" : "full";
  if (kvLora) {
    attention = "mla";
    kvOverride = layers * (kvLora + (num(tc.qk_rope_head_dim) ?? 64)) * 2;
    full = layers;
  } else if (num(tc.global_head_dim) || num(tc.num_global_key_value_heads)) {
    const gKv = num(tc.num_global_key_value_heads) ?? kvHeads;
    const gHd = num(tc.global_head_dim) ?? headDim;
    kvOverride = 2 * Math.max(full, 1) * gKv * gHd * 2;
    slidingOverride = sliding ? 2 * sliding * kvHeads * headDim * 2 : undefined;
  }
  if (num(tc.index_head_dim) || num(tc.compress_ratios)) {
    warnings.push("Uses a compressed / sparse attention scheme; KV-cache size is approximate.");
  }
  const fullAttentionFraction = Math.min(1, full / layers);

  // ---- Parameters ----
  let total = info.safetensors?.total ?? info.gguf?.total;
  const parametersExact = !!total;
  if (!total) {
    total = estimateParams(tc, layers, hidden, heads, kvHeads, headDim);
    warnings.push("Parameter count estimated from the architecture (the Hub reports none for this repo).");
  }
  const E = num(tc.num_experts) ?? num(tc.num_local_experts) ?? num(tc.n_routed_experts);
  const k = num(tc.num_experts_per_tok) ?? num(tc.experts_per_token) ?? num(tc.top_k_experts) ?? num(tc.moe_topk);
  let active = total;
  let experts: HfFacts["experts"];
  if (E && k && E > 1) {
    const moeInter = num(tc.moe_intermediate_size) ?? num(tc.expert_intermediate_size) ?? num(tc.intermediate_size) ?? hidden * 2;
    const moeLayers = layers - (num(tc.first_k_dense_replace) ?? 0);
    const inactive = moeLayers * (E - k) * 3 * hidden * moeInter;
    // The input embedding table is only indexed, not read in full, per token.
    const inputEmbedding = (num(tc.vocab_size) ?? 0) * hidden;
    active = Math.max(total * 0.04, total - inactive - inputEmbedding);
    experts = { total: E, active: k };
  }

  // ---- Quantizations & formats ----
  const files = args.files ?? [];
  const sizes = ggufSizes(files);
  const nativeMxfp4 = (config.quantization_config as { quant_method?: string } | undefined)?.quant_method === "mxfp4";
  let supportedQuantizations: QuantId[];
  if (isGgufRepo && Object.keys(sizes).length) {
    supportedQuantizations = Object.keys(sizes) as QuantId[];
  } else if (nativeMxfp4) {
    supportedQuantizations = ["mxfp4"];
  } else {
    supportedQuantizations = ["q3", "q4", "q5", "q6", "q8", "fp16"];
  }
  const knownSizesGB: Partial<Record<QuantId, number>> = {};
  for (const [q, v] of Object.entries(sizes)) knownSizesGB[q as QuantId] = +(v!.bytes / GiB).toFixed(2);
  const supportedFormats: ModelInput["supportedFormats"] = isGgufRepo ? ["gguf"] : isMlxRepo ? ["mlx"] : ["safetensors", "gguf", "mlx"];
  if (!isGgufRepo && !isMlxRepo) warnings.push("Assumes GGUF / MLX conversions of this model exist (they do for most popular models). Sizes are computed from bits per weight.");

  // ---- Capabilities (estimated) ----
  const name = repo.split("/")[1];
  const lname = repo.toLowerCase();
  const template = chatTemplate(info);
  const toolCalling = /\btools?\b|tool_call|function_call|\bfunctions\b|<\|tool/i.test(template) ? "good" : "basic";
  const thinking = /enable_thinking|<think>|reasoning_effort|thinking/i.test(template) || /reason|thinking|-r1/i.test(lname);
  const pEff = Math.sqrt(total * active) / 1e9;
  const base = Math.min(4.2, Math.max(1.2, 1.1 + 0.55 * Math.log2(Math.max(0.5, pEff))));
  const isCoder = /coder|code|devstral|starcoder|codestral/.test(lname);
  const isReasoner = thinking;
  const vision = !!config.vision_config || info.pipeline_tag === "image-text-to-text" || (info.tags ?? []).includes("image-text-to-text");
  const contextWindow = num(tc.max_position_embeddings) ?? info.gguf?.context_length ?? 8192;
  warnings.push("Capability ratings are estimated from model size and name — this model hasn't been assessed by hand.");
  if (toolCalling === "basic" && template) warnings.push("The chat template doesn't mention tools, so tool calling is assumed to be limited.");

  const lic = info.cardData?.license;
  const model = ModelSchema.parse({
    id: `${HF_ID_PREFIX}${repo}`,
    organization: info.author ?? repo.split("/")[0],
    family: (config.model_type as string | undefined) ?? info.gguf?.architecture ?? name,
    name,
    variant: isGgufRepo ? "GGUF" : isMlxRepo ? "MLX" : undefined,
    parameterCount: +(total / 1e9).toFixed(2),
    activeParameterCount: +(active / 1e9).toFixed(2),
    denseOrMoE: experts ? "moe" : "dense",
    contextWindow: Math.min(contextWindow, 2_097_152),
    modelType: isCoder ? "coder" : vision ? "vision" : isReasoner ? "reasoning" : "general",
    useCases: [isCoder ? "coding" : "chat", ...(vision ? ["vision"] : [])],
    capabilities: {
      general: +base.toFixed(2),
      coding: +Math.min(4.5, base + (isCoder ? 0.4 : -0.1)).toFixed(2),
      reasoning: +Math.min(4.5, base + (isReasoner ? 0.3 : 0)).toFixed(2),
      agentic: +Math.min(4.5, base + (isCoder ? 0.2 : -0.2) + (toolCalling === "good" ? 0 : -0.4)).toFixed(2),
      longContext: +Math.min(4.5, base + (contextWindow >= 131072 ? 0.1 : -0.4)).toFixed(2),
      writing: +Math.min(4.5, base - (isCoder ? 0.4 : 0)).toFixed(2),
    },
    toolCalling,
    vision,
    thinking,
    architecture: {
      layers,
      kvHeads: kvLora ? 1 : kvHeads,
      headDim,
      fullAttentionFraction,
      slidingWindow: sliding > 0 ? window : undefined,
      kvBytesPerTokenOverride: kvOverride,
      slidingKvBytesPerToken: slidingOverride,
    },
    supportedQuantizations,
    supportedFormats,
    knownSizesGB: Object.keys(knownSizesGB).length ? knownSizesGB : undefined,
    license: lic ?? "See model card",
    releaseDate: (info.createdAt ?? today).slice(0, 7),
    notes: `Imported live from Hugging Face (${repo}).`,
    source: {
      url: `https://huggingface.co/${repo}`,
      title: `${repo} — Hugging Face`,
      lastVerified: today,
      confidence: parametersExact ? "medium" : "low",
      note: "Architecture read from config.json; capability tiers estimated.",
    },
  });

  return {
    model,
    warnings,
    facts: {
      repo,
      configSource: args.configSource,
      attention,
      layers,
      kvHeads,
      headDim,
      fullAttentionLayers: full,
      experts,
      parametersExact,
      activeParametersEstimated: !!experts,
      ggufFiles: sizes,
      downloads: info.downloads,
      likes: info.likes,
      gated: !!info.gated,
      pipelineTag: info.pipeline_tag,
      isGgufRepo,
      isMlxRepo,
    },
  };
}

export class HfParseError extends Error {}

/** Accept "owner/name", "hf:owner/name" or a full huggingface.co URL. */
export function normalizeRepo(input: string): string | null {
  let s = input.trim();
  s = s.replace(/^hf:/, "").replace(/^https?:\/\/(www\.)?huggingface\.co\//, "").replace(/^models\//, "");
  s = s.split(/[?#]/)[0].split("/").slice(0, 2).join("/");
  return HF_REPO_RE.test(s) ? s : null;
}
