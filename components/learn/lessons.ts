/**
 * The Learn course: short lessons meant to be read in order. Slugs are URLs
 * (/learn/<slug>); `anchors` are the ids of the old single-page /learn
 * sections each lesson now contains, so old links keep working.
 */
export interface Lesson {
  slug: string;
  title: string;
  /** One plain sentence: what you'll understand after this lesson. */
  summary: string;
  minutes: number;
  /** Two or three "you'll learn" bullets. */
  outcomes: string[];
  part: (typeof PARTS)[number]["id"];
  anchors: string[];
}

export const PARTS = [
  { id: "basics", title: "The basics", description: "What local AI is and what a model needs from your computer." },
  { id: "performance", title: "What makes it run well", description: "Why one computer flies and another crawls." },
  { id: "setup", title: "Getting set up", description: "The software involved, and your first model." },
] as const;

export const LESSONS: Lesson[] = [
  {
    slug: "what-is-local-ai",
    title: "What is local AI?",
    summary: "Running an AI model on your own computer instead of in someone else’s cloud.",
    minutes: 3,
    outcomes: ["The three pieces: app, runtime and model", "Why people run AI at home", "What your computer has to do"],
    part: "basics",
    anchors: [],
  },
  {
    slug: "memory",
    title: "Memory: where the model lives",
    summary: "A model has to sit in memory while it runs, and what kind of memory decides how fast it is.",
    minutes: 4,
    outcomes: ["RAM vs. VRAM in plain words", "Why Macs can run big models", "Why bandwidth beats raw power"],
    part: "basics",
    anchors: ["memory", "ram", "vram", "unified-memory"],
  },
  {
    slug: "model-size",
    title: "How big is a model?",
    summary: "What “7B” or “35B-A3B” means, and how size turns into gigabytes.",
    minutes: 4,
    outcomes: ["What parameters are", "How to estimate a model’s size", "Why MoE models are fast"],
    part: "basics",
    anchors: ["model-size", "parameters", "active-parameters", "moe"],
  },
  {
    slug: "quantization",
    title: "Quantization: shrinking models",
    summary: "How a model gets 3–4× smaller with only a small loss in quality.",
    minutes: 3,
    outcomes: ["What Q4, Q8 and FP16 mean", "Which quant to download", "Bigger-at-Q4 vs. smaller-at-Q8"],
    part: "basics",
    anchors: ["quantization"],
  },
  {
    slug: "fits-vs-fast",
    title: "Why “it fits” isn’t enough",
    summary: "A model can fit in memory and still make your computer miserable to use.",
    minutes: 3,
    outcomes: ["Why you need spare memory", "What “spilling” to RAM does", "How we rate setups"],
    part: "performance",
    anchors: ["fits-is-not-fast"],
  },
  {
    slug: "context",
    title: "Context: the model’s short-term memory",
    summary: "How much text a model can keep in mind at once, and what that costs.",
    minutes: 4,
    outcomes: ["What tokens are", "How big a context you need", "Why long chats use more memory"],
    part: "performance",
    anchors: ["context-group", "context", "kv-cache"],
  },
  {
    slug: "speed",
    title: "Speed: tokens per second",
    summary: "The numbers that decide whether a model feels instant or sluggish.",
    minutes: 4,
    outcomes: ["What “tok/s” feels like", "Reading speed vs. writing speed", "Time to first word"],
    part: "performance",
    anchors: ["speed", "tokens-per-second", "prompt-processing", "time-to-first-token"],
  },
  {
    slug: "chat-vs-agents",
    title: "Chat vs. coding agents",
    summary: "Why a model that’s great for chat can be painfully slow as a coding agent.",
    minutes: 4,
    outcomes: ["How agents use a model", "Why waits add up", "When a smaller model wins"],
    part: "performance",
    anchors: ["chat-is-not-agent", "key-concepts"],
  },
  {
    slug: "formats",
    title: "File formats & GPU software",
    summary: "GGUF, MLX, CUDA, ROCm: the names you’ll see when downloading models.",
    minutes: 3,
    outcomes: ["GGUF vs. MLX", "What CUDA, ROCm, Vulkan and Metal are", "Which one you need"],
    part: "setup",
    anchors: ["software", "gguf", "mlx", "cuda", "rocm"],
  },
  {
    slug: "first-model",
    title: "Run your first model",
    summary: "Install an app, download a model and chat with it, all in about ten minutes.",
    minutes: 5,
    outcomes: ["The easiest app to start with", "Picking a first model", "Checking it runs well"],
    part: "setup",
    anchors: [],
  },
];

export const TOTAL_MINUTES = LESSONS.reduce((s, l) => s + l.minutes, 0);

export function getLesson(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug);
}

export function lessonIndex(slug: string): number {
  return LESSONS.findIndex((l) => l.slug === slug);
}

/** Lesson that contains an old /learn#anchor. */
export function lessonForAnchor(anchor: string): Lesson | undefined {
  return LESSONS.find((l) => l.anchors.includes(anchor));
}

/** Jargon buster: common words and the lesson that explains them. */
export const GLOSSARY: { term: string; slug: string; anchor?: string }[] = [
  { term: "RAM", slug: "memory", anchor: "ram" },
  { term: "VRAM", slug: "memory", anchor: "vram" },
  { term: "Unified memory", slug: "memory", anchor: "unified-memory" },
  { term: "Parameters (7B, 70B…)", slug: "model-size", anchor: "parameters" },
  { term: "MoE", slug: "model-size", anchor: "moe" },
  { term: "Q4 / Q8", slug: "quantization" },
  { term: "Tokens", slug: "context", anchor: "context" },
  { term: "Context window", slug: "context", anchor: "context" },
  { term: "KV cache", slug: "context", anchor: "kv-cache" },
  { term: "tok/s", slug: "speed", anchor: "tokens-per-second" },
  { term: "Prefill", slug: "speed", anchor: "prompt-processing" },
  { term: "TTFT", slug: "speed", anchor: "time-to-first-token" },
  { term: "Agent", slug: "chat-vs-agents" },
  { term: "GGUF", slug: "formats", anchor: "gguf" },
  { term: "MLX", slug: "formats", anchor: "mlx" },
  { term: "CUDA", slug: "formats", anchor: "cuda" },
  { term: "Ollama", slug: "first-model" },
  { term: "LM Studio", slug: "first-model" },
];
