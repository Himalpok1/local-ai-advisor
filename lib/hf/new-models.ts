import "server-only";
import { HARDWARE_MAP, registerModel } from "@/data";
import { bestQuantFor, candidateQuants } from "@/lib/recommendations";
import type { ComfortLevel } from "@/lib/schemas/results";
import { licenseOpenness, type Openness } from "./licenses";
import { loadHfModel } from "./fetch";

/**
 * Recent releases from labs that publish open-weight LLMs, each rated by the
 * engine on a few reference machines. Built from the public Hub API with a
 * time budget, so a slow Hub never blocks the page: unrated items still show.
 */

/** Organizations whose own repositories we track. Community re-uploads are excluded. */
export const OPEN_MODEL_ORGS = [
  "Qwen",
  "google",
  "meta-llama",
  "mistralai",
  "deepseek-ai",
  "openai",
  "zai-org",
  "microsoft",
  "nvidia",
  "ibm-granite",
  "allenai",
  "HuggingFaceTB",
  "moonshotai",
  "MiniMaxAI",
  "tencent",
  "baidu",
  "XiaomiMiMo",
  "openbmb",
  "LiquidAI",
  "CohereLabs",
  "ServiceNow-AI",
  "stepfun-ai",
  "inclusionAI",
  "arcee-ai",
  "swiss-ai",
];

/** Reference machines for the at-a-glance ratings, smallest first. */
export const REFERENCE_RIGS = [
  { id: "mba-m4-10c-16", label: "16 GB laptop" },
  { id: "pc-rtx-4090-64", label: "24 GB GPU" },
  { id: "mbp-m4-pro-20c-48", label: "48 GB Mac" },
  { id: "strix-halo-395-128", label: "128 GB AI PC" },
] as const;

export interface RigRating {
  label: string;
  level: ComfortLevel;
  tps?: number;
}

export interface NewModel {
  repo: string;
  org: string;
  createdAt: string;
  pipeline: string;
  license?: string;
  openness: Openness;
  /** Billions of parameters from the safetensors index, when published. */
  paramsB?: number;
  gated: boolean;
  downloads: number;
  likes: number;
  /** Fine-tune of another model (base model tag present). */
  baseModel?: string;
  ratings?: RigRating[];
  /** Why it couldn't be rated (gated, unreadable config, …). */
  unrated?: string;
}

const HUB = "https://huggingface.co";
const WINDOW_DAYS = 120;
const MAX_ITEMS = 40;
const MAX_RATED = 24;
const RATE_BUDGET_MS = 25_000;
const TTL_MS = 3 * 60 * 60 * 1000;
const PIPELINES = new Set(["text-generation", "image-text-to-text"]);
/** Re-packaged weights or speculative-decoding drafts of an existing model rather than a new model. */
const DERIVATIVE = /(?:^|[-_.])(GGUF|AWQ|GPTQ|FP8|FP4|NVFP4|MXFP4|INT4|INT8|BF16|W4A16|W8A8|MLX|bnb|EXL2|ONNX|Eagle\d*|MTP|DFlash|DSpark|draft)(?:$|[-_.])/i;

interface HubListing {
  id: string;
  createdAt?: string;
  pipeline_tag?: string;
  cardData?: { license?: string };
  gated?: boolean | string;
  downloads?: number;
  likes?: number;
  safetensors?: { total?: number };
  tags?: string[];
}

function headers(): HeadersInit {
  const token = process.env.HF_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function listOrg(org: string): Promise<HubListing[]> {
  const expand = ["createdAt", "pipeline_tag", "cardData", "gated", "downloads", "likes", "safetensors", "tags"].map((e) => `expand[]=${e}`).join("&");
  try {
    const res = await fetch(`${HUB}/api/models?author=${org}&sort=createdAt&direction=-1&limit=20&${expand}`, { headers: headers(), signal: AbortSignal.timeout(10_000), cache: "no-store" });
    return res.ok ? ((await res.json()) as HubListing[]) : [];
  } catch {
    return [];
  }
}

export function isNewRelease(m: HubListing, now = Date.now()): boolean {
  if (!m.pipeline_tag || !PIPELINES.has(m.pipeline_tag)) return false;
  if (!m.createdAt || now - Date.parse(m.createdAt) > WINDOW_DAYS * 86_400_000) return false;
  if (DERIVATIVE.test(m.id.split("/")[1])) return false;
  if (m.tags?.some((t) => /^base_model:(quantized|adapter):/.test(t))) return false;
  return true;
}

async function rate(item: NewModel): Promise<void> {
  try {
    const parsed = await loadHfModel(item.repo);
    const model = registerModel(parsed.model);
    const quants = candidateQuants(model.id).filter((q) => q !== "fp16");
    item.ratings = REFERENCE_RIGS.map((rig) => {
      const rec = bestQuantFor(
        { hardware: HARDWARE_MAP.get(rig.id)!, modelId: model.id, workload: { useCase: "general-assistant", toolId: "open-webui", devEnv: "normal" } },
        quants.length ? quants : model.supportedQuantizations,
      );
      return { label: rig.label, level: rec.level, tps: rec.memory.fits ? rec.performance?.perStreamGenerationTps : undefined };
    });
  } catch (e) {
    item.unrated = e instanceof Error ? e.message : "Couldn't read this model";
  }
}

async function build(): Promise<NewModel[]> {
  const lists = await Promise.all(OPEN_MODEL_ORGS.map(listOrg));
  const now = Date.now();
  const items: NewModel[] = lists
    .flat()
    .filter((m) => isNewRelease(m, now))
    .sort((a, b) => Date.parse(b.createdAt!) - Date.parse(a.createdAt!))
    .slice(0, MAX_ITEMS)
    .map((m) => ({
      repo: m.id,
      org: m.id.split("/")[0],
      createdAt: m.createdAt!,
      pipeline: m.pipeline_tag!,
      license: m.cardData?.license,
      openness: licenseOpenness(m.cardData?.license),
      paramsB: m.safetensors?.total ? +(m.safetensors.total / 1e9).toFixed(1) : undefined,
      gated: !!m.gated,
      downloads: m.downloads ?? 0,
      likes: m.likes ?? 0,
      baseModel: m.tags?.find((t) => t.startsWith("base_model:finetune:"))?.slice("base_model:finetune:".length),
    }));

  // Rate the newest items within a time budget, three at a time.
  const deadline = Date.now() + RATE_BUDGET_MS;
  const queue = items.slice(0, MAX_RATED);
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      for (let item = queue.shift(); item && Date.now() < deadline; item = queue.shift()) {
        await Promise.race([rate(item), new Promise((r) => setTimeout(r, Math.max(0, deadline - Date.now())))]);
      }
    }),
  );
  return items;
}

let memo: { at: number; value: NewModel[] } | undefined;
let inflight: Promise<NewModel[]> | undefined;

/** Shared by the page and the RSS feed; refreshed at most every few hours per server. */
export function newOpenModels(): Promise<NewModel[]> {
  if (memo && Date.now() - memo.at < TTL_MS) return Promise.resolve(memo.value);
  inflight ??= build()
    .then((value) => {
      if (value.length) memo = { at: Date.now(), value };
      return value;
    })
    .finally(() => (inflight = undefined));
  return inflight;
}
