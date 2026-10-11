/**
 * Core domain schemas for Local AI Advisor.
 *
 * Layers are intentionally kept separate:
 *   AI Tool → Provider/API → Inference Runtime → Model → Hardware
 * A tool never performs inference itself; it talks to a runtime through an API.
 */
import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Sources & freshness                                                 */
/* ------------------------------------------------------------------ */

export const ConfidenceSchema = z.enum(["high", "medium", "low"]);
export type Confidence = z.infer<typeof ConfidenceSchema>;

export const SourceSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  lastVerified: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/),
  confidence: ConfidenceSchema,
  version: z.string().optional(),
  note: z.string().optional(),
});
export type Source = z.infer<typeof SourceSchema>;

/* ------------------------------------------------------------------ */
/* Hardware                                                            */
/* ------------------------------------------------------------------ */

export const OSSchema = z.enum(["macos", "linux", "windows"]);
export type OS = z.infer<typeof OSSchema>;

export const ComputeApiSchema = z.enum(["metal", "cuda", "rocm", "vulkan", "sycl", "cpu"]);
export type ComputeApi = z.infer<typeof ComputeApiSchema>;

export const VendorSchema = z.enum(["apple", "nvidia", "amd", "intel", "custom"]);
export type Vendor = z.infer<typeof VendorSchema>;

export const MemoryArchitectureSchema = z.enum(["unified", "discrete", "cpu-only"]);
export type MemoryArchitecture = z.infer<typeof MemoryArchitectureSchema>;

export const FormFactorSchema = z.enum(["laptop", "desktop", "mini", "workstation", "fanless-laptop"]);
export type FormFactor = z.infer<typeof FormFactorSchema>;

export const CPUSchema = z.object({
  name: z.string(),
  cores: z.number().int().positive(),
  arch: z.enum(["arm64", "x86_64"]),
  /** Rough sustained FP32 GFLOPS available to inference on CPU (for CPU-only prefill). */
  gflops: z.number().positive(),
});
export type CPU = z.infer<typeof CPUSchema>;

export const GPUSchema = z.object({
  name: z.string(),
  vendor: z.enum(["apple", "nvidia", "amd", "intel"]),
  cores: z.number().int().positive().optional(),
  /** Dedicated VRAM; undefined for integrated / unified GPUs. */
  vramGB: z.number().positive().optional(),
  bandwidthGBs: z.number().positive(),
  /** Approximate dense FP16 compute usable for matmul (TFLOPS). Drives prefill estimates. */
  fp16Tflops: z.number().positive(),
  apis: z.array(ComputeApiSchema),
  /**
   * Extra matrix throughput from in-GPU AI accelerators (e.g. Apple M5 "Neural
   * Accelerators") — only used by runtimes whose backend can exploit them.
   */
  acceleratedFp16Tflops: z.number().positive().optional(),
  architecture: z.string().optional(),
  cudaCapability: z.string().optional(),
  rocmSupport: z.enum(["official", "unofficial", "none"]).optional(),
  laptop: z.boolean().optional(),
});
export type GPU = z.infer<typeof GPUSchema>;

export const NPUSchema = z.object({ name: z.string(), tops: z.number().positive() });

export const HardwareConfigurationSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Benchmarks are reported per chip/GPU; configs sharing a chip share benchmarks. */
  chipKey: z.string(),
  /** Device family e.g. "MacBook Pro 14-inch", "Desktop PC". */
  device: z.string(),
  vendor: VendorSchema,
  formFactor: FormFactorSchema,
  year: z.number().int(),
  memoryArchitecture: MemoryArchitectureSchema,
  cpu: CPUSchema,
  gpu: GPUSchema.nullable(),
  npu: NPUSchema.optional(),
  /** System RAM (== unified memory on Apple / Strix Halo / DGX Spark). */
  systemRamGB: z.number().positive(),
  systemRamBandwidthGBs: z.number().positive(),
  /**
   * For unified memory: fraction of RAM the GPU may use by default
   * (macOS wired limit, BIOS/GTT carve-out on AMD).
   */
  gpuMemoryFraction: z.number().min(0).max(1).optional(),
  /** Max fraction if the user raises the limit (e.g. iogpu.wired_limit_mb). */
  gpuMemoryFractionRaised: z.number().min(0).max(1).optional(),
  os: z.array(OSSchema).min(1),
  approxPriceUSD: z.number().positive().optional(),
  tags: z.array(z.string()).default([]),
  /** Field-level evidence separates vendor facts from machine assumptions. */
  evidence: z.array(z.object({
    fields: z.array(z.string()).min(1),
    kind: z.enum(["vendor-spec", "derived", "assumption"]),
    source: SourceSchema,
    detail: z.string(),
  })).optional(),
  source: SourceSchema,
});
export type HardwareConfiguration = z.infer<typeof HardwareConfigurationSchema>;
export type HardwareConfigurationInput = z.input<typeof HardwareConfigurationSchema>;

/* ------------------------------------------------------------------ */
/* Models & quantization                                               */
/* ------------------------------------------------------------------ */

export const QuantIdSchema = z.enum(["q3", "q4", "q5", "q6", "q8", "fp8", "fp16", "mxfp4"]);
export type QuantId = z.infer<typeof QuantIdSchema>;

export const ModelFormatSchema = z.enum(["gguf", "mlx", "safetensors"]);
export type ModelFormat = z.infer<typeof ModelFormatSchema>;

export const QuantizationSchema = z.object({
  id: QuantIdSchema,
  label: z.string(),
  /** Effective bits per weight by format (includes scales/zero points). */
  bitsPerWeight: z.object({ gguf: z.number().optional(), mlx: z.number().optional(), safetensors: z.number().optional() }),
  /** Typical names per format (e.g. Q4_K_M, 4-bit, AWQ-INT4). */
  formatNames: z.object({ gguf: z.string().optional(), mlx: z.string().optional(), safetensors: z.string().optional() }),
  /** Relative quality loss vs full precision, 0 = lossless. Editorial approximation. */
  qualityLoss: z.number().min(0).max(1),
  description: z.string(),
});
export type Quantization = z.infer<typeof QuantizationSchema>;

export const ToolCallingSchema = z.enum(["reliable", "good", "basic", "none"]);
export type ToolCallingLevel = z.infer<typeof ToolCallingSchema>;

/** Editorial capability tiers on a 1–5 scale. Not benchmark scores. */
export const CapabilityTierSchema = z.number().min(0).max(5);

export const ModelArchitectureSchema = z.object({
  layers: z.number().int().positive(),
  kvHeads: z.number().int().positive(),
  headDim: z.number().int().positive(),
  /**
   * Fraction of layers holding a full-length KV cache. <1 for sliding-window
   * (Gemma 3, gpt-oss) or hybrid linear-attention (Qwen3-Next) models.
   */
  fullAttentionFraction: z.number().min(0).max(1).default(1),
  /** Size of the sliding window for the remaining layers (tokens). */
  slidingWindow: z.number().int().positive().optional(),
  /** Override KV bytes/token at FP16 for full-attention layers (e.g. MLA, mixed head sizes). */
  kvBytesPerTokenOverride: z.number().positive().optional(),
  /** Bytes/token across all sliding-window layers (when their head layout differs). */
  slidingKvBytesPerToken: z.number().positive().optional(),
});

export const ModelSchema = z.object({
  id: z.string(),
  organization: z.string(),
  family: z.string(),
  name: z.string(),
  variant: z.string().optional(),
  /** Billions of parameters. */
  parameterCount: z.number().positive(),
  /** Billions of parameters activated per token (== parameterCount for dense). */
  activeParameterCount: z.number().positive(),
  denseOrMoE: z.enum(["dense", "moe"]),
  contextWindow: z.number().int().positive(),
  modelType: z.enum(["chat", "coder", "reasoning", "vision", "general"]),
  useCases: z.array(z.string()),
  capabilities: z.object({
    general: CapabilityTierSchema,
    coding: CapabilityTierSchema,
    reasoning: CapabilityTierSchema,
    agentic: CapabilityTierSchema,
    longContext: CapabilityTierSchema,
    writing: CapabilityTierSchema,
  }),
  toolCalling: ToolCallingSchema,
  vision: z.boolean(),
  /** Has an explicit reasoning ("thinking") mode that produces long outputs. */
  thinking: z.boolean().default(false),
  architecture: ModelArchitectureSchema,
  supportedQuantizations: z.array(QuantIdSchema).min(1),
  supportedFormats: z.array(ModelFormatSchema).min(1),
  /** Known on-disk sizes (GB) per quant where published; otherwise derived from params × bpw. */
  knownSizeFormats: z.partialRecord(QuantIdSchema, ModelFormatSchema).optional(),
  knownSizesGB: z.partialRecord(QuantIdSchema, z.number().positive()).optional(),
  license: z.string(),
  releaseDate: z.string(),
  /** Hidden from recommendations (e.g. benchmark reference models). */
  referenceOnly: z.boolean().default(false),
  notes: z.string().optional(),
  source: SourceSchema,
});
export type Model = z.infer<typeof ModelSchema>;
export type ModelInput = z.input<typeof ModelSchema>;

/** A concrete (model, quantization) pair. */
export interface ModelVariant {
  model: Model;
  quant: Quantization;
  format: ModelFormat;
}

/* ------------------------------------------------------------------ */
/* APIs / providers, runtimes, tools                                   */
/* ------------------------------------------------------------------ */

export const ApiKindSchema = z.enum(["openai", "anthropic", "ollama"]);
export type ApiKind = z.infer<typeof ApiKindSchema>;

export const ProviderSchema = z.object({
  id: ApiKindSchema,
  name: z.string(),
  description: z.string(),
  source: SourceSchema,
});
export type Provider = z.infer<typeof ProviderSchema>;

export const BackendSupportSchema = z.object({
  api: ComputeApiSchema,
  maturity: z.enum(["mature", "good", "experimental"]),
  /** Fraction of peak memory bandwidth achieved during decode. */
  decodeEfficiency: z.number().min(0.05).max(1),
  /** Fraction of peak FP16 compute achieved during prefill. */
  prefillEfficiency: z.number().min(0.02).max(1),
  os: z.array(OSSchema),
  /** Uses in-GPU matrix accelerators when available (e.g. MLX on M5). */
  usesAccelerators: z.boolean().default(false),
  /** Engine family used for benchmark matching ("llama.cpp", "mlx", "vllm"…). */
  engine: z.string().optional(),
});
export type BackendSupport = z.infer<typeof BackendSupportSchema>;

export const RuntimeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  kind: z.enum(["engine", "app", "server"]),
  /** Underlying engine (LM Studio → llama.cpp / MLX, Ollama → llama.cpp-derived). */
  engine: z.string(),
  backends: z.array(BackendSupportSchema).min(1),
  formats: z.array(ModelFormatSchema),
  apis: z.array(ApiKindSchema),
  /** Requires Apple Silicon. */
  appleSiliconOnly: z.boolean().default(false),
  /** Restrict to hardware from these vendors (e.g. AMD's Lemonade). */
  hardwareVendors: z.array(VendorSchema).optional(),
  /**
   * How much per-stream speed degrades per extra concurrent request
   * (0 = perfect batching, 1 = fully serialized).
   */
  concurrencyPenalty: z.number().min(0).max(1),
  /** Reuses KV for shared prompt prefixes between turns. */
  promptCacheReuse: z.number().min(0).max(1),
  /** Fixed memory overhead beyond weights + KV (GB). */
  baseOverheadGB: z.number().min(0),
  supportsKvQuant: z.boolean(),
  audience: z.enum(["beginner", "intermediate", "advanced"]),
  apiServer: z.boolean(),
  docsUrl: z.string().url(),
  source: SourceSchema,
});
export type Runtime = z.infer<typeof RuntimeSchema>;
export type RuntimeInput = z.input<typeof RuntimeSchema>;

export const SupportLevelSchema = z.enum(["official", "community", "bridge", "experimental", "unsupported"]);
export type SupportLevel = z.infer<typeof SupportLevelSchema>;

export const ToolConnectionSchema = z.object({
  api: ApiKindSchema,
  level: SupportLevelSchema,
  /** Restrict to specific runtimes (e.g. Codex `--oss` → Ollama/LM Studio). */
  runtimes: z.array(z.string()).optional(),
  note: z.string().optional(),
});

export const AIToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  vendor: z.string(),
  category: z.enum(["coding-agent", "ide-agent", "ide-assistant", "chat-ui", "runtime-app", "api", "automation"]),
  description: z.string(),
  interactionPattern: z.enum(["conversational", "inline-assist", "agentic-loop", "batch", "server"]),
  /** Typical tokens of system prompt + tool schemas sent each request. */
  basePromptTokens: z.number().int().nonnegative(),
  /** 0–1: how heavily it loops through sequential model calls. */
  agenticLoopIntensity: z.number().min(0).max(1),
  /** 0–1: how much conversation/tool history persists in context. */
  contextPersistence: z.number().min(0).max(1),
  toolCallingIntensity: z.enum(["none", "light", "heavy"]),
  /** Typical sequential model calls per user task. */
  callsPerTask: z.number().positive(),
  /** Minimum context window the tool realistically needs. */
  minContext: z.number().int().positive(),
  recommendedLatencyClass: z.enum(["relaxed", "interactive", "fast"]),
  recommendedPromptProcessingClass: z.enum(["low", "medium", "high", "very-high"]),
  parallelism: z.enum(["single", "occasional-parallel", "parallel-subagents"]),
  nativeLocalSupport: z.boolean(),
  connections: z.array(ToolConnectionSchema),
  /** Whether the tool can run without any model (e.g. API only / custom app). */
  generic: z.boolean().default(false),
  documentationURL: z.string().url(),
  lastVerified: z.string(),
  source: SourceSchema,
});
export type AITool = z.infer<typeof AIToolSchema>;
export type AIToolInput = z.input<typeof AIToolSchema>;

/* ------------------------------------------------------------------ */
/* Benchmarks                                                          */
/* ------------------------------------------------------------------ */

export const KvCacheTypeSchema = z.enum(["f16", "q8", "q4"]);

export const BenchmarkSchema = z.object({
  id: z.string(),
  hardwareId: z.string(),
  /** Benchmarks are often reported per chip/GPU; matched by hardware "chip key". */
  chipKey: z.string(),
  modelId: z.string(),
  quant: QuantIdSchema,
  quantLabel: z.string(),
  /** Absent legacy settings remain unknown; the engine labels its assumptions. */
  referenceSettings: z.object({
    format: ModelFormatSchema,
    kvCacheType: KvCacheTypeSchema,
    offloadFraction: z.number().min(0).max(1),
    batteryPenalty: z.number().positive().max(1),
    runtimeVersion: z.string().optional(),
    batchSize: z.number().int().positive().optional(),
    rawLogUrl: z.string().url().optional(),
  }).optional(),
  runtimeId: z.string(),
  backend: ComputeApiSchema,
  contextTokens: z.number().int().nonnegative(),
  promptTokens: z.number().int().positive(),
  outputTokens: z.number().int().positive(),
  generationTps: z.number().positive(),
  prefillTps: z.number().positive().optional(),
  timeToFirstTokenSec: z.number().positive().optional(),
  memoryGB: z.number().positive().optional(),
  source: SourceSchema,
  date: z.string(),
  verified: z.boolean(),
});
export type Benchmark = z.infer<typeof BenchmarkSchema>;

/* ------------------------------------------------------------------ */
/* Workloads                                                           */
/* ------------------------------------------------------------------ */

export const UseCaseIdSchema = z.enum([
  "casual-chat",
  "general-assistant",
  "coding-questions",
  "coding-repo",
  "agentic-coding",
  "reasoning",
  "research",
  "document-analysis",
  "long-doc-qa",
  "writing",
  "vision",
  "data-analysis",
  "rag",
  "api-server",
  "multi-agent",
  "background-automation",
]);
export type UseCaseId = z.infer<typeof UseCaseIdSchema>;

export const RepoSizeSchema = z.enum(["tiny", "small", "medium", "large", "very-large"]);
export type RepoSize = z.infer<typeof RepoSizeSchema>;

export const CodingStyleSchema = z.enum([
  "questions",
  "functions",
  "single-file",
  "multi-file",
  "repo-reasoning",
  "agentic",
  "autonomous",
]);
export type CodingStyle = z.infer<typeof CodingStyleSchema>;

export const AgentBehaviorSchema = z.enum(["occasional", "frequent", "repeated-search", "long-autonomous", "multi-agent"]);
export type AgentBehavior = z.infer<typeof AgentBehaviorSchema>;

export const DevEnvPresetSchema = z.enum(["none", "light", "normal", "heavy", "very-heavy", "custom"]);
export type DevEnvPreset = z.infer<typeof DevEnvPresetSchema>;

export const DevelopmentEnvironmentSchema = z.object({
  preset: DevEnvPresetSchema,
  label: z.string(),
  description: z.string(),
  reserveGB: z.number().min(0),
});
export type DevelopmentEnvironment = z.infer<typeof DevelopmentEnvironmentSchema>;

export const PrioritySchema = z.enum(["speed", "balanced", "quality"]);
export type Priority = z.infer<typeof PrioritySchema>;

export type KvCacheType = z.infer<typeof KvCacheTypeSchema>;

export const ComfortTargetSchema = z.enum(["usable", "comfortable", "excellent"]);
export type ComfortTarget = z.infer<typeof ComfortTargetSchema>;

export const DocumentSizeSchema = z.enum(["short", "medium", "long", "very-long"]);
export type DocumentSize = z.infer<typeof DocumentSizeSchema>;

/** The user's description of what they want to do. */
export const WorkloadProfileSchema = z.object({
  useCase: UseCaseIdSchema,
  toolId: z.string(),
  codingStyle: CodingStyleSchema.optional(),
  repositorySize: RepoSizeSchema.optional(),
  agentBehavior: AgentBehaviorSchema.optional(),
  documentSize: DocumentSizeSchema.optional(),
  /** Desired context window in tokens. Undefined → derived from use case. */
  desiredContextWindow: z.number().int().positive().optional(),
  expectedPromptTokens: z.number().int().positive().optional(),
  outputLength: z.number().int().positive().optional(),
  priority: PrioritySchema.default("balanced"),
  concurrentRequests: z.number().int().min(1).max(64).default(1),
  numberOfAgents: z.number().int().min(1).max(16).default(1),
  devEnv: DevEnvPresetSchema.default("normal"),
  customDevEnvGB: z.number().min(0).max(512).optional(),
  multimodalRequired: z.boolean().default(false),
  batterySensitive: z.boolean().default(false),
  sessionLength: z.enum(["short", "medium", "long"]).default("medium"),
  /* Advanced */
  kvCacheType: KvCacheTypeSchema.default("f16"),
  osReserveGB: z.number().min(0).max(64).optional(),
  raiseGpuMemoryLimit: z.boolean().default(false),
  /** 0–1 manual GPU offload fraction; undefined = automatic. */
  gpuOffload: z.number().min(0).max(1).optional(),
  batchSize: z.number().int().min(64).max(8192).default(512),
});
export type WorkloadProfile = z.infer<typeof WorkloadProfileSchema>;
export type WorkloadProfileInput = z.input<typeof WorkloadProfileSchema>;

/* ------------------------------------------------------------------ */
/* Compatibility rules                                                 */
/* ------------------------------------------------------------------ */

export const CompatibilityRuleSchema = z.object({
  id: z.string(),
  layer: z.enum(["hardware-runtime", "runtime-model", "tool-runtime", "model-usecase"]),
  description: z.string(),
  severity: z.enum(["blocker", "warning", "info"]),
});
export type CompatibilityRule = z.infer<typeof CompatibilityRuleSchema>;
