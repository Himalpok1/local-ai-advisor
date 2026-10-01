/** Table of contents for /learn. Ids double as URL anchors. */
export interface LearnSection {
  id: string;
  title: string;
}

export interface LearnGroup {
  id: string;
  title: string;
  sections: LearnSection[];
}

export const LEARN_GROUPS: LearnGroup[] = [
  {
    id: "key-concepts",
    title: "Key concepts",
    sections: [
      { id: "fits-is-not-fast", title: "“Fits” ≠ “fast”" },
      { id: "chat-is-not-agent", title: "Fast chat ≠ good agent" },
    ],
  },
  {
    id: "memory",
    title: "Memory",
    sections: [
      { id: "ram", title: "RAM" },
      { id: "vram", title: "VRAM" },
      { id: "unified-memory", title: "Unified memory" },
    ],
  },
  {
    id: "model-size",
    title: "Model size",
    sections: [
      { id: "parameters", title: "Parameters" },
      { id: "active-parameters", title: "Active parameters" },
      { id: "moe", title: "Mixture of Experts" },
      { id: "quantization", title: "Quantization" },
    ],
  },
  {
    id: "context-group",
    title: "Context",
    sections: [
      { id: "context", title: "Context window" },
      { id: "kv-cache", title: "KV cache" },
    ],
  },
  {
    id: "speed",
    title: "Speed",
    sections: [
      { id: "tokens-per-second", title: "Tokens/sec" },
      { id: "prompt-processing", title: "Prompt processing" },
      { id: "time-to-first-token", title: "Time to first token" },
    ],
  },
  {
    id: "software",
    title: "Formats & backends",
    sections: [
      { id: "gguf", title: "GGUF" },
      { id: "mlx", title: "MLX" },
      { id: "cuda", title: "CUDA" },
      { id: "rocm", title: "ROCm, Vulkan & Metal" },
    ],
  },
];

export const ALL_LEARN_SECTIONS: LearnSection[] = LEARN_GROUPS.flatMap((g) => g.sections);
