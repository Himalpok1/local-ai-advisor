import type { ToolCallingLevel, UseCaseId } from "@/lib/schemas";
import type { DimensionKey } from "@/lib/schemas/results";

/** Four thresholds: [excellent, comfortable, acceptable, borderline]. */
export type Ladder = [number, number, number, number];

export type CapabilityKey = "general" | "coding" | "reasoning" | "agentic" | "longContext" | "writing";

export interface UseCaseProfile {
  id: UseCaseId;
  label: string;
  /** Phrase used in verdicts: "Comfortable for {phrase}". */
  phrase: string;
  group: "Chat & writing" | "Coding" | "Documents & research" | "Automation & serving" | "Multimodal";
  description: string;
  interactive: boolean;
  isCoding: boolean;
  defaultContext: number;
  /** Typical fraction of the context window in use during a session. */
  typicalFill: number;
  /** User-supplied prompt tokens per request (excluding tool system prompt). */
  promptTokens: number;
  /** New tokens appended per follow-up turn / agent step. */
  stepNewTokens: number;
  outputTokens: number;
  callsPerTask: number;
  defaultConcurrency: number;
  thresholds: {
    /** Per-stream decode tok/s (higher is better). */
    genTps: Ladder;
    /** Cold prompt ingestion seconds (lower is better). */
    coldPromptSec: Ladder;
    /** Seconds per turn or agent step (lower is better). */
    stepLatencySec: Ladder;
    /** Free memory as a fraction of installed memory (higher is better). */
    headroomFraction: Ladder;
  };
  /** Dimension weights, 0 (ignored) – 3 (critical). */
  weights: Record<DimensionKey, number>;
  /** Dimensions that cap the overall rating if they are weak. */
  critical: DimensionKey[];
  needs: {
    primary: CapabilityKey;
    secondary?: CapabilityKey;
    /** Ideal capability tier for the primary capability (1–5). */
    idealTier: number;
    toolCalling?: ToolCallingLevel;
    vision?: boolean;
  };
  /** Shown in "better for / less suitable for" lists. */
  examples: string[];
}

const W = (w: Partial<Record<DimensionKey, number>>): Record<DimensionKey, number> => ({
  memory: 2,
  generation: 2,
  prefill: 1,
  context: 1,
  runtime: 1,
  tool: 1,
  suitability: 2,
  concurrency: 0,
  stability: 1,
  ...w,
});

export const USE_CASES: Record<UseCaseId, UseCaseProfile> = {
  "casual-chat": {
    id: "casual-chat",
    label: "Casual chat",
    phrase: "casual chat",
    group: "Chat & writing",
    description: "Occasional questions and conversation. You read as the model types.",
    interactive: true,
    isCoding: false,
    defaultContext: 8192,
    typicalFill: 0.3,
    promptTokens: 300,
    stepNewTokens: 200,
    outputTokens: 400,
    callsPerTask: 1,
    defaultConcurrency: 1,
    thresholds: {
      genTps: [35, 16, 9, 5],
      coldPromptSec: [2, 5, 12, 30],
      stepLatencySec: [8, 25, 50, 100],
      headroomFraction: [0.3, 0.15, 0.08, 0.03],
    },
    weights: W({ generation: 3, prefill: 1, context: 1, memory: 2, suitability: 1, tool: 1 }),
    critical: ["generation", "memory"],
    needs: { primary: "general", idealTier: 2 },
    examples: ["Casual chat", "Quick questions"],
  },
  "general-assistant": {
    id: "general-assistant",
    label: "General assistant",
    phrase: "general assistant use",
    group: "Chat & writing",
    description: "Everyday help: summaries, emails, explanations, planning.",
    interactive: true,
    isCoding: false,
    defaultContext: 16384,
    typicalFill: 0.35,
    promptTokens: 800,
    stepNewTokens: 400,
    outputTokens: 500,
    callsPerTask: 1,
    defaultConcurrency: 1,
    thresholds: {
      genTps: [38, 18, 10, 5],
      coldPromptSec: [3, 6, 15, 35],
      stepLatencySec: [10, 30, 60, 120],
      headroomFraction: [0.3, 0.15, 0.08, 0.03],
    },
    weights: W({ generation: 3, prefill: 1.5, context: 1, memory: 2, suitability: 2 }),
    critical: ["generation", "memory"],
    needs: { primary: "general", idealTier: 3 },
    examples: ["General assistant tasks", "Summaries and emails"],
  },
  "coding-questions": {
    id: "coding-questions",
    label: "Coding questions",
    phrase: "coding questions",
    group: "Coding",
    description: "Ask about code, paste snippets, generate individual functions.",
    interactive: true,
    isCoding: true,
    defaultContext: 16384,
    typicalFill: 0.35,
    promptTokens: 1500,
    stepNewTokens: 600,
    outputTokens: 600,
    callsPerTask: 1,
    defaultConcurrency: 1,
    thresholds: {
      genTps: [45, 22, 13, 7],
      coldPromptSec: [3, 8, 16, 35],
      stepLatencySec: [10, 30, 60, 120],
      headroomFraction: [0.3, 0.16, 0.09, 0.04],
    },
    weights: W({ generation: 3, prefill: 2, context: 1, memory: 2, suitability: 3, tool: 1.5 }),
    critical: ["generation", "memory", "suitability"],
    needs: { primary: "coding", idealTier: 3 },
    examples: ["Coding questions", "Writing individual functions"],
  },
  "coding-repo": {
    id: "coding-repo",
    label: "Coding with repository context",
    phrase: "interactive coding",
    group: "Coding",
    description: "Assistant edits files with several files of project context, you review each step.",
    interactive: true,
    isCoding: true,
    defaultContext: 32768,
    typicalFill: 0.5,
    promptTokens: 6000,
    stepNewTokens: 1500,
    outputTokens: 800,
    callsPerTask: 4,
    defaultConcurrency: 1,
    thresholds: {
      genTps: [50, 28, 17, 9],
      coldPromptSec: [8, 20, 45, 90],
      stepLatencySec: [12, 30, 60, 120],
      headroomFraction: [0.3, 0.18, 0.1, 0.05],
    },
    weights: W({ generation: 3, prefill: 3, context: 2, memory: 2.5, suitability: 3, tool: 2, runtime: 1.5 }),
    critical: ["generation", "prefill", "memory", "suitability", "tool"],
    needs: { primary: "coding", secondary: "agentic", idealTier: 4, toolCalling: "basic" },
    examples: ["Interactive coding", "Single-file changes", "Normal repository work"],
  },
  "agentic-coding": {
    id: "agentic-coding",
    label: "Agentic coding",
    phrase: "agentic coding",
    group: "Coding",
    description: "An agent reads files, searches, edits, runs tests and iterates with many sequential model calls.",
    interactive: true,
    isCoding: true,
    defaultContext: 32768,
    typicalFill: 0.65,
    promptTokens: 4000,
    stepNewTokens: 2000,
    outputTokens: 350,
    callsPerTask: 25,
    defaultConcurrency: 1,
    thresholds: {
      genTps: [60, 35, 22, 12],
      coldPromptSec: [10, 25, 60, 120],
      stepLatencySec: [6, 12, 25, 50],
      headroomFraction: [0.3, 0.2, 0.12, 0.06],
    },
    weights: W({
      generation: 3,
      prefill: 3,
      context: 2.5,
      memory: 3,
      runtime: 2,
      tool: 3,
      suitability: 3,
      stability: 2,
      concurrency: 1,
    }),
    critical: ["generation", "prefill", "memory", "tool", "suitability", "context"],
    needs: { primary: "coding", secondary: "agentic", idealTier: 4, toolCalling: "good" },
    examples: ["Agentic coding", "Autonomous multi-step edits"],
  },
  reasoning: {
    id: "reasoning",
    label: "Reasoning",
    phrase: "reasoning tasks",
    group: "Documents & research",
    description: "Math, logic and planning with long chains of thought before the answer.",
    interactive: true,
    isCoding: false,
    defaultContext: 32768,
    typicalFill: 0.4,
    promptTokens: 1500,
    stepNewTokens: 800,
    outputTokens: 4000,
    callsPerTask: 1,
    defaultConcurrency: 1,
    thresholds: {
      genTps: [50, 28, 16, 8],
      coldPromptSec: [5, 10, 20, 40],
      stepLatencySec: [80, 160, 320, 600],
      headroomFraction: [0.3, 0.16, 0.09, 0.04],
    },
    weights: W({ generation: 3, prefill: 1, context: 2, memory: 2, suitability: 3, stability: 1.5 }),
    critical: ["generation", "memory", "suitability"],
    needs: { primary: "reasoning", idealTier: 4 },
    examples: ["Reasoning and math", "Planning"],
  },
  research: {
    id: "research",
    label: "Research",
    phrase: "research",
    group: "Documents & research",
    description: "Combine web results / notes into syntheses across several calls.",
    interactive: true,
    isCoding: false,
    defaultContext: 32768,
    typicalFill: 0.6,
    promptTokens: 8000,
    stepNewTokens: 3000,
    outputTokens: 1200,
    callsPerTask: 6,
    defaultConcurrency: 1,
    thresholds: {
      genTps: [40, 20, 11, 6],
      coldPromptSec: [10, 25, 60, 120],
      stepLatencySec: [20, 50, 100, 200],
      headroomFraction: [0.3, 0.16, 0.09, 0.04],
    },
    weights: W({ generation: 2, prefill: 2.5, context: 2.5, memory: 2, suitability: 2.5, tool: 1.5 }),
    critical: ["prefill", "context", "memory"],
    needs: { primary: "reasoning", secondary: "longContext", idealTier: 3, toolCalling: "basic" },
    examples: ["Research synthesis", "Multi-source summaries"],
  },
  "document-analysis": {
    id: "document-analysis",
    label: "Document analysis",
    phrase: "document analysis",
    group: "Documents & research",
    description: "Summarize and extract from reports, contracts and papers.",
    interactive: true,
    isCoding: false,
    defaultContext: 32768,
    typicalFill: 0.75,
    promptTokens: 16000,
    stepNewTokens: 800,
    outputTokens: 1000,
    callsPerTask: 3,
    defaultConcurrency: 1,
    thresholds: {
      genTps: [30, 14, 8, 4],
      coldPromptSec: [15, 40, 90, 180],
      stepLatencySec: [20, 50, 100, 200],
      headroomFraction: [0.3, 0.18, 0.1, 0.05],
    },
    weights: W({ generation: 1.5, prefill: 3, context: 3, memory: 2.5, suitability: 2 }),
    critical: ["prefill", "context", "memory"],
    needs: { primary: "longContext", secondary: "general", idealTier: 3 },
    examples: ["Document analysis", "Report summaries"],
  },
  "long-doc-qa": {
    id: "long-doc-qa",
    label: "Long-document Q&A",
    phrase: "long-document Q&A",
    group: "Documents & research",
    description: "Load an entire long document (books, large specs) and ask questions about it.",
    interactive: true,
    isCoding: false,
    defaultContext: 65536,
    typicalFill: 0.8,
    promptTokens: 48000,
    stepNewTokens: 300,
    outputTokens: 600,
    callsPerTask: 4,
    defaultConcurrency: 1,
    thresholds: {
      genTps: [30, 14, 8, 4],
      coldPromptSec: [30, 75, 150, 300],
      stepLatencySec: [15, 40, 80, 160],
      headroomFraction: [0.3, 0.18, 0.1, 0.05],
    },
    weights: W({ generation: 1.5, prefill: 3, context: 3, memory: 3, suitability: 2 }),
    critical: ["prefill", "context", "memory"],
    needs: { primary: "longContext", idealTier: 4 },
    examples: ["Long-document Q&A", "64K+ context"],
  },
  writing: {
    id: "writing",
    label: "Writing",
    phrase: "writing",
    group: "Chat & writing",
    description: "Drafting and editing articles, stories and long-form text.",
    interactive: true,
    isCoding: false,
    defaultContext: 16384,
    typicalFill: 0.4,
    promptTokens: 1500,
    stepNewTokens: 600,
    outputTokens: 1500,
    callsPerTask: 2,
    defaultConcurrency: 1,
    thresholds: {
      genTps: [35, 16, 9, 5],
      coldPromptSec: [3, 8, 16, 35],
      stepLatencySec: [40, 90, 180, 360],
      headroomFraction: [0.3, 0.15, 0.08, 0.03],
    },
    weights: W({ generation: 2.5, prefill: 1, context: 1.5, memory: 2, suitability: 2.5 }),
    critical: ["generation", "memory"],
    needs: { primary: "writing", idealTier: 3 },
    examples: ["Writing and editing", "Long-form drafts"],
  },
  vision: {
    id: "vision",
    label: "Vision / image understanding",
    phrase: "image understanding",
    group: "Multimodal",
    description: "Describe screenshots, read charts and photos.",
    interactive: true,
    isCoding: false,
    defaultContext: 8192,
    typicalFill: 0.35,
    promptTokens: 1500,
    stepNewTokens: 1200,
    outputTokens: 500,
    callsPerTask: 1,
    defaultConcurrency: 1,
    thresholds: {
      genTps: [35, 16, 9, 5],
      coldPromptSec: [3, 8, 16, 35],
      stepLatencySec: [10, 30, 60, 120],
      headroomFraction: [0.3, 0.15, 0.08, 0.03],
    },
    weights: W({ generation: 2.5, prefill: 2, context: 1, memory: 2, suitability: 3 }),
    critical: ["generation", "memory", "suitability"],
    needs: { primary: "general", idealTier: 3, vision: true },
    examples: ["Image understanding", "Screenshot Q&A"],
  },
  "data-analysis": {
    id: "data-analysis",
    label: "Data analysis",
    phrase: "data analysis",
    group: "Documents & research",
    description: "Write and iterate on analysis code over tables and CSVs.",
    interactive: true,
    isCoding: true,
    defaultContext: 32768,
    typicalFill: 0.5,
    promptTokens: 6000,
    stepNewTokens: 1500,
    outputTokens: 900,
    callsPerTask: 6,
    defaultConcurrency: 1,
    thresholds: {
      genTps: [45, 24, 14, 7],
      coldPromptSec: [8, 20, 45, 90],
      stepLatencySec: [15, 35, 70, 140],
      headroomFraction: [0.3, 0.16, 0.09, 0.04],
    },
    weights: W({ generation: 2.5, prefill: 2.5, context: 2, memory: 2, suitability: 3, tool: 1.5 }),
    critical: ["generation", "prefill", "suitability"],
    needs: { primary: "coding", secondary: "reasoning", idealTier: 3, toolCalling: "basic" },
    examples: ["Data analysis", "Spreadsheet & CSV work"],
  },
  rag: {
    id: "rag",
    label: "RAG (chat with your files)",
    phrase: "retrieval-augmented chat",
    group: "Documents & research",
    description: "Retrieved chunks are injected into each prompt before answering.",
    interactive: true,
    isCoding: false,
    defaultContext: 16384,
    typicalFill: 0.55,
    promptTokens: 6000,
    stepNewTokens: 5000,
    outputTokens: 500,
    callsPerTask: 1,
    defaultConcurrency: 1,
    thresholds: {
      genTps: [38, 18, 10, 5],
      coldPromptSec: [4, 10, 20, 45],
      stepLatencySec: [8, 20, 40, 80],
      headroomFraction: [0.3, 0.16, 0.09, 0.04],
    },
    weights: W({ generation: 2, prefill: 3, context: 2, memory: 2, suitability: 2 }),
    critical: ["prefill", "generation", "memory"],
    needs: { primary: "longContext", secondary: "general", idealTier: 3 },
    examples: ["RAG over your files", "Knowledge-base Q&A"],
  },
  "api-server": {
    id: "api-server",
    label: "Local API server",
    phrase: "serving a local API",
    group: "Automation & serving",
    description: "Serve several apps or users through an OpenAI-compatible endpoint.",
    interactive: false,
    isCoding: false,
    defaultContext: 16384,
    typicalFill: 0.4,
    promptTokens: 2000,
    stepNewTokens: 2000,
    outputTokens: 500,
    callsPerTask: 1,
    defaultConcurrency: 4,
    thresholds: {
      genTps: [40, 22, 12, 6],
      coldPromptSec: [3, 8, 16, 35],
      stepLatencySec: [10, 25, 50, 100],
      headroomFraction: [0.3, 0.2, 0.12, 0.06],
    },
    weights: W({ generation: 2.5, prefill: 2, context: 1, memory: 3, runtime: 2.5, concurrency: 3, stability: 2, suitability: 1.5 }),
    critical: ["concurrency", "memory", "runtime"],
    needs: { primary: "general", idealTier: 3, toolCalling: "basic" },
    examples: ["Serving a local API", "Multiple concurrent users"],
  },
  "multi-agent": {
    id: "multi-agent",
    label: "Multiple agents",
    phrase: "running multiple agents",
    group: "Automation & serving",
    description: "Several agents work in parallel, each with its own long context.",
    interactive: true,
    isCoding: true,
    defaultContext: 32768,
    typicalFill: 0.6,
    promptTokens: 6000,
    stepNewTokens: 2000,
    outputTokens: 400,
    callsPerTask: 30,
    defaultConcurrency: 1,
    thresholds: {
      genTps: [45, 28, 18, 10],
      coldPromptSec: [12, 30, 70, 140],
      stepLatencySec: [8, 16, 32, 64],
      headroomFraction: [0.3, 0.2, 0.12, 0.06],
    },
    weights: W({
      generation: 3,
      prefill: 3,
      context: 2.5,
      memory: 3,
      runtime: 2.5,
      tool: 2.5,
      suitability: 3,
      concurrency: 3,
      stability: 2,
    }),
    critical: ["concurrency", "memory", "prefill", "generation", "suitability", "tool"],
    needs: { primary: "agentic", secondary: "coding", idealTier: 4, toolCalling: "good" },
    examples: ["Multiple simultaneous agents"],
  },
  "background-automation": {
    id: "background-automation",
    label: "Background automation",
    phrase: "background automation",
    group: "Automation & serving",
    description: "Scheduled jobs: tagging, extraction, summarizing — nobody waits on each token.",
    interactive: false,
    isCoding: false,
    defaultContext: 16384,
    typicalFill: 0.4,
    promptTokens: 3000,
    stepNewTokens: 3000,
    outputTokens: 500,
    callsPerTask: 5,
    defaultConcurrency: 1,
    thresholds: {
      genTps: [25, 12, 6, 3],
      coldPromptSec: [10, 30, 60, 120],
      stepLatencySec: [30, 90, 180, 360],
      headroomFraction: [0.35, 0.22, 0.12, 0.06],
    },
    weights: W({ generation: 1.5, prefill: 1.5, context: 1, memory: 3, suitability: 2, stability: 2.5, runtime: 1.5 }),
    critical: ["memory", "stability"],
    needs: { primary: "general", idealTier: 2, toolCalling: "basic" },
    examples: ["Background automation", "Batch extraction"],
  },
};

export const USE_CASE_LIST = Object.values(USE_CASES);

export function getUseCase(id: UseCaseId): UseCaseProfile {
  return USE_CASES[id];
}

export function importanceLabel(weight: number): "low" | "medium" | "high" | "very-high" | "critical" {
  if (weight >= 3) return "critical";
  if (weight >= 2.5) return "very-high";
  if (weight >= 2) return "high";
  if (weight >= 1) return "medium";
  return "low";
}
