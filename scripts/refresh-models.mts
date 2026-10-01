/**
 * Check every curated model against Hugging Face and list popular models we don't cover yet.
 *
 *   npm run refresh:models            (token from HF_TOKEN or ~/.config/huggingface/token)
 *
 * Writes research/model-refresh-YYYY-MM-DD.md. It never edits data/models.ts —
 * curated entries are reviewed by hand.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { MODELS } from "../data/models";
import { parseHfModel, type HfConfig, type HfModelInfo } from "../lib/hf/parse";
import { kvBytesPerToken } from "../lib/memory";

const tokenFile = path.join(homedir(), ".config/huggingface/token");
const token = process.env.HF_TOKEN ?? (existsSync(tokenFile) ? readFileSync(tokenFile, "utf8").trim() : undefined);
const H: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
const HUB = "https://huggingface.co";
const today = new Date().toISOString().slice(0, 10);

async function json<T>(url: string): Promise<T | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { headers: H, signal: AbortSignal.timeout(20_000) });
      if (r.ok) return await r.json() as T;
      if (r.status !== 429 && r.status < 500) return null;
      if (attempt < 2) {
        const retry = Number(r.headers.get("retry-after"));
        await new Promise((resolve) => setTimeout(resolve, Math.min(30_000, Math.max(1000 * 2 ** attempt, retry * 1000 || 0))));
      }
    } catch {
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
    }
  }
  return null;
}

const repoOf = (url: string) => url.match(/huggingface\.co\/([^/]+\/[^/?#]+)/)?.[1];
const pct = (a: number, b: number) => Math.abs(a - b) / Math.max(1e-9, Math.abs(b));

// Workers write per-model slots so network completion order cannot reorder the report.
const results: { rows: string[]; issues: string[] }[] = [];
async function compare(m: (typeof MODELS)[number], index: number) {
  const rows: string[] = [];
  const issues: string[] = [];
  results[index] = { rows, issues };
  const repo = repoOf(m.source.url);
  if (!repo) {
    rows.push(`| ${m.name} | — | no Hugging Face source | |`);
    return;
  }
  const info = await json<HfModelInfo>(`${HUB}/api/models/${repo}?expand[]=safetensors&expand[]=cardData&expand[]=config&expand[]=pipeline_tag&expand[]=downloads&expand[]=gated`);
  const config = await json<HfConfig>(`${HUB}/${repo}/resolve/main/config.json`);
  if (!info || !config) {
    rows.push(`| ${m.name} | ${repo} | ⚠ couldn't read (gated or moved) | |`);
    issues.push(`${m.name}: couldn't read ${repo}`);
    return;
  }
  try {
    const { model: hub, facts } = parseHfModel({ repo, info, config, today });
    const diffs: string[] = [];
    if (pct(hub.parameterCount, m.parameterCount) > 0.03) diffs.push(`params ${m.parameterCount}B → ${hub.parameterCount}B`);
    if (pct(kvBytesPerToken(hub), kvBytesPerToken(m)) > 0.1 && !m.architecture.kvBytesPerTokenOverride) diffs.push(`KV ${Math.round(kvBytesPerToken(m) / 1024)}→${Math.round(kvBytesPerToken(hub) / 1024)} KB/token`);
    if (hub.vision !== m.vision) diffs.push(`vision ${m.vision}→${hub.vision}`);
    if (hub.contextWindow !== m.contextWindow) diffs.push(`config native ${hub.contextWindow}${facts.extendedContext ? `, rope-extended ${facts.extendedContext}` : ""} (catalog ${m.contextWindow})`);
    rows.push(`| ${m.name} | ${repo} | ${diffs.length ? "⚠ " + diffs.join("; ") : "✓ matches"} | ${info.downloads?.toLocaleString("en-US") ?? ""} |`);
    if (diffs.length) issues.push(`${m.name}: ${diffs.join("; ")}`);
  } catch (e) {
    issues.push(`${m.name}: parse error`);
    rows.push(`| ${m.name} | ${repo} | ⚠ parse error: ${(e as Error).message} | |`);
  }
}

let nextIndex = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (nextIndex < MODELS.length) {
    const index = nextIndex++;
    await compare(MODELS[index], index);
  }
}));
const rows = results.flatMap((r) => r.rows);
const issues = results.flatMap((r) => r.issues);

// Popular models not yet in the catalog
const known = new Set(MODELS.map((m) => repoOf(m.source.url)?.toLowerCase().split("/")[1]));
const trending = (await json<{ id: string; downloads?: number; likes?: number }[]>(`${HUB}/api/models?filter=text-generation&sort=trendingScore&direction=-1&limit=60`)) ?? [];
const fresh = trending
  .filter((t) => !known.has(t.id.split("/")[1].toLowerCase()))
  // Skip quantized re-uploads and uncensored/merged fine-tunes; keep well-adopted releases.
  .filter((t) => !/gguf|mlx|awq|gptq|bnb|exl|-4bit|-8bit|abliterat|obliterat|uncensor|heretic|merge/i.test(t.id) && (t.downloads ?? 0) >= 25_000)
  .sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0))
  .slice(0, 15);

const report = `# Model catalog refresh — ${today}

Compared ${MODELS.length} curated models with their Hugging Face config.json. ${issues.length} need a look.

| Model | Repo | Result | Downloads |
|---|---|---|---|
${rows.join("\n")}

## Trending text-generation models not in the catalog

${fresh.map((t) => `- [${t.id}](https://huggingface.co/${t.id}) — ${t.downloads?.toLocaleString("en-US") ?? "?"} downloads, ${t.likes ?? 0} likes`).join("\n")}

_Generated by scripts/refresh-models.mts. Review before editing data/models.ts._
`;
const out = path.join("research", `model-refresh-${today}.md`);
writeFileSync(out, report);
console.log(`${issues.length} issue(s). Report: ${out}`);
for (const i of issues) console.log(" -", i);
