/**
 * Plain setup guidance for a recommended stack. Commands reflect each
 * project's documented interface; model names are placeholders because
 * download tags differ between registries.
 */
import type { Recommendation } from "@/lib/schemas/results";

export interface SetupStep {
  title: string;
  detail?: string;
  code?: string;
}

const PORTS: Record<string, number> = { ollama: 11434, "lm-studio": 1234, "llama.cpp": 8080, "mlx-lm": 8080, jan: 1337, vllm: 8000, sglang: 30000, localai: 8080, lemonade: 13305 };

export function runtimePort(runtimeId: string) {
  return PORTS[runtimeId] ?? 8080;
}

export function setupSteps(rec: Recommendation): SetupStep[] {
  const ctx = rec.context.effective;
  const port = runtimePort(rec.runtime.id);
  const quantName = rec.quant.formatNames[rec.format] ?? rec.quant.label;
  const kvQuant = rec.memory.kvCacheGB > 0 && rec.runtime.supportsKvQuant;
  const steps: SetupStep[] = [];
  const model = `${rec.model.name} (${quantName}, ${rec.format.toUpperCase()})`;

  switch (rec.runtime.id) {
    case "ollama":
      steps.push(
        { title: "Install Ollama", detail: "Download from ollama.com — it runs as a background server." },
        { title: `Download ${model}`, detail: "Find the model in the Ollama library and pull the matching quantization tag.", code: "ollama pull <model>:<tag>" },
        {
          title: `Serve it with a ${Math.round(ctx / 1024)}K context`,
          detail: "Ollama's default context is small; raise it explicitly.",
          code: `OLLAMA_CONTEXT_LENGTH=${ctx}${kvQuant ? " OLLAMA_FLASH_ATTENTION=1 OLLAMA_KV_CACHE_TYPE=q8_0" : ""} ollama serve`,
        },
      );
      break;
    case "llama.cpp":
      steps.push(
        { title: "Install llama.cpp", detail: "Use a release build for your backend (Metal, CUDA, ROCm, Vulkan) or your package manager." },
        { title: `Start llama-server with ${model}`, code: `llama-server -hf <user>/<repo>-GGUF:${quantName} -c ${ctx} -ngl 99 --jinja --port ${port}` },
      );
      break;
    case "mlx-lm":
      steps.push(
        { title: "Install MLX-LM", code: "pip install mlx-lm" },
        { title: `Serve ${model}`, detail: "Use an MLX conversion (e.g. from the mlx-community organization on Hugging Face).", code: `mlx_lm.server --model <mlx-community/model-${quantName}> --port ${port}` },
      );
      break;
    case "lm-studio":
      steps.push(
        { title: "Install LM Studio", detail: "Download from lmstudio.ai." },
        { title: `Download ${model}`, detail: `In the model browser pick the ${rec.format === "mlx" ? "MLX" : "GGUF"} build at ${quantName}.` },
        { title: "Start the local server", detail: `Developer tab → Start server (port ${port}). Set context length to ${ctx} when loading the model.` },
      );
      break;
    case "vllm":
      steps.push({ title: "Install vLLM (Linux + GPU)", code: "pip install vllm" }, { title: `Serve ${model}`, code: `vllm serve <hf-repo> --max-model-len ${ctx}` });
      break;
    case "sglang":
      steps.push({ title: "Install SGLang", code: 'pip install "sglang[all]"' }, { title: `Serve ${model}`, code: `python -m sglang.launch_server --model-path <hf-repo> --context-length ${ctx} --port ${port}` });
      break;
    case "jan":
      steps.push({ title: "Install Jan", detail: "Download from jan.ai and get the model from the hub." }, { title: "Enable the Local API Server", detail: `Settings → Local API Server (port ${port}).` });
      break;
    case "localai":
      steps.push({ title: "Run LocalAI", code: `docker run -p ${port}:8080 localai/localai` }, { title: `Install ${model}`, detail: "From the LocalAI gallery or by pointing to a GGUF file." });
      break;
    case "lemonade":
      steps.push({ title: "Install Lemonade Server", detail: "From lemonade-server.ai (AMD Ryzen AI / Radeon)." }, { title: `Load ${model}`, detail: `Server listens on port ${port}.` });
      break;
  }

  const base = `http://localhost:${port}`;
  switch (rec.tool.id) {
    case "claude-code":
      steps.push({ title: "Point Claude Code at the local server", detail: "Anthropic-compatible endpoint; set any non-empty token.", code: `ANTHROPIC_BASE_URL=${base} ANTHROPIC_AUTH_TOKEN=local claude --model <model-name>` });
      break;
    case "codex-cli":
      steps.push(
        rec.runtime.id === "ollama" || rec.runtime.id === "lm-studio"
          ? { title: "Run Codex in local mode", code: `codex --oss --local-provider ${rec.runtime.id === "ollama" ? "ollama" : "lmstudio"} -m <model-name>` }
          : { title: "Add a custom provider to ~/.codex/config.toml", code: `[model_providers.local]\nname = "local"\nbase_url = "${base}/v1"\nwire_api = "responses"` },
      );
      break;
    case "opencode":
      steps.push({ title: "Add the provider to opencode.json", code: `{\n  "provider": {\n    "local": {\n      "npm": "@ai-sdk/openai-compatible",\n      "options": { "baseURL": "${base}/v1" },\n      "models": { "<model-name>": {} }\n    }\n  }\n}` });
      break;
    case "aider":
      steps.push(
        rec.connection.api === "ollama"
          ? { title: "Start Aider", code: `OLLAMA_API_BASE=${base} aider --model ollama_chat/<model-name>` }
          : { title: "Start Aider", code: `OPENAI_API_BASE=${base}/v1 OPENAI_API_KEY=local aider --model openai/<model-name>` },
      );
      break;
    case "pi":
      steps.push({ title: "Add a models.json entry", detail: `Use api "openai-completions" with baseUrl ${base}/v1 and a dummy apiKey.` });
      break;
    case "open-webui":
      steps.push({ title: "Connect Open WebUI", detail: rec.connection.api === "ollama" ? `Admin → Connections → Ollama URL ${base}` : `Admin → Connections → OpenAI API base URL ${base}/v1` });
      break;
    case "lm-studio-chat":
      steps.push({ title: "Chat in LM Studio", detail: "Open the Chat tab and select the loaded model." });
      break;
    case "api-only":
    case "custom-app":
    case "other":
      steps.push({ title: "Call the API", code: rec.connection.api === "anthropic" ? `POST ${base}/v1/messages` : rec.connection.api === "ollama" ? `POST ${base}/api/chat` : `POST ${base}/v1/chat/completions` });
      break;
    default:
      steps.push({ title: `Configure ${rec.tool.name}`, detail: `Choose the ${rec.connection.api === "ollama" ? "Ollama" : rec.connection.api === "anthropic" ? "Anthropic-compatible" : "OpenAI-compatible"} provider with base URL ${rec.connection.api === "openai" ? `${base}/v1` : base}.` });
  }
  if (rec.connection.level === "bridge") {
    steps.push({ title: "Add a protocol bridge", detail: `${rec.tool.name} speaks the Anthropic API but ${rec.runtime.name} only exposes an OpenAI-compatible one; run a translating proxy (e.g. LiteLLM) between them, or choose a runtime with a native Anthropic endpoint.` });
  }
  return steps;
}
