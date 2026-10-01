import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ggufSizes, normalizeRepo, parseHfModel, type HfConfig, type HfModelInfo } from "@/lib/hf/parse";
import { licenseUse } from "@/lib/hf/licenses";
import { readHfState } from "@/lib/hf/state";
import { rateLimited } from "@/lib/rate-limit";
import { QUANTIZATIONS } from "@/data/quantizations";
import { weightsGB } from "@/lib/memory";

vi.mock("server-only", () => ({}));
const fixture = (name: string): HfConfig => JSON.parse(readFileSync(path.join(__dirname, "fixtures/hf", `${name}.config.json`), "utf8"));
const config = fixture("Qwen__Qwen3-8B");
const info: HfModelInfo = { id: "test/model", safetensors: { total: 8_190_735_360 }, cardData: { license: "apache-2.0" } };
const parse = (extra: Partial<Parameters<typeof parseHfModel>[0]> = {}) => parseHfModel({ repo: "test/model", info, config, ...extra });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("HF parser hardening", () => {
  it.each([
    ["openai__gpt-oss-20b", 4096, 131072],
    ["deepseek-ai__DeepSeek-V4-Flash", 65536, 1048576],
  ])("splits native and extended context: %s", (name, native, extended) => {
    const parsed = parse({ config: fixture(String(name)) });
    expect(parsed.model.contextWindow).toBe(native);
    expect(parsed.facts.extendedContext).toBe(extended);
    expect(parsed.warnings.join(" ")).toMatch(/rope-extended/);
  });
  it("leaves unscaled context alone and flags missing native metadata", () => {
    expect(parse({ config: { ...config, rope_scaling: null } }).facts.extendedContext).toBeUndefined();
    const parsed = parse({ config: { ...config, rope_scaling: { type: "yarn", factor: 4 } } });
    expect(parsed.warnings.join(" ")).toMatch(/native context cannot/);
  });
  it.each([
    ["apache-2.0", "yes"], [" MIT ", "yes"], ["license:BSD-3-Clause", "yes"],
    ["llama2", "conditional"], ["llama3", "conditional"], ["llama4", "conditional"],
    ["gemma", "conditional"], ["gemma-terms-of-use", "conditional"],
    ["bigcode-openrail-m", "conditional"], ["openrail", "conditional"],
    ["cc-by-nc-4.0", "no"], ["cc-by-nc-sa-4.0", "no"], ["cc-nc-custom", "no"],
    ["mystery", "unknown"], [undefined, "unknown"],
  ])("maps commercial use for %s", (id, commercial) => expect(licenseUse(id).commercial).toBe(commercial));
  it("warns on unknown licenses", () => {
    const parsed = parse({ info: { ...info, cardData: {} } });
    expect(parsed.facts.commercialUse.note).toBe("Check the model card");
    expect(parsed.warnings.join(" ")).toMatch(/Commercial use unknown/);
  });
  it("treats safetensors.total as parameters, and uses real FP16 files for exact bytes", () => {
    expect(parse().model.knownSizesGB?.fp16).toBeUndefined();
    const parsed = parse({ config: { ...config, torch_dtype: "bfloat16" }, files: [{ path: "model-00001-of-00002.safetensors", size: 8_000_000_000 }, { path: "model-00002-of-00002.safetensors", size: 7_000_000_000 }] });
    expect(parsed.model.knownSizesGB?.fp16).toBe(15_000_000_000 / 1024 ** 3);
    expect(weightsGB(parsed.model, QUANTIZATIONS.fp16, "safetensors")).toBe(15_000_000_000 / 1024 ** 3);
    expect(weightsGB(parsed.model, QUANTIZATIONS.fp16, "gguf")).not.toBe(15_000_000_000 / 1024 ** 3);
    expect(parsed.model.parameterCount).toBe(8.19);
  });
  it("tracks template signals and explicit absence", () => {
    const withTemplate = parse({ info: { ...info, config: { tokenizer_config: { chat_template: "{% if tools %}<think>" } } } });
    expect(withTemplate.facts.signals.toolCalling).toEqual({ value: "good", signal: "chat-template" });
    expect(withTemplate.facts.signals.thinking.signal).toBe("chat-template");
    expect(parse().facts.signals.toolCalling).toEqual({ value: "basic", signal: "none" });
    expect(parse().warnings.join(" ")).toMatch(/No chat template/);
  });
  it.each(["QwQ-32B", "T1-7B", "R1-Distill-Qwen-7B"])("recognizes thinking name %s", (name) => {
    expect(parse({ repo: `test/${name}` }).facts.signals.thinking.signal).toBe("model-name");
    expect(parse({ repo: "test/part1base" }).model.thinking).toBe(false);
  });
  it("detects vision config keys and projector files", () => {
    expect(parse({ config: { ...config, image_token_index: 0 } }).model.vision).toBe(true);
    expect(parse({ files: [{ path: "mmproj-F16.gguf", size: 1 }] }).facts.signals.vision).toEqual({ value: "good", signal: "config" });
  });
  it("does not label incomplete shards as measured weights", () => {
    expect(ggufSizes([{ path: "model-Q4_K_M-00001-of-00002.gguf", size: 100 }])).toEqual({});
    expect(ggufSizes([{ path: "model-Q4_K_M-00001-of-00002.gguf", size: 100 }, { path: "model-Q4_K_M-00002-of-00002.gguf" }])).toEqual({});
    expect(parse({ config: { ...config, torch_dtype: "float16" }, files: [{ path: "model-00001-of-00002.safetensors", size: 100 }] }).model.knownSizesGB?.fp16).toBeUndefined();
  });
  it("separates FP8 and Q8 filenames and detects native FP8", () => {
    const sizes = ggufSizes([{ path: "model-FP8.gguf", size: 100 }, { path: "model-Q8_0.gguf", size: 200 }]);
    expect(sizes.fp8?.bytes).toBe(100); expect(sizes.q8?.bytes).toBe(200);
    expect(parse({ config: { ...config, quantization_config: { quant_method: "fp8" } } }).model.supportedQuantizations).toEqual(["fp8"]);
  });
  it.each([
    ["https://huggingface.co/Qwen/Qwen3-8B/blob/main/config.json", "Qwen/Qwen3-8B"],
    ["Qwen/Qwen3-8B/", "Qwen/Qwen3-8B"], ["hf:Qwen/Qwen3-8B", "Qwen/Qwen3-8B"],
    ["invalid", null], ["https://evil.test/a/b", null], ["../../secret", null], ["", null],
  ])("normalizes %s", (input, expected) => expect(normalizeRepo(input)).toBe(expected));
});

describe("Hub access", () => {
  it("refuses non-generative metadata with a helpful 422 before fetching config", async () => {
    vi.resetModules();
    const fetch = vi.fn().mockImplementation(async () => Response.json({ id: "test/embedding", pipeline_tag: "sentence-similarity" }));
    vi.stubGlobal("fetch", fetch);
    const { loadHfModel, HfError } = await import("@/lib/hf/fetch");
    await expect(loadHfModel("test/embedding")).rejects.toMatchObject({ status: 422, message: expect.stringContaining("embedding/reranker") });
    await expect(loadHfModel("test/embedding")).rejects.toBeInstanceOf(HfError);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("surfaces refusal through the API error contract", async () => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ id: "test/reranker", pipeline_tag: "text-classification" })));
    const { GET } = await import("@/app/api/hf/model/route");
    const response = await GET(new Request("http://localhost/api/hf/model?repo=test/reranker"));
    expect(response.status).toBe(422);
    expect((await response.json()).error).toMatch(/text-classification/);
  });
  it("merges real GGUF sizes, prefers known publishers and deduplicates simultaneous calls", async () => {
    vi.resetModules();
    const fetch = vi.fn(async (url: string) => {
      if (url.includes("?search=")) return Response.json([{ id: "other/Model-X-GGUF" }, { id: "bartowski/Model-X-GGUF" }, { id: "other/Unrelated-GGUF" }]);
      if (url.includes("bartowski")) return Response.json([{ type: "file", path: "Model-X-Q4_K_M.gguf", size: 4_000_000_000 }]);
      return Response.json([{ type: "file", path: "Model-X-Q5_K_M.gguf", size: 5_000_000_000 }, { type: "file", path: "Model-X-Q4_K_M.gguf", size: 99 }]);
    });
    vi.stubGlobal("fetch", fetch);
    const { findGgufVariants } = await import("@/lib/hf/fetch");
    const [a, b] = await Promise.all([findGgufVariants("test/Model-X"), findGgufVariants("test/Model-X")]);
    expect(a).toEqual(b);
    expect(a.q4?.bytes).toBe(4_000_000_000); expect(a.q5?.bytes).toBe(5_000_000_000);
    expect(a.q4?.file).toContain("bartowski/");
    expect(fetch).toHaveBeenCalledTimes(3);
    await findGgufVariants("test/Model-X");
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it("silently falls back after search failure without fetching candidates", async () => {
    vi.resetModules();
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
    vi.stubGlobal("fetch", fetch);
    const { findGgufVariants } = await import("@/lib/hf/fetch");
    expect(await findGgufVariants("test/Fail")).toEqual({}); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("loads tokenizer_config fallback and attaches measured community quant sizes", async () => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("?expand")) return Response.json(info);
      if (url.endsWith("/config.json")) return Response.json(config);
      if (url.endsWith("chat_template.jinja")) return new Response(null, { status: 404 });
      if (url.endsWith("tokenizer_config.json")) return Response.json({ chat_template: "tools function_call" });
      if (url.includes("?search=")) return Response.json([{ id: "bartowski/model-GGUF" }]);
      if (url.includes("bartowski")) return Response.json([{ type: "file", path: "model-Q4_K_M.gguf", size: 5_027_782_016 }]);
      return Response.json([]);
    }));
    const { loadHfModel } = await import("@/lib/hf/fetch");
    const parsed = await loadHfModel("test/model");
    expect(parsed.facts.signals.toolCalling.signal).toBe("chat-template");
    expect(parsed.model.supportedQuantizations).toEqual(["q4"]);
    expect(parsed.model.knownSizesGB?.q4).toBe(5_027_782_016 / 1024 ** 3);
    expect(parsed.warnings.join(" ")).not.toContain("Assumes GGUF / MLX");
  });
});

it("resets a fixed rate-limit window exactly at its boundary", () => {
  vi.useFakeTimers(); vi.setSystemTime(1000);
  expect(rateLimited("hf-reset-test", 1, 100)).toBe(false);
  expect(rateLimited("hf-reset-test", 1, 100)).toBe(true);
  vi.setSystemTime(1100);
  expect(rateLimited("hf-reset-test", 1, 100)).toBe(false);
});
it("validates persisted hardware and workload without browser globals", () => {
  const saved = { hardwareId: "mbp-m4-pro-20c-48", workload: { useCase: "coding-repo", toolId: "aider" } };
  expect(readHfState(JSON.stringify(saved))?.hardwareId).toBe(saved.hardwareId);
  expect(readHfState(JSON.stringify({ ...saved, hardwareId: "missing" }))).toBeUndefined();
  expect(readHfState(JSON.stringify({ ...saved, workload: {} }))).toBeUndefined();
  expect(readHfState("broken json")).toBeUndefined(); expect(readHfState(null)).toBeUndefined();
});

describe("plausibleGgufSize", () => {
  it("rejects a tiny draft model matched to a large model's name", async () => {
    const { plausibleGgufSize } = await import("@/lib/hf/fetch");
    // 311B at Q8 is ~330 GB; a 2.7 GB file is a speculative-decoding draft, not this model.
    expect(plausibleGgufSize("q8", 2.7e9, 311)).toBe(false);
    expect(plausibleGgufSize("q4", 5.0e9, 8.2)).toBe(true);
    expect(plausibleGgufSize("q4", 20e9, 8.2)).toBe(false);
  });
});
