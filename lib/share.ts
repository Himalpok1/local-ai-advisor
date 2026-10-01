/**
 * Shareable configuration state ⇄ URL query string.
 * Every field is validated on the way in; invalid values are dropped, never trusted.
 */
import { z } from "zod";
import {
  AgentBehaviorSchema,
  CodingStyleSchema,
  ComfortTargetSchema,
  DevEnvPresetSchema,
  DocumentSizeSchema,
  KvCacheTypeSchema,
  OSSchema,
  PrioritySchema,
  QuantIdSchema,
  RepoSizeSchema,
  UseCaseIdSchema,
  type HardwareConfiguration,
  type OS,
  type QuantId,
  type WorkloadProfileInput,
} from "@/lib/schemas";
import { HARDWARE_MAP, MODEL_MAP, RUNTIME_MAP, TOOL_MAP, buildCustomHardware, type CustomHardwareInput } from "@/data";

const num = (min: number, max: number) => z.coerce.number().min(min).max(max);
const int = (min: number, max: number) => z.coerce.number().int().min(min).max(max);
const bool = z.enum(["1", "0"]).transform((v) => v === "1");

export const CustomHardwareSchema = z.object({
  name: z.string().max(80).optional(),
  architecture: z.enum(["unified", "discrete", "cpu-only"]),
  gpuVendor: z.enum(["apple", "nvidia", "amd", "intel"]).optional(),
  vramGB: num(1, 512).optional(),
  ramGB: num(2, 2048),
  bandwidthGBs: num(10, 10000),
  ramBandwidthGBs: num(10, 2000).optional(),
  tflops: num(0.5, 5000).optional(),
  os: OSSchema,
  laptop: z.boolean().optional(),
});

export interface AppState {
  hardwareId?: string;
  custom?: CustomHardwareInput;
  os?: OS;
  modelId?: string;
  quant?: QuantId;
  runtimeId?: string;
  workload: WorkloadProfileInput;
  target?: z.infer<typeof ComfortTargetSchema>;
  budget?: number;
  mode?: "simple" | "advanced";
}

/** Map between workload fields and short URL keys. */
const WORKLOAD_KEYS: [keyof WorkloadProfileInput, string, z.ZodType][] = [
  ["useCase", "uc", UseCaseIdSchema],
  ["toolId", "tool", z.string().refine((t) => TOOL_MAP.has(t))],
  ["codingStyle", "cs", CodingStyleSchema],
  ["repositorySize", "repo", RepoSizeSchema],
  ["agentBehavior", "ab", AgentBehaviorSchema],
  ["documentSize", "doc", DocumentSizeSchema],
  ["desiredContextWindow", "ctx", int(1024, 2_097_152)],
  ["expectedPromptTokens", "pt", int(1, 2_000_000)],
  ["outputLength", "out", int(1, 200_000)],
  ["priority", "pr", PrioritySchema],
  ["concurrentRequests", "cr", int(1, 64)],
  ["numberOfAgents", "ag", int(1, 16)],
  ["devEnv", "dev", DevEnvPresetSchema],
  ["customDevEnvGB", "devgb", num(0, 512)],
  ["multimodalRequired", "mm", bool],
  ["batterySensitive", "bat", bool],
  ["sessionLength", "sess", z.enum(["short", "medium", "long"])],
  ["kvCacheType", "kv", KvCacheTypeSchema],
  ["osReserveGB", "osr", num(0, 64)],
  ["raiseGpuMemoryLimit", "raise", bool],
  ["gpuOffload", "off", num(0, 1)],
  ["batchSize", "bs", int(64, 8192)],
];

export const DEFAULT_WORKLOAD: WorkloadProfileInput = { useCase: "agentic-coding", toolId: "opencode", repositorySize: "medium", priority: "balanced", devEnv: "normal" };

export function encodeState(s: AppState): string {
  const p = new URLSearchParams();
  if (s.hardwareId) p.set("hw", s.hardwareId);
  if (s.hardwareId === "custom" && s.custom) p.set("custom", btoaSafe(JSON.stringify(s.custom)));
  if (s.os) p.set("os", s.os);
  if (s.modelId) p.set("m", s.modelId);
  if (s.quant) p.set("q", s.quant);
  if (s.runtimeId) p.set("rt", s.runtimeId);
  if (s.target) p.set("tgt", s.target);
  if (s.budget) p.set("budget", String(s.budget));
  if (s.mode === "advanced") p.set("mode", "advanced");
  for (const [field, key] of WORKLOAD_KEYS) {
    const v = s.workload[field];
    if (v === undefined || v === null) continue;
    p.set(key, typeof v === "boolean" ? (v ? "1" : "0") : String(v));
  }
  return p.toString();
}

export function decodeState(params: URLSearchParams | Record<string, string | string[] | undefined>, fallback: WorkloadProfileInput = DEFAULT_WORKLOAD): AppState {
  const get = (k: string): string | undefined => {
    if (params instanceof URLSearchParams) return params.get(k) ?? undefined;
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const workload: Record<string, unknown> = { ...fallback };
  for (const [field, key, schema] of WORKLOAD_KEYS) {
    const raw = get(key);
    if (raw === undefined) continue;
    const r = schema.safeParse(raw);
    if (r.success) workload[field] = r.data;
  }
  const state: AppState = { workload: workload as WorkloadProfileInput };
  const hw = get("hw");
  if (hw && (HARDWARE_MAP.has(hw) || hw === "custom")) state.hardwareId = hw;
  if (hw === "custom") {
    try {
      const parsed = CustomHardwareSchema.safeParse(JSON.parse(atobSafe(get("custom") ?? "")));
      if (parsed.success) state.custom = parsed.data;
      else state.hardwareId = undefined;
    } catch {
      state.hardwareId = undefined;
    }
  }
  const os = OSSchema.safeParse(get("os"));
  if (os.success) state.os = os.data;
  const m = get("m");
  if (m && MODEL_MAP.has(m)) state.modelId = m;
  const q = QuantIdSchema.safeParse(get("q"));
  if (q.success) state.quant = q.data;
  const rt = get("rt");
  if (rt && RUNTIME_MAP.has(rt)) state.runtimeId = rt;
  const tgt = ComfortTargetSchema.safeParse(get("tgt"));
  if (tgt.success) state.target = tgt.data;
  const budget = num(100, 1_000_000).safeParse(get("budget"));
  if (budget.success) state.budget = budget.data;
  if (get("mode") === "advanced") state.mode = "advanced";
  return state;
}

export function resolveHardware(s: Pick<AppState, "hardwareId" | "custom">): HardwareConfiguration | undefined {
  if (s.hardwareId === "custom" && s.custom) return buildCustomHardware(s.custom);
  return s.hardwareId ? HARDWARE_MAP.get(s.hardwareId) : undefined;
}

function btoaSafe(s: string): string {
  return typeof btoa === "function" ? btoa(s) : Buffer.from(s, "utf8").toString("base64");
}
function atobSafe(s: string): string {
  return typeof atob === "function" ? atob(s) : Buffer.from(s, "base64").toString("utf8");
}
