import type { Provider } from "@/lib/schemas";

/** The API layer between tools and runtimes. */
export const PROVIDERS: Provider[] = [
  {
    id: "openai",
    name: "OpenAI-compatible API",
    description:
      "The de-facto standard (/v1/chat/completions, sometimes /v1/responses). Exposed by nearly every runtime: llama.cpp, Ollama, LM Studio, MLX-LM, vLLM, SGLang, Jan, LocalAI.",
    source: { url: "https://platform.openai.com/docs/api-reference/chat", title: "OpenAI API reference", lastVerified: "2026-09-30", confidence: "high" },
  },
  {
    id: "anthropic",
    name: "Anthropic-compatible API",
    description:
      "The Messages API (/v1/messages) used by Claude Code. Served locally by Ollama (v0.14+), llama.cpp's llama-server, LM Studio (v0.4.1+), Lemonade, vLLM and LocalAI — or via a bridge such as a LiteLLM proxy.",
    source: { url: "https://code.claude.com/docs/en/llm-gateway-protocol", title: "Claude Code LLM gateway protocol", lastVerified: "2026-09-30", confidence: "high" },
  },
  {
    id: "ollama",
    name: "Ollama API",
    description: "Ollama's native API (/api/chat, /api/generate) with model management. Used natively by Open WebUI, Continue, Cline, Aider and VS Code.",
    source: { url: "https://docs.ollama.com/api", title: "Ollama API", lastVerified: "2026-09-30", confidence: "high" },
  },
];
