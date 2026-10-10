/** Conservative admission to the conversational evaluation engine, not a Hub task taxonomy. */
import type { HfConfig, HfFile, HfModelInfo } from "./parse";

const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
const object = (value: unknown): HfConfig => value && typeof value === "object" && !Array.isArray(value) ? value as HfConfig : {};
const SPECIALIZED = /(?:^|[-_./\s])(?:embedding|embeddings|embed|reranker|rerank|encoder|ocr|parsing|document|decision|classification|reward)(?:$|[-_./\s])/i;
const BASE = /(?:^|[-_.])(?:base|pretrain(?:ed)?|midtrain)(?:$|[-_.])/i;
const CHAT = /(?:^|[-_.])(?:instruct|instruction|chat|it)(?:$|[-_.])/i;
// Conditional generation also covers speech/seq2seq tasks. Admit the supported
// vision-language families, not every class with that suffix.
const VISION_GENERATOR = /^(?:Qwen[\w]*|Gemma[\w]*|Mistral[\w]*|Llava[\w]*|Idefics[\w]*|SmolVLM|Lfm2Vl)ForConditionalGeneration$/;
const GENERATIVE_PIPELINES = new Set(["text-generation", "image-text-to-text"]);

export function hfChatTemplate(info: HfModelInfo): string {
  const value: unknown = info.config?.tokenizer_config?.chat_template ?? info.gguf?.chat_template;
  if (typeof value === "string") return value;
  return Array.isArray(value) ? value.map((v) => object(v).template).filter((v): v is string => typeof v === "string").join("\n") : "";
}

/** Negative task evidence takes precedence over broad pipeline tags and chat templates. */
export function nonGenerativeReason(info: HfModelInfo, config: HfConfig = {}, files: HfFile[] = []): string | undefined {
  const pipelines = [info.pipeline_tag, info.cardData?.pipeline_tag].filter((v): v is string => typeof v === "string");
  const pipeline = pipelines.find((v) => !GENERATIVE_PIPELINES.has(v));
  if (pipeline) return `unsupported pipeline: ${pipeline}`;
  if (["sentence-transformers", "diffusers"].includes(info.library_name ?? "")) return `specialized library: ${info.library_name}`;
  const tc = object(config.text_config);
  const types = [config.model_type, tc.model_type, info.config?.model_type].filter((v): v is string => typeof v === "string");
  const encoder = types.find((v) => /^(?:bert|modernbert|nomic_bert|xlm-roberta|roberta|distilbert|deberta(?:-v2)?|electra|t5|mt5|bart)$/.test(v) || SPECIALIZED.test(v));
  if (encoder) return `specialized model_type: ${encoder}`;
  const architectures = [...strings(config.architectures), ...strings(tc.architectures), ...strings(info.config?.architectures)];
  const specialized = architectures.find((v) => /For(?:SequenceClassification|TokenClassification|MaskedLM|QuestionAnswering)|Encoder|Reward|Rerank|Decision|OCR/i.test(v));
  if (specialized) return `specialized architecture: ${specialized}`;
  if (config.is_encoder_decoder === true || tc.is_encoder_decoder === true) return "encoder-decoder generation is outside this engine's supported conversational workloads";
  // Single-pass decision heads can contain a language trunk and even a chat template.
  const temperatures = object(config.temperatures);
  if ("choice" in temperatures && ("noul" in temperatures || "score" in temperatures)) return "decision/classification head; output-token generation is not applicable";
  const signal = [(typeof info.id === "string" ? info.id.split("/").pop() : "") ?? "", ...strings(info.tags)].find((v) => SPECIALIZED.test(v));
  if (signal) return `specialized task signal: ${signal}`;
  const file = files.find((f) => SPECIALIZED.test(f.path) && /\.gguf$/i.test(f.path));
  return file ? `specialized GGUF file: ${file.path}` : undefined;
}

export type ChatEligibility = { status: "supported" | "unsupported" | "uncertain"; reason: string };

export function chatEligibility(info: HfModelInfo, config: HfConfig = {}, files: HfFile[] = []): ChatEligibility {
  const rejection = nonGenerativeReason(info, config, files);
  if (rejection) return { status: "unsupported", reason: rejection };
  const name = (typeof info.id === "string" ? info.id.split("/").pop() : "") ?? "";
  if (BASE.test(name) || strings(info.tags).some((t) => /^(?:base|pretrained|pretraining)$/.test(t))) {
    return { status: "unsupported", reason: "base/pretrained model; conversational instruction tuning is not established" };
  }
  // Inspect the outer head, never infer generation from a nested text backbone.
  const architectures = [...strings(config.architectures), ...strings(info.config?.architectures)];
  const generative = architectures.length > 0 && architectures.every((a) => /ForCausalLM$/.test(a) || VISION_GENERATOR.test(a));
  // GGUF repositories often publish only the architecture family, not the HF head.
  const ggufFamily = info.gguf?.architecture;
  const supportedGguf = architectures.length === 0 && typeof ggufFamily === "string" && /^(?:llama|qwen2|qwen3|qwen3moe|gemma|gemma2|gemma3|mistral|phi3|gptoss|deepseek2)$/.test(ggufFamily);
  if (!generative && !supportedGguf) return { status: "uncertain", reason: "no supported causal or conditional generation head could be verified; a text backbone or pipeline tag alone is insufficient" };
  if (!hfChatTemplate(info).trim() && !CHAT.test(name) && !strings(info.tags).some((t) => /^(?:chat|instruct|conversational)$/.test(t))) {
    return { status: "uncertain", reason: "no chat template or explicit chat/instruction-tuning signal was found" };
  }
  return { status: "supported", reason: "generation head and conversational metadata found; capabilities and runtime support remain estimates" };
}

export function eligibilityMessage(repo: string, eligibility: ChatEligibility): string {
  return `${repo} cannot be rated for general chat (${eligibility.status}): ${eligibility.reason}. No conversational comfort or generation-speed estimate is available. Choose a generative chat or instruct model. Specialized workloads, including embedding/reranker models, need a separate evaluator.`;
}
