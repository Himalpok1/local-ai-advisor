/**
 * Concrete download names and run commands for curated models, from the
 * verified data in data/downloads.ts. Anything we couldn't verify returns
 * undefined so callers fall back to generic instructions.
 */
import { DOWNLOADS, type GgufBuild } from "@/data/downloads";
import type { QuantId } from "@/lib/schemas";

export interface ResolvedGguf extends GgufBuild {
  repo: string;
  /** Requested quant wasn't published; this is the nearest one that was. */
  substituted: boolean;
}

/** Nearest published quant, preferring a step up in quality over a step down. */
const NEAREST: Record<QuantId, QuantId[]> = {
  q3: ["q3", "q4"],
  q4: ["q4", "q5", "q3"],
  q5: ["q5", "q6", "q4"],
  q6: ["q6", "q8", "q5"],
  q8: ["q8", "q6"],
  fp8: ["q8"],
  fp16: ["fp16", "q8"],
  mxfp4: ["mxfp4", "q4"],
};

export function ggufFor(modelId: string, quant: QuantId): ResolvedGguf | undefined {
  const g = DOWNLOADS[modelId]?.gguf;
  if (!g) return undefined;
  for (const q of NEAREST[quant]) {
    const build = g.quants[q];
    if (build) return { repo: g.repo, ...build, substituted: q !== quant };
  }
  return undefined;
}

export function mlxFor(modelId: string, quant: QuantId): { repo: string; substituted: boolean } | undefined {
  const m = DOWNLOADS[modelId]?.mlx;
  if (!m) return undefined;
  for (const q of NEAREST[quant]) if (m[q]) return { repo: m[q]!, substituted: q !== quant };
  return undefined;
}

export function upstreamRepo(modelId: string): string | undefined {
  return DOWNLOADS[modelId]?.upstream;
}

export interface RunCommand {
  id: "ollama" | "llama.cpp" | "lm-studio" | "mlx";
  label: string;
  /** Shell command, or undefined when the runtime is driven from its UI. */
  code?: string;
  /** One-click link (LM Studio). */
  href?: string;
  note?: string;
}

/**
 * Ready-to-paste commands for the main local runtimes. Ollama and llama.cpp
 * pull GGUF files straight from Hugging Face, so these work without a
 * separate download step.
 */
export function runCommands(args: { modelId: string; quant: QuantId; contextTokens: number; apple: boolean }): RunCommand[] {
  const { modelId, quant, contextTokens: ctx, apple } = args;
  const out: RunCommand[] = [];
  const gguf = ggufFor(modelId, quant);
  if (gguf) {
    const ref = `${gguf.repo}:${gguf.tag}`;
    const sizeNote = `Downloads ${gguf.sizeGB} GB (${gguf.tag}${gguf.substituted ? ", the closest quantization published" : ""}).`;
    out.push({
      id: "ollama",
      label: "Ollama",
      code: `ollama run hf.co/${ref}`,
      note:
        gguf.files > 1
          ? `This build is split into ${gguf.files} files, which Ollama can't import from Hugging Face. Use llama.cpp or LM Studio instead.`
          : `${sizeNote} Ollama's default context is small: set OLLAMA_CONTEXT_LENGTH=${ctx} before \`ollama serve\` for long prompts.`,
    });
    out.push({
      id: "llama.cpp",
      label: "llama.cpp",
      code: `llama-server -hf ${ref} -c ${ctx} -ngl 99 --jinja --port 8080`,
      note: `${sizeNote} Serves an OpenAI-compatible API at http://localhost:8080/v1.`,
    });
    out.push({
      id: "lm-studio",
      label: "LM Studio",
      href: `lmstudio://open_from_hf?model=${gguf.repo}`,
      note: `Opens ${gguf.repo} in LM Studio. Pick the ${gguf.tag} file and set the context length to ${ctx} when loading.`,
    });
  }
  const mlx = apple ? mlxFor(modelId, quant) : undefined;
  if (mlx) {
    out.push({
      id: "mlx",
      label: "MLX (Mac)",
      code: `pip install mlx-lm\nmlx_lm.server --model ${mlx.repo} --port 8080`,
      note: `Apple's MLX runtime, often the fastest option on a Mac.${mlx.substituted ? " Closest quantization published." : ""}`,
    });
  }
  return out;
}
