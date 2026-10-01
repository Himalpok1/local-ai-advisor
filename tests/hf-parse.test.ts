import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ggufSizes, normalizeRepo, parseHfModel, type HfConfig } from "@/lib/hf/parse";
import { getModel } from "@/data";
import { kvBytesPerToken, kvCacheGB } from "@/lib/memory";

const fixture = (repo: string): HfConfig => JSON.parse(readFileSync(path.join(__dirname, "fixtures/hf", `${repo.replace("/", "__")}.config.json`), "utf8"));

// Exact safetensors totals as reported by the Hub API.
const TOTALS: Record<string, number> = {
  "Qwen/Qwen3-8B": 8_190_735_360,
  "Qwen/Qwen3-Coder-30B-A3B-Instruct": 30_532_122_624,
  "Qwen/Qwen3.6-27B": 27_781_427_952,
  "Qwen/Qwen3.6-35B-A3B": 35_951_822_704,
  "zai-org/GLM-4.7-Flash": 31_221_488_576,
  "google/gemma-4-31B-it": 31_273_088_876,
  "openai/gpt-oss-20b": 20_914_757_184,
  "mistralai/Mistral-Small-4-119B-2603": 119_401_317_952,
};

const parse = (repo: string, extra: Partial<Parameters<typeof parseHfModel>[0]["info"]> = {}) =>
  parseHfModel({ repo, info: { id: repo, safetensors: { total: TOTALS[repo] }, ...extra }, config: fixture(repo), today: "2026-10-01" });

/** Hub import vs. the hand-curated catalog entry for the same model. */
const PAIRS: [string, string][] = [
  ["Qwen/Qwen3-8B", "qwen3-8b"],
  ["Qwen/Qwen3-Coder-30B-A3B-Instruct", "qwen3-coder-30b-a3b"],
  ["Qwen/Qwen3.6-27B", "qwen3.6-27b"],
  ["Qwen/Qwen3.6-35B-A3B", "qwen3.6-35b-a3b"],
  ["zai-org/GLM-4.7-Flash", "glm-4.7-flash"],
  ["google/gemma-4-31B-it", "gemma-4-31b"],
  ["openai/gpt-oss-20b", "gpt-oss-20b"],
  ["mistralai/Mistral-Small-4-119B-2603", "mistral-small-4"],
];

describe("Hugging Face import", () => {
  it.each(PAIRS)("%s matches the curated KV-cache and size data", (repo, curatedId) => {
    const { model } = parse(repo);
    const curated = getModel(curatedId);
    expect(model.parameterCount).toBeCloseTo(curated.parameterCount, 0);
    expect(kvBytesPerToken(model)).toBeCloseTo(kvBytesPerToken(curated), -2);
    expect(kvCacheGB(model, 32768, 1, "f16")).toBeCloseTo(kvCacheGB(curated, 32768, 1, "f16"), 1);
    expect(model.denseOrMoE).toBe(curated.denseOrMoE);
    expect(model.vision).toBe(curated.vision);
  });

  it("estimates active parameters for MoE models from the expert layout", () => {
    expect(parse("Qwen/Qwen3-Coder-30B-A3B-Instruct").model.activeParameterCount).toBeCloseTo(3.3, 0);
    expect(parse("Qwen/Qwen3.6-35B-A3B").model.activeParameterCount).toBeLessThan(4.5);
    expect(parse("openai/gpt-oss-20b").model.activeParameterCount).toBeLessThan(5);
    expect(parse("Qwen/Qwen3-8B").model.activeParameterCount).toBe(parse("Qwen/Qwen3-8B").model.parameterCount);
  });

  it("detects attention layouts", () => {
    expect(parse("Qwen/Qwen3.6-27B").facts.attention).toBe("hybrid-linear");
    expect(parse("google/gemma-4-31B-it").facts.attention).toBe("sliding-window");
    expect(parse("zai-org/GLM-4.7-Flash").facts.attention).toBe("mla");
    expect(parse("Qwen/Qwen3-8B").facts.attention).toBe("full");
  });

  it("keeps natively-MXFP4 models at MXFP4", () => {
    expect(parse("openai/gpt-oss-20b").model.supportedQuantizations).toEqual(["mxfp4"]);
  });

  it("flags capability ratings as estimates and never stores a comfort rating", () => {
    const r = parse("Qwen/Qwen3-8B");
    expect(r.warnings.join(" ")).toMatch(/estimated/i);
    expect(r.model.id).toBe("hf:Qwen/Qwen3-8B");
    for (const k of ["level", "rating", "comfort"]) expect(r.model).not.toHaveProperty(k);
  });

  it("reads GGUF quant sizes, summing split shards and ignoring mmproj/imatrix", () => {
    const sizes = ggufSizes([
      { path: "Model-Q4_K_M.gguf", size: 16_000_000_000 },
      { path: "Model-UD-Q4_K_XL.gguf", size: 17_000_000_000 },
      { path: "BF16/Model-BF16-00001-of-00002.gguf", size: 40_000_000_000 },
      { path: "BF16/Model-BF16-00002-of-00002.gguf", size: 10_000_000_000 },
      { path: "mmproj-F16.gguf", size: 900_000_000 },
      { path: "Model-Q8_0.gguf", size: 29_000_000_000 },
    ]);
    expect(sizes.q4?.bytes).toBe(16_000_000_000);
    expect(sizes.fp16?.bytes).toBe(50_000_000_000);
    expect(sizes.q8?.bytes).toBe(29_000_000_000);
    expect(sizes.q3).toBeUndefined();
  });

  it("normalizes repo input and rejects junk", () => {
    expect(normalizeRepo("https://huggingface.co/Qwen/Qwen3-8B/tree/main")).toBe("Qwen/Qwen3-8B");
    expect(normalizeRepo("hf:openai/gpt-oss-20b")).toBe("openai/gpt-oss-20b");
    expect(normalizeRepo("../../etc/passwd")).toBeNull();
    expect(normalizeRepo("nope")).toBeNull();
  });
});
