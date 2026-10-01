import "server-only";
import { HfParseError, parseHfModel, ggufSizes, nonGenerativeReason, normalizeRepo, type HfConfig, type HfFile, type HfModelInfo, type ParsedHfModel } from "./parse";
import { QUANTIZATIONS } from "@/data/quantizations";
import type { QuantId } from "@/lib/schemas";

/** Speculative-decoding drafts and similar companions share the main model's name but are tiny. */
const DRAFT_REPO = /(?:^|[-_.])(DSpark|DFlash|Eagle\d*|MTP|draft|assistant)(?:$|[-_.])/i;

/**
 * A matched conversion is only trusted when its size is plausible for the
 * model's parameter count (0.6–1.5× params × bits-per-weight).
 */
export function plausibleGgufSize(quant: QuantId, bytes: number, paramsB: number): boolean {
  const bpw = QUANTIZATIONS[quant]?.bitsPerWeight.gguf;
  if (!bpw || !paramsB) return true;
  const ratio = bytes / ((paramsB * 1e9 * bpw) / 8);
  return ratio >= 0.6 && ratio <= 1.5;
}

/**
 * Server-side Hugging Face Hub access. The token (HF_TOKEN) never leaves the
 * server; responses are cached in memory to stay well inside rate limits.
 */
const HUB = "https://huggingface.co";
const TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; value: unknown }>();
const inflight = new Map<string, Promise<unknown>>();

export class HfError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function headers(): HeadersInit {
  const token = process.env.HF_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function hubFetch(url: string): Promise<Response> {
  return fetch(url, { headers: headers(), signal: AbortSignal.timeout(12_000), cache: "no-store" });
}

async function cached<T>(key: string, load: () => Promise<T>, ttl = TTL_MS): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.value as T;
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;
  const promise = load().then((value) => {
    cache.set(key, { at: Date.now(), value });
    if (cache.size > 500) cache.delete(cache.keys().next().value!);
    return value;
  }).finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

/** Read small template files without downloading an unbounded response. */
async function smallText(url: string): Promise<string | undefined> {
  try {
    const res = await hubFetch(url);
    if (!res.ok || !res.body) return undefined;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 200_000) return undefined;
        chunks.push(value);
      }
      return Buffer.concat(chunks).toString("utf8");
    } finally { await reader.cancel(); }
  } catch { return undefined; }
}

const EXPAND = ["safetensors", "gguf", "cardData", "pipeline_tag", "gated", "downloads", "likes", "createdAt", "lastModified", "config", "library_name", "tags", "author"];

async function getInfo(repo: string): Promise<HfModelInfo> {
  const res = await hubFetch(`${HUB}/api/models/${repo}?${EXPAND.map((e) => `expand[]=${e}`).join("&")}`);
  if (res.status === 404 || res.status === 401) throw new HfError(`No public model called “${repo}” was found on Hugging Face.`, 404);
  if (!res.ok) throw new HfError(`Hugging Face returned ${res.status} for ${repo}.`, 502);
  return (await res.json()) as HfModelInfo;
}

async function getConfig(repo: string): Promise<HfConfig | null | "gated"> {
  const res = await hubFetch(`${HUB}/${repo}/resolve/main/config.json`);
  if (res.status === 401 || res.status === 403) return "gated";
  if (!res.ok) return null;
  try {
    return (await res.json()) as HfConfig;
  } catch {
    return null;
  }
}

async function getFiles(repo: string): Promise<HfFile[]> {
  return cached(`files:${repo}`, async () => {
    const files: HfFile[] = [];
    let url: string | undefined = `${HUB}/api/models/${repo}/tree/main?recursive=true&limit=1000`;
    for (let page = 0; url && page < 10; page++) {
      const res = await hubFetch(url);
      if (!res.ok) throw new HfError(`Couldn't read files for ${repo}.`, 502);
      const list = (await res.json()) as { type: string; path: string; size?: number; lfs?: { size?: number } }[];
      files.push(...list.filter((f) => f.type === "file").map((f) => ({ path: f.path, size: f.lfs?.size ?? f.size })));
      const next = res.headers.get("link")?.match(/<([^>]+)>;\s*rel="next"/)?.[1];
      url = next && next.startsWith(`${HUB}/api/models/${repo}/tree/`) ? next : undefined;
    }
    if (url) throw new HfError(`File listing for ${repo} is too large to verify completely.`, 502);
    return files;
  }, 24 * 60 * 60 * 1000);
}

/** Find measured GGUF sizes in up to three matching community conversions. */
export async function findGgufVariants(modelName: string): Promise<ReturnType<typeof ggufSizes>> {
  return cached(`variants:${modelName.toLowerCase()}`, async () => {
    try {
      const slug = modelName.split("/").pop()!;
      const res = await hubFetch(`${HUB}/api/models?search=${encodeURIComponent(slug)}&filter=gguf&sort=downloads&direction=-1&limit=20`);
      if (!res.ok) return {};
      const list = await res.json() as HfModelInfo[];
      const preferred = new Set(["unsloth", "bartowski", "lmstudio-community", "ggml-org", "mradermacher"]);
      const candidates = list.filter((m) => normalizeRepo(m.id) === m.id && m.id.split("/")[1].toLowerCase().includes(slug.toLowerCase()) && (DRAFT_REPO.test(slug) || !DRAFT_REPO.test(m.id.split("/")[1])))
        .sort((a, b) => Number(preferred.has(b.id.split("/")[0])) - Number(preferred.has(a.id.split("/")[0])))
        .slice(0, 3);
      const results = await Promise.all(candidates.map(async (m) => {
        try {
          const sizes = ggufSizes(await getFiles(m.id));
          return Object.fromEntries(Object.entries(sizes).map(([q, v]) => [q, { ...v, file: `${m.id}/${v.file}` }]));
        } catch { return {}; }
      }));
      const merged: ReturnType<typeof ggufSizes> = {};
      for (const sizes of results) for (const [q, size] of Object.entries(sizes)) {
        const quant = q as keyof typeof merged;
        if (!merged[quant]) merged[quant] = size;
      }
      return merged;
    } catch { return {}; }
  }, 24 * 60 * 60 * 1000);
}

/** Find an architecture config: the repo itself, its base model, or a public mirror of a gated repo. */
async function resolveConfig(repo: string, info: HfModelInfo): Promise<{ config: HfConfig; source: string } | null> {
  const candidates = [repo];
  const base = info.cardData?.base_model;
  for (const b of Array.isArray(base) ? base : base ? [base] : []) if (typeof b === "string") candidates.push(b);
  const extra: string[] = [];
  for (const c of candidates) {
    const slug = c.split("/")[1];
    extra.push(`unsloth/${slug}`);
    // Early Meta-Llama releases omit the Meta- prefix in public mirrors.
    if (slug.startsWith("Meta-Llama-")) extra.push(`unsloth/${slug.replace(/^Meta-/, "")}`);
  }
  for (const c of [...candidates, ...extra]) {
    if (!/^[\w.-]+\/[\w.-]+$/.test(c)) continue;
    const cfg = await getConfig(c);
    if (cfg && cfg !== "gated" && (cfg.num_hidden_layers || (cfg.text_config as HfConfig | undefined)?.num_hidden_layers)) return { config: cfg, source: c };
  }
  return null;
}

/** Import a generative model; tokens and Hub access remain server-only. */
export async function loadHfModel(repo: string): Promise<ParsedHfModel> {
  if (normalizeRepo(repo) !== repo) throw new HfError("Invalid Hugging Face repository id.", 422);
  return cached(`model:${repo}`, async () => {
    const info = await getInfo(repo);
    const rejection = nonGenerativeReason(info);
    if (rejection) throw new HfError(`${repo} looks like an embedding/reranker model, not a text-generation model (${rejection}). Choose a generative chat or instruct model.`, 422);
    const resolved = await resolveConfig(repo, info);
    if (!resolved) {
      throw new HfError(
        info.gated
          ? `${repo} is gated: its architecture can't be read until access is granted on Hugging Face, and no public mirror was found.`
          : `${repo} has no readable config.json (it may not be a text-generation model).`,
        422,
      );
    }
    const hasTemplate = !!(info.config?.tokenizer_config?.chat_template || info.gguf?.chat_template);
    if (!hasTemplate) {
      let template = await smallText(`${HUB}/${resolved.source}/resolve/main/chat_template.jinja`);
      if (!template) {
        const raw = await smallText(`${HUB}/${resolved.source}/resolve/main/tokenizer_config.json`);
        if (raw) try {
          const tokenizer: unknown = JSON.parse(raw);
          if (tokenizer && typeof tokenizer === "object" && "chat_template" in tokenizer) {
            const t = tokenizer.chat_template;
            if (typeof t === "string") template = t;
            else if (Array.isArray(t)) template = t.flatMap((v: unknown) => v && typeof v === "object" && "template" in v && typeof v.template === "string" ? [v.template] : []).join("\n");
          }
        } catch { /* Optional metadata; missing signals are labelled by the parser. */ }
      }
      if (template) info.config = { ...info.config, tokenizer_config: { ...info.config?.tokenizer_config, chat_template: template } };
    }
    let files: HfFile[] = [];
    let filesUnavailable = false;
    try { files = await getFiles(repo); } catch { filesUnavailable = true; }
    try {
      const parsed = parseHfModel({ repo, info, config: resolved.config, configSource: resolved.source, files });
      if (filesUnavailable) parsed.warnings.push("File listing unavailable; quantization availability and sizes could not be verified (low confidence).");
      if (!parsed.facts.isGgufRepo && !parsed.facts.isMlxRepo) {
        const found = await findGgufVariants(repo);
        const variants = Object.fromEntries(
          Object.entries(found).filter(([q, v]) => plausibleGgufSize(q as QuantId, v.bytes, parsed.model.parameterCount)),
        ) as typeof found;
        const quants = Object.keys(variants) as (keyof typeof variants)[];
        if (quants.length) {
          parsed.model.supportedQuantizations = quants;
          parsed.facts.ggufFiles = variants;
          for (const q of quants) {
            (parsed.model.knownSizesGB ??= {})[q] = variants[q]!.bytes / 1024 ** 3;
            parsed.facts.sizeFormats[q] = "gguf";
            (parsed.model.knownSizeFormats ??= {})[q] = "gguf";
          }
          parsed.warnings = parsed.warnings.filter((w) => !w.startsWith("Assumes GGUF / MLX"));
          parsed.warnings.push("GGUF sizes come from community conversions matched by model name; equivalence and runtime support are not verified. MLX conversion availability is unverified.");
        }
      }
      if (resolved.source !== repo) parsed.warnings.unshift(`Architecture read from ${resolved.source}.`);
      return parsed;
    } catch (e) {
      if (e instanceof HfParseError) throw new HfError(e.message, 422);
      throw e;
    }
  });
}

export interface HfSearchHit {
  id: string;
  downloads?: number;
  likes?: number;
  pipeline_tag?: string;
  gated?: boolean;
  tags?: string[];
}

export async function searchHf(query: string): Promise<HfSearchHit[]> {
  return cached(`search:${query.toLowerCase()}`, async () => {
    const url = `${HUB}/api/models?search=${encodeURIComponent(query)}&sort=downloads&direction=-1&limit=12&filter=text-generation`;
    const url2 = `${HUB}/api/models?search=${encodeURIComponent(query)}&sort=downloads&direction=-1&limit=8&filter=image-text-to-text`;
    const [a, b] = await Promise.all([hubFetch(url), hubFetch(url2)]);
    const list = [...(a.ok ? ((await a.json()) as HfSearchHit[]) : []), ...(b.ok ? ((await b.json()) as HfSearchHit[]) : [])];
    const seen = new Set<string>();
    return list
      .filter((m) => !seen.has(m.id) && seen.add(m.id))
      .sort((x, y) => (y.downloads ?? 0) - (x.downloads ?? 0))
      .slice(0, 12)
      .map((m) => ({ id: m.id, downloads: m.downloads, likes: m.likes, pipeline_tag: m.pipeline_tag, gated: !!m.gated, tags: m.tags }));
  });
}
