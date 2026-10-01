import type {
  AITool,
  AgentBehavior,
  CodingStyle,
  DocumentSize,
  RepoSize,
  WorkloadProfile,
  WorkloadProfileInput,
} from "@/lib/schemas";
import { WorkloadProfileSchema } from "@/lib/schemas";
import { devEnvReserveGB } from "./dev-env";
import { getUseCase, type UseCaseProfile } from "./profiles";

/** Concrete numbers the performance + memory engines consume. */
export interface ResolvedWorkload {
  input: WorkloadProfile;
  profile: UseCaseProfile;
  tool: AITool;
  /** Context window to allocate (tokens). */
  contextWindow: number;
  /** Tokens typically in context during the session. */
  typicalContextTokens: number;
  /** Tokens in the first (uncached) request of a session. */
  coldPromptTokens: number;
  /** New tokens appended per step/turn (tool output, user message…). */
  stepNewTokens: number;
  outputTokens: number;
  callsPerTask: number;
  /** Simultaneous inference streams (requests × agents). */
  streams: number;
  devEnvGB: number;
  /** Human-readable summary of the derived workload. */
  summary: string[];
  intensity: "light" | "moderate" | "heavy" | "extreme";
}

export const REPO_SIZES: Record<RepoSize, { label: string; lines: string; promptBoost: number; fillBoost: number; contextHint: number; callsFactor: number }> = {
  tiny: { label: "Tiny", lines: "< 10K lines", promptBoost: 0, fillBoost: -0.1, contextHint: 16384, callsFactor: 0.7 },
  small: { label: "Small", lines: "10K–50K lines", promptBoost: 1500, fillBoost: -0.05, contextHint: 32768, callsFactor: 0.85 },
  medium: { label: "Medium", lines: "50K–250K lines", promptBoost: 4000, fillBoost: 0, contextHint: 32768, callsFactor: 1 },
  large: { label: "Large", lines: "250K–1M lines", promptBoost: 8000, fillBoost: 0.08, contextHint: 65536, callsFactor: 1.3 },
  "very-large": { label: "Very large", lines: "1M+ lines", promptBoost: 12000, fillBoost: 0.12, contextHint: 65536, callsFactor: 1.6 },
};

export const CODING_STYLES: Record<CodingStyle, { label: string; calls: number; promptFactor: number }> = {
  questions: { label: "Ask coding questions", calls: 1, promptFactor: 0.4 },
  functions: { label: "Generate individual functions", calls: 1, promptFactor: 0.5 },
  "single-file": { label: "Edit individual files", calls: 2, promptFactor: 0.8 },
  "multi-file": { label: "Multi-file coding", calls: 5, promptFactor: 1 },
  "repo-reasoning": { label: "Repository-wide reasoning", calls: 6, promptFactor: 1.3 },
  agentic: { label: "Agentic coding", calls: 20, promptFactor: 1 },
  autonomous: { label: "Autonomous issue solving", calls: 40, promptFactor: 1.2 },
};

export const AGENT_BEHAVIORS: Record<AgentBehavior, { label: string; callsFactor: number; fillBoost: number; stepFactor: number }> = {
  occasional: { label: "Occasional tool calls", callsFactor: 0.5, fillBoost: -0.1, stepFactor: 0.7 },
  frequent: { label: "Frequent tool calls", callsFactor: 1, fillBoost: 0, stepFactor: 1 },
  "repeated-search": { label: "Repeated codebase searches", callsFactor: 1.4, fillBoost: 0.05, stepFactor: 1.4 },
  "long-autonomous": { label: "Long autonomous sessions", callsFactor: 2, fillBoost: 0.15, stepFactor: 1.1 },
  "multi-agent": { label: "Multiple agents concurrently", callsFactor: 1.2, fillBoost: 0.05, stepFactor: 1 },
};

export const DOCUMENT_SIZES: Record<DocumentSize, { label: string; tokens: number; hint: string }> = {
  short: { label: "Short", tokens: 4000, hint: "A few pages" },
  medium: { label: "Medium", tokens: 16000, hint: "A report or paper (~30 pages)" },
  long: { label: "Long", tokens: 48000, hint: "A long report or small book" },
  "very-long": { label: "Very long", tokens: 110000, hint: "A book or large spec" },
};

export const CONTEXT_STEPS = [4096, 8192, 16384, 32768, 65536, 131072];

const round = (n: number) => Math.round(n);
const nextContextStep = (tokens: number) => CONTEXT_STEPS.find((c) => c >= tokens) ?? CONTEXT_STEPS[CONTEXT_STEPS.length - 1];

export function parseWorkload(input: WorkloadProfileInput): WorkloadProfile {
  return WorkloadProfileSchema.parse(input);
}

export function resolveWorkload(rawInput: WorkloadProfileInput, tool: AITool): ResolvedWorkload {
  const input = parseWorkload(rawInput);
  const profile = getUseCase(input.useCase);
  const summary: string[] = [];

  let promptTokens = profile.promptTokens;
  let fill = profile.typicalFill;
  let calls = profile.callsPerTask;
  let stepNew = profile.stepNewTokens;
  let output = profile.outputTokens;
  let contextHint = profile.defaultContext;
  let agents = input.numberOfAgents;

  // Coding-specific shaping
  if (profile.isCoding) {
    if (input.codingStyle) {
      const style = CODING_STYLES[input.codingStyle];
      calls = Math.max(calls, style.calls);
      promptTokens = round(promptTokens * style.promptFactor);
      summary.push(style.label);
    }
    if (input.repositorySize) {
      const repo = REPO_SIZES[input.repositorySize];
      // Repo size is a signal for retrieval/prefill load — the whole repo is never sent.
      const repoWeight = input.codingStyle === "questions" || input.codingStyle === "functions" ? 0.3 : 1;
      promptTokens += round(repo.promptBoost * repoWeight);
      fill += repo.fillBoost * repoWeight;
      calls *= repoWeight === 1 ? repo.callsFactor : 1;
      if (repoWeight === 1) contextHint = Math.max(contextHint, repo.contextHint);
      summary.push(`${repo.label} repository (${repo.lines})`);
    }
    if (input.agentBehavior && (tool.agenticLoopIntensity > 0.3 || input.useCase === "agentic-coding" || input.useCase === "multi-agent")) {
      const b = AGENT_BEHAVIORS[input.agentBehavior];
      calls *= b.callsFactor;
      fill += b.fillBoost;
      stepNew = round(stepNew * b.stepFactor);
      if (input.agentBehavior === "multi-agent") agents = Math.max(agents, 2);
      summary.push(b.label);
    }
  }

  // Documents
  if (input.documentSize && ["document-analysis", "long-doc-qa", "rag", "research"].includes(input.useCase)) {
    const doc = DOCUMENT_SIZES[input.documentSize];
    promptTokens = input.useCase === "rag" ? Math.min(doc.tokens, 8000) : doc.tokens;
    contextHint = Math.max(contextHint, nextContextStep(promptTokens * 1.25 + output));
    summary.push(`${doc.label} documents (~${Math.round(doc.tokens / 1000)}K tokens)`);
  }

  if (input.useCase === "multi-agent") agents = Math.max(agents, 2);

  // Tool shaping: agentic tools send large system prompts + tool schemas every call
  // and loop many times per task.
  if (tool.agenticLoopIntensity >= 0.5 && profile.isCoding) {
    const share = input.useCase === "coding-questions" ? 0.15 : input.useCase === "coding-repo" ? 0.4 : 1;
    calls = Math.max(calls, tool.callsPerTask * share);
    fill = Math.max(fill, 0.35 + tool.contextPersistence * 0.35);
  } else if (tool.agenticLoopIntensity >= 0.5) {
    calls = Math.max(calls, Math.round(tool.callsPerTask * 0.4));
  }
  contextHint = Math.max(contextHint, tool.minContext);

  if (input.expectedPromptTokens) promptTokens = input.expectedPromptTokens;
  if (input.outputLength) output = input.outputLength;

  const contextWindow = input.desiredContextWindow ?? nextContextStep(contextHint);
  fill = Math.min(0.95, Math.max(0.1, fill));

  const coldPromptTokens = Math.min(contextWindow - output, tool.basePromptTokens + promptTokens);
  const typicalContextTokens = Math.min(
    Math.round(contextWindow * 0.95),
    Math.max(coldPromptTokens, Math.round(contextWindow * fill)),
  );

  const streams = Math.max(1, input.concurrentRequests * agents);

  if (input.desiredContextWindow) summary.push(`${Math.round(contextWindow / 1024)}K context window`);
  if (streams > 1) summary.push(`${streams} simultaneous ${streams === 1 ? "stream" : "streams"}`);

  const devEnvGB = devEnvReserveGB(input.devEnv, input.customDevEnvGB);

  // Intensity is a qualitative description for the UI.
  const load = (coldPromptTokens / 4000) * Math.log2(1 + calls) * streams + typicalContextTokens / 16000;
  const intensity = load > 30 ? "extreme" : load > 10 ? "heavy" : load > 3 ? "moderate" : "light";

  return {
    input: { ...input, numberOfAgents: agents },
    profile,
    tool,
    contextWindow,
    typicalContextTokens,
    coldPromptTokens: Math.max(1, coldPromptTokens),
    stepNewTokens: stepNew,
    outputTokens: output,
    callsPerTask: Math.max(1, Math.round(calls)),
    streams,
    devEnvGB,
    summary,
    intensity,
  };
}
