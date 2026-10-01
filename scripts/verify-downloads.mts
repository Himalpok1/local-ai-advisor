/**
 * Find real, downloadable builds for every curated model and write data/downloads.ts.
 *
 *   npx tsx scripts/verify-downloads.mts   (token from HF_TOKEN or ~/.config/huggingface/token)
 *
 * For each model it checks well-known GGUF publishers (unsloth, ggml-org,
 * bartowski, lmstudio-community) and MLX publishers, lists the actual files and
 * records which quantization tags exist. Only builds that were found are written,
 * so setup commands never point at a repository that doesn't exist.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { MODELS } from "../data/models";
import type { QuantId } from "../lib/schemas";

const tokenFile = path.join(homedir(), ".config/huggingface/token");
const token = process.env.HF_TOKEN ?? (existsSync(tokenFile) ? readFileSync(tokenFile, "utf8").trim() : undefined);
const H: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
const HUB = "https://huggingface.co";
const today = new Date().toISOString().slice(0, 10);

/** null = the repository doesn't exist. Throws when the Hub keeps failing, so a
 *  rate-limited run can never write "not found" for a build that exists. */
async function get(url: string): Promise<Response | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    let wait = 1000 * 2 ** attempt;
    try {
      const r = await fetch(url, { headers: H, signal: AbortSignal.timeout(20_000) });
      if (r.ok) return r;
      if (r.status !== 429 && r.status < 500) return null;
      // Hub sends `ratelimit: "api";r=0;t=<seconds until reset>`.
      const reset = Number(r.headers.get("ratelimit")?.match(/t=(\d+)/)?.[1]);
      if (r.status === 429 && reset) wait = (reset + 1) * 1000;
    } catch {
      /* retry */
    }
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  throw new Error(`Hugging Face kept failing for ${url}`);
}

async function exists(repo: string): Promise<boolean> {
  return !!(await get(`${HUB}/api/models/${repo}`));
}

interface TreeEntry { type: string; path: string; size?: number; lfs?: { size: number } }

async function tree(repo: string): Promise<TreeEntry[]> {
  const out: TreeEntry[] = [];
  let url: string | undefined = `${HUB}/api/models/${repo}/tree/main?recursive=true&expand=false`;
  while (url) {
    const r = await get(url);
    if (!r) break;
    out.push(...((await r.json()) as TreeEntry[]));
    url = r.headers.get("link")?.match(/<([^>]+)>;\s*rel="next"/)?.[1];
  }
  return out;
}

/** GGUF tag patterns per quant, best first. UD = Unsloth Dynamic variants. */
const GGUF_TAGS: Partial<Record<QuantId, string[]>> = {
  q3: ["Q3_K_M", "UD-Q3_K_XL", "Q3_K_S"],
  q4: ["Q4_K_M", "UD-Q4_K_XL", "Q4_K_S"],
  q5: ["Q5_K_M", "UD-Q5_K_XL", "Q5_K_S"],
  q6: ["Q6_K", "UD-Q6_K_XL"],
  q8: ["Q8_0", "UD-Q8_K_XL"],
  fp16: ["BF16", "F16"],
  // gpt-oss ships MXFP4 natively; unsloth labels that unquantized file "F16".
  mxfp4: ["MXFP4", "F16"],
};

const MLX_SUFFIX: Partial<Record<QuantId, string[]>> = {
  q3: ["3bit"],
  q4: ["4bit"],
  q5: ["5bit"],
  q6: ["6bit"],
  q8: ["8bit"],
  fp16: ["bf16"],
  mxfp4: ["MXFP4-Q8", "MXFP4-Q4", "mxfp4"],
};

export interface GgufBuild { tag: string; sizeGB: number; files: number }

const repoOf = (url: string) => url.match(/huggingface\.co\/([^/]+\/[^/?#]+)/)?.[1];

async function ggufFor(upstream: string, supported: QuantId[]) {
  const name = upstream.split("/")[1];
  const candidates = [`unsloth/${name}-GGUF`, `ggml-org/${name}-GGUF`, `bartowski/${upstream.replace("/", "_")}-GGUF`, `lmstudio-community/${name}-GGUF`];
  for (const repo of candidates) {
    if (!(await exists(repo))) continue;
    const files = (await tree(repo)).filter((f) => f.type === "file" && f.path.endsWith(".gguf") && !/mmproj/i.test(f.path));
    const quants: Partial<Record<QuantId, GgufBuild>> = {};
    for (const [q, tags] of Object.entries(GGUF_TAGS) as [QuantId, string[]][]) {
      if (!supported.includes(q)) continue;
      for (const tag of tags) {
        // The tag must end the file name or name a folder ("…-Q4_K_M.gguf", "…-Q4_K_M-00001-of-00003.gguf",
        // "Q4_K_M/…"), so "Q6_K" never matches "UD-Q6_K_XL" and plain tags never match their "UD-" variants.
        const t = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`(^|[/_.-])(?<!UD-)${t}(\\.gguf$|-\\d{5}-of-\\d{5}\\.gguf$|/)`, "i");
        const hits = files.filter((f) => re.test(f.path));
        if (hits.length) {
          const bytes = hits.reduce((s, f) => s + (f.lfs?.size ?? f.size ?? 0), 0);
          quants[q] = { tag, sizeGB: +(bytes / 1e9).toFixed(2), files: hits.length };
          break;
        }
      }
    }
    if (Object.keys(quants).length) return { repo, quants };
  }
  return undefined;
}

/** One search per publisher instead of one request per candidate name. */
async function listRepos(author: string, search: string): Promise<Set<string>> {
  const r = await get(`${HUB}/api/models?author=${author}&search=${encodeURIComponent(search)}&limit=200`);
  return new Set(r ? ((await r.json()) as { id: string }[]).map((m) => m.id.toLowerCase()) : []);
}

async function mlxFor(upstream: string, supported: QuantId[]) {
  const name = upstream.split("/")[1];
  const [community, lmstudio] = await Promise.all([listRepos("mlx-community", name), listRepos("lmstudio-community", name)]);
  const out: Partial<Record<QuantId, string>> = {};
  for (const [q, suffixes] of Object.entries(MLX_SUFFIX) as [QuantId, string[]][]) {
    if (!supported.includes(q)) continue;
    for (const s of suffixes) {
      const a = `mlx-community/${name}-${s}`;
      const b = `lmstudio-community/${name}-MLX-${s}`;
      const hit = community.has(a.toLowerCase()) ? a : lmstudio.has(b.toLowerCase()) ? b : undefined;
      if (hit) {
        out[q] = hit;
        break;
      }
    }
  }
  return Object.keys(out).length ? out : undefined;
}

const entries: string[] = [];
let i = 0;
async function worker() {
  while (i < MODELS.length) {
    const m = MODELS[i++];
    const upstream = repoOf(m.source.url);
    if (!upstream) continue;
    const [gguf, mlx] = await Promise.all([ggufFor(upstream, m.supportedQuantizations), mlxFor(upstream, m.supportedQuantizations)]);
    console.log(`${m.id}: gguf=${gguf?.repo ?? "—"} [${Object.keys(gguf?.quants ?? {}).join(",")}] mlx=[${Object.keys(mlx ?? {}).join(",")}]`);
    entries.push(`  ${JSON.stringify(m.id)}: ${JSON.stringify({ upstream, gguf, mlx })},`);
  }
}
await Promise.all(Array.from({ length: 3 }, worker));
entries.sort();

writeFileSync(
  path.join(import.meta.dirname, "../data/downloads.ts"),
  `/**
 * Verified download locations for curated models. GENERATED by
 * scripts/verify-downloads.mts on ${today} — re-run it instead of editing by hand.
 *
 * gguf.quants records the tag that actually exists in the repository (unsloth
 * sometimes only publishes "UD-" dynamic variants), its total size and whether
 * it is split across several files.
 */
import type { QuantId } from "@/lib/schemas";

export interface GgufBuild {
  tag: string;
  sizeGB: number;
  files: number;
}

export interface ModelDownloads {
  upstream: string;
  gguf?: { repo: string; quants: Partial<Record<QuantId, GgufBuild>> };
  mlx?: Partial<Record<QuantId, string>>;
}

export const DOWNLOADS_VERIFIED = ${JSON.stringify(today)};

export const DOWNLOADS: Record<string, ModelDownloads> = {
${entries.join("\n")}
};
`,
);
console.log(`wrote data/downloads.ts (${entries.length} models)`);
