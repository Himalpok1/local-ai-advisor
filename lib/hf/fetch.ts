import "server-only";
import { HfParseError, parseHfModel, type HfConfig, type HfFile, type HfModelInfo, type ParsedHfModel } from "./parse";

/**
 * Server-side Hugging Face Hub access. The token (HF_TOKEN) never leaves the
 * server; responses are cached in memory to stay well inside rate limits.
 */
const HUB = "https://huggingface.co";
const TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; value: unknown }>();

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

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as T;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  if (cache.size > 500) cache.delete(cache.keys().next().value!);
  return value;
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
  const res = await hubFetch(`${HUB}/api/models/${repo}/tree/main?recursive=true`);
  if (!res.ok) return [];
  const list = (await res.json()) as { type: string; path: string; size?: number; lfs?: { size?: number } }[];
  return list.filter((f) => f.type === "file").map((f) => ({ path: f.path, size: f.lfs?.size ?? f.size }));
}

/** Find an architecture config: the repo itself, its base model, or a public mirror of a gated repo. */
async function resolveConfig(repo: string, info: HfModelInfo): Promise<{ config: HfConfig; source: string } | null> {
  const candidates = [repo];
  const base = info.cardData?.base_model;
  for (const b of Array.isArray(base) ? base : base ? [base] : []) if (typeof b === "string") candidates.push(b);
  const extra: string[] = [];
  for (const c of candidates) extra.push(`unsloth/${c.split("/")[1]}`);
  for (const c of [...candidates, ...extra]) {
    if (!/^[\w.-]+\/[\w.-]+$/.test(c)) continue;
    const cfg = await getConfig(c);
    if (cfg && cfg !== "gated" && (cfg.num_hidden_layers || (cfg.text_config as HfConfig | undefined)?.num_hidden_layers)) return { config: cfg, source: c };
  }
  return null;
}

export async function loadHfModel(repo: string): Promise<ParsedHfModel> {
  return cached(`model:${repo}`, async () => {
    const info = await getInfo(repo);
    const resolved = await resolveConfig(repo, info);
    if (!resolved) {
      throw new HfError(
        info.gated
          ? `${repo} is gated: its architecture can't be read until access is granted on Hugging Face, and no public mirror was found.`
          : `${repo} has no readable config.json (it may not be a text-generation model).`,
        422,
      );
    }
    // Newer repos ship the chat template as a separate file; it tells us about tool calling.
    const hasTemplate = !!(info.config?.tokenizer_config?.chat_template || info.gguf?.chat_template);
    if (!hasTemplate) {
      const res = await hubFetch(`${HUB}/${resolved.source}/resolve/main/chat_template.jinja`);
      if (res.ok) {
        const template = (await res.text()).slice(0, 200_000);
        info.config = { ...info.config, tokenizer_config: { ...info.config?.tokenizer_config, chat_template: template } };
      }
    }
    const isGguf = !!info.gguf;
    const files = isGguf ? await getFiles(repo) : [];
    try {
      const parsed = parseHfModel({ repo, info, config: resolved.config, configSource: resolved.source, files });
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
      .map((m) => ({ id: m.id, downloads: m.downloads, likes: m.likes, pipeline_tag: m.pipeline_tag }));
  });
}
