import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import path from "node:path";
import { chatEligibility } from "@/lib/hf/eligibility";
import { parseHfModel, type HfConfig, type HfModelInfo } from "@/lib/hf/parse";

vi.mock("server-only", () => ({}));
const fixture = (name: string): HfConfig => JSON.parse(readFileSync(path.join(__dirname, "fixtures/hf", `${name}.config.json`), "utf8"));
const causal = fixture("Qwen__Qwen3-8B");
const decision = fixture("LiquidAI__d1-omni-600M");
const chat: HfModelInfo = { id: "test/Chat", pipeline_tag: "text-generation", safetensors: { total: 8_190_735_360 }, config: { tokenizer_config: { chat_template: "messages user assistant" } } };
afterEach(() => { vi.unstubAllGlobals(); });

// Captured public config: https://huggingface.co/LiquidAI/d1-omni-600M/resolve/main/config.json (2026-10-10).
describe("conversational eligibility", () => {
  it("rejects the real decision model even with a vision pipeline and a chat template", () => {
    const info = { ...chat, id: "LiquidAI/d1-omni-600M", pipeline_tag: "image-text-to-text" };
    expect(chatEligibility(info, decision)).toMatchObject({ status: "unsupported", reason: expect.stringContaining("decision/classification") });
    expect(() => parseHfModel({ repo: info.id, info, config: decision })).toThrow(/No conversational comfort or generation-speed estimate/);
  });
  it.each([
    ["embedding", { ...chat, pipeline_tag: "feature-extraction" }, causal],
    ["reranker", { ...chat, id: "test/Reranker-Instruct" }, causal],
    ["encoder", chat, { ...causal, architectures: ["BertModel"], model_type: "bert" }],
    ["classification head", chat, { ...causal, architectures: ["Qwen3ForSequenceClassification"] }],
    ["OCR", { ...chat, id: "test/OCR-Chat", pipeline_tag: "image-text-to-text" }, causal],
    ["document parser", { ...chat, id: "test/Youtu-Parsing-Omni", pipeline_tag: "image-text-to-text" }, causal],
    ["diffusion", { ...chat, library_name: "diffusers" }, causal],
    ["image pipeline", { ...chat, pipeline_tag: "text-to-image" }, causal],
    ["base", { ...chat, id: "test/Model-Base" }, causal],
    ["reward", { ...chat, id: "test/Reward-Chat" }, causal],
    ["seq2seq", chat, { ...causal, is_encoder_decoder: true }],
    ["conflicting pipeline", { ...chat, cardData: { pipeline_tag: "text-classification" } }, causal],
  ] satisfies [string, HfModelInfo, HfConfig][])("does not let %s reach model registration", (_label, info, config) => {
    expect(chatEligibility(info, config).status).toBe("unsupported");
    expect(() => parseHfModel({ repo: info.id, info, config })).toThrow(/cannot be rated for general chat/);
  });
  it("requires generation evidence and rejects a nested text backbone as proof", () => {
    const config = { architectures: ["SpecialModel"], text_config: causal };
    expect(chatEligibility(chat, config).status).toBe("uncertain");
    expect(chatEligibility({ ...chat, config: { architectures: ["SpecialModel"] } }, causal).status).toBe("uncertain");
    expect(chatEligibility(chat, { num_hidden_layers: 32 }).status).toBe("uncertain");
    expect(chatEligibility(chat, { ...causal, architectures: ["UnknownForConditionalGeneration"] }).status).toBe("uncertain");
    expect(chatEligibility({ ...chat, config: { ...chat.config, architectures: ["Qwen3ForCausalLM"] } }, config).status).toBe("uncertain");
  });
  it("requires conversational evidence even for a causal generator", () => {
    expect(chatEligibility({ id: "test/Model", pipeline_tag: "text-generation" }, causal).status).toBe("uncertain");
    expect(chatEligibility({ id: "test/Model-Instruct" }, causal).status).toBe("supported");
    expect(chatEligibility({ id: "test/Model", tags: ["conversational"] }, causal).status).toBe("supported");
  });
  it("keeps supported vision-language models and dense/MoE chat models working", () => {
    for (const name of ["Qwen__Qwen3-8B", "Qwen__Qwen3-Coder-30B-A3B-Instruct", "google__gemma-4-31B-it", "mistralai__Mistral-Small-4-119B-2603", "openai__gpt-oss-20b"]) {
      const config = fixture(name);
      expect(chatEligibility(chat, config).status).toBe("supported");
      expect(parseHfModel({ repo: chat.id, info: chat, config }).model.parameterCount).toBeGreaterThan(0);
    }
  });
  it("handles missing and malformed optional template/architecture signals without trusting them", () => {
    const info = { ...chat, id: "test/Model", config: { architectures: [42], tokenizer_config: { chat_template: [{ template: 42 }, null] } } } as unknown as HfModelInfo;
    expect(chatEligibility(info, {}).status).toBe("uncertain");
    expect(chatEligibility({ ...chat, id: "test/Model", config: undefined, gguf: { architecture: "llama", chat_template: "user assistant" } }).status).toBe("supported");
    expect(chatEligibility({ ...chat, gguf: { architecture: "mystery" } }).status).toBe("uncertain");
  });
});

function mockHub(info: HfModelInfo, config: HfConfig, template?: string) {
  const fetch = vi.fn(async (url: string) => {
    if (url.includes("?expand")) return Response.json(info);
    if (url.endsWith("/config.json")) return Response.json(config);
    if (url.endsWith("chat_template.jinja") && template) return new Response(template);
    if (url.endsWith("chat_template.jinja") || url.endsWith("tokenizer_config.json")) return new Response(null, { status: 404 });
    return Response.json([]);
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

describe("shared import boundary", () => {
  it("returns a helpful 422 through the model API, with no model or performance payload", async () => {
    vi.resetModules();
    mockHub({ ...chat, id: "LiquidAI/d1-omni-600M", pipeline_tag: "image-text-to-text" }, decision);
    const { GET } = await import("@/app/api/hf/model/route");
    const response = await GET(new Request("http://localhost/api/hf/model?repo=LiquidAI/d1-omni-600M"));
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toMatch(/decision\/classification/);
    expect(body).not.toHaveProperty("model");
    expect(body).not.toHaveProperty("performance");
  });
  it("shows an unrated feed item and never calls the recommendation engine", async () => {
    vi.resetModules();
    const info = { ...chat, id: "LiquidAI/d1-omni-600M", pipeline_tag: "image-text-to-text", createdAt: new Date().toISOString() };
    const fetch = mockHub(info, decision);
    fetch.mockImplementation(async (url: string) => {
      if (url.includes("?author=")) return Response.json(url.includes("author=LiquidAI&") ? [info] : []);
      if (url.includes("?expand")) return Response.json(info);
      if (url.endsWith("/config.json")) return Response.json(decision);
      return Response.json([]);
    });
    const engine = await import("@/lib/recommendations");
    const spy = vi.spyOn(engine, "bestQuantFor");
    const { newOpenModels } = await import("@/lib/hf/new-models");
    const [item] = await newOpenModels();
    expect(item.repo).toBe(info.id);
    expect(item.unrated).toMatch(/cannot be rated for general chat/);
    expect(item.ratings).toBeUndefined();
    expect(spy).not.toHaveBeenCalled();
    const { NewModelsList } = await import("@/components/new-models/list");
    const html = renderToStaticMarkup(createElement(NewModelsList, { items: [item] }));
    expect(html).toContain("Not rated:");
    expect(html).toContain("No conversational comfort or generation-speed estimate");
    expect(html).not.toContain("tok/s");
    expect(html).not.toContain("Excellent");
    const { GET } = await import("@/app/new-models/feed.xml/route");
    const rss = await (await GET()).text();
    expect(rss).toContain("Not rated:");
    expect(rss).not.toContain("Chat rating:");
    spy.mockRestore();
  });
  it("does not borrow a chat template from a base-model architecture fallback", async () => {
    vi.resetModules();
    const fetch = vi.fn(async (url: string) => {
      if (url.includes("?expand")) return Response.json({ id: "test/Unknown", cardData: { base_model: "test/Parent-Instruct" } });
      if (url.includes("/test/Unknown/resolve/main/config.json")) return new Response(null, { status: 403 });
      if (url.endsWith("config.json") && !url.endsWith("tokenizer_config.json")) return Response.json(causal);
      if (url.includes("Parent-Instruct") && url.endsWith("chat_template.jinja")) return new Response("user assistant");
      if (url.includes("/tree/")) return Response.json([]);
      return new Response(null, { status: 404 });
    });
    vi.stubGlobal("fetch", fetch);
    const { loadHfModel } = await import("@/lib/hf/fetch");
    await expect(loadHfModel("test/Unknown")).rejects.toMatchObject({ status: 422, message: expect.stringContaining("uncertain") });
    expect(fetch.mock.calls.some(([url]) => url.includes("Parent-Instruct/resolve/main/chat_template"))).toBe(false);
  });
  it("does not replace a readable specialized config with the base architecture", async () => {
    vi.resetModules();
    const fetch = mockHub({ ...chat, cardData: { base_model: "test/Parent-Instruct" } }, { architectures: ["SpecialModel"] });
    const { loadHfModel } = await import("@/lib/hf/fetch");
    await expect(loadHfModel(chat.id)).rejects.toMatchObject({ status: 422, message: expect.stringContaining("uncertain") });
    expect(fetch.mock.calls.some(([url]) => url.includes("Parent-Instruct"))).toBe(false);
  });
});
