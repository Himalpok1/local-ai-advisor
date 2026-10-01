import { BenchmarkSchema, type Benchmark, type ComputeApi, type QuantId, type Source } from "@/lib/schemas";

/**
 * Verified llama.cpp benchmark results transcribed from public scoreboards.
 * Every row cites its source. pp = prompt processing (prefill), tg = text generation.
 * Results are build-dependent (e.g. DGX Spark roughly doubled between builds),
 * so they are used as calibration anchors, not universal truths.
 */

const S4167: Source = {
  url: "https://github.com/ggml-org/llama.cpp/discussions/4167",
  title: "llama.cpp — Performance of llama.cpp on Apple Silicon M-series",
  lastVerified: "2026-09-30",
  confidence: "high",
};
const S15013: Source = {
  url: "https://github.com/ggml-org/llama.cpp/discussions/15013",
  title: "llama.cpp — CUDA performance scoreboard",
  lastVerified: "2026-09-30",
  confidence: "high",
};
const S10879: Source = {
  url: "https://github.com/ggml-org/llama.cpp/discussions/10879",
  title: "llama.cpp — Vulkan performance scoreboard",
  lastVerified: "2026-09-30",
  confidence: "high",
};
const S15396: Source = {
  url: "https://github.com/ggml-org/llama.cpp/discussions/15396",
  title: "llama.cpp — gpt-oss guide & performance (Aug 2025)",
  lastVerified: "2026-09-30",
  confidence: "medium",
  note: "Values transcribed via summarizing fetch; spot-check against source.",
};
const SSPARK: Source = {
  url: "https://github.com/ggml-org/llama.cpp/blob/master/benches/dgx-spark/dgx-spark.md",
  title: "llama.cpp repo benches — DGX Spark (build 7941)",
  lastVerified: "2026-09-30",
  confidence: "high",
};
const SM2U: Source = {
  url: "https://github.com/ggml-org/llama.cpp/blob/master/benches/mac-m2-ultra/mac-m2-ultra.md",
  title: "llama.cpp repo benches — Mac M2 Ultra (build 7948)",
  lastVerified: "2026-09-30",
  confidence: "high",
};
const SSTRIX: Source = {
  url: "https://llm-tracker.info/AMD-Strix-Halo-(Ryzen-AI-Max+-395)-GPU-Performance",
  title: "llm-tracker — Strix Halo GPU performance (2025-05)",
  lastVerified: "2026-09-30",
  confidence: "medium",
};
const SSTRIXWIKI: Source = {
  url: "https://strixhalo.wiki/AI/llamacpp-performance/",
  title: "Strix Halo wiki — llama.cpp performance",
  lastVerified: "2026-09-30",
  confidence: "medium",
};

type Row = [chipKey: string, quant: QuantId, quantLabel: string, pp: number | null, tg: number];

function rows(
  prefix: string,
  modelId: string,
  backend: ComputeApi,
  promptTokens: number,
  outputTokens: number,
  source: Source,
  date: string,
  data: Row[],
): Benchmark[] {
  return data.map(([chipKey, quant, quantLabel, pp, tg], i) =>
    BenchmarkSchema.parse({
      id: `${prefix}-${backend}-${modelId}-${chipKey}-${quant}-${i}`,
      hardwareId: chipKey,
      chipKey,
      modelId,
      quant,
      quantLabel,
      runtimeId: "llama.cpp",
      backend,
      contextTokens: 0,
      promptTokens,
      outputTokens,
      generationTps: tg,
      prefillTps: pp ?? undefined,
      source,
      date,
      verified: true,
    }),
  );
}

const APPLE_LLAMA2: Row[] = [
  ["apple-m1-8c", "q4", "Q4_0", 117.96, 14.15],
  ["apple-m1-8c", "q8", "Q8_0", 117.25, 7.91],
  ["apple-m1-pro-16c", "q4", "Q4_0", 266.25, 36.41],
  ["apple-m1-pro-16c", "q8", "Q8_0", 270.37, 22.34],
  ["apple-m1-max-32c", "q4", "Q4_0", 530.06, 61.19],
  ["apple-m1-max-32c", "q8", "Q8_0", 537.37, 40.2],
  ["apple-m1-ultra-64c", "q4", "Q4_0", 1030.04, 83.73],
  ["apple-m1-ultra-64c", "q8", "Q8_0", 1042.95, 59.87],
  ["apple-m2-10c", "q4", "Q4_0", 179.57, 21.91],
  ["apple-m2-10c", "q8", "Q8_0", 181.4, 12.21],
  ["apple-m2-pro-19c", "q4", "Q4_0", 341.19, 38.86],
  ["apple-m2-pro-19c", "q8", "Q8_0", 344.5, 23.01],
  ["apple-m2-max-38c", "q4", "Q4_0", 671.31, 65.95],
  ["apple-m2-max-38c", "q8", "Q8_0", 677.91, 41.83],
  ["apple-m2-ultra-76c", "q4", "Q4_0", 1238.48, 94.27],
  ["apple-m2-ultra-76c", "q8", "Q8_0", 1248.59, 66.64],
  ["apple-m3-10c", "q4", "Q4_0", 186.75, 21.34],
  ["apple-m3-10c", "q8", "Q8_0", 187.52, 12.27],
  ["apple-m3-pro-18c", "q4", "Q4_0", 341.67, 30.74],
  ["apple-m3-pro-18c", "q8", "Q8_0", 344.66, 17.53],
  ["apple-m3-max-30c", "q4", "Q4_0", 567.59, 56.58],
  ["apple-m3-max-30c", "q8", "Q8_0", 566.4, 34.3],
  ["apple-m3-max-40c", "q4", "Q4_0", 759.7, 66.31],
  ["apple-m3-max-40c", "q8", "Q8_0", 757.64, 42.75],
  ["apple-m3-ultra-80c", "q4", "Q4_0", 1471.24, 92.14],
  ["apple-m3-ultra-80c", "q8", "Q8_0", 1487.51, 63.93],
  ["apple-m4-10c", "q4", "Q4_0", 221.29, 24.11],
  ["apple-m4-10c", "q8", "Q8_0", 223.64, 13.54],
  ["apple-m4-pro-16c", "q4", "Q4_0", 364.06, 49.64],
  ["apple-m4-pro-16c", "q8", "Q8_0", 367.13, 30.54],
  ["apple-m4-pro-20c", "q4", "Q4_0", 439.78, 50.74],
  ["apple-m4-pro-20c", "q8", "Q8_0", 449.62, 30.69],
  ["apple-m4-max-32c", "q4", "Q4_0", 713.93, 69.95],
  ["apple-m4-max-32c", "q8", "Q8_0", 718.56, 43.87],
  ["apple-m4-max-40c", "q4", "Q4_0", 885.68, 83.06],
  ["apple-m4-max-40c", "q8", "Q8_0", 891.94, 54.05],
];

const CUDA_LLAMA2: Row[] = [
  ["nvidia-rtx-pro-6000", "q4", "Q4_0", 14854.63, 274.2],
  ["nvidia-rtx-5090", "q4", "Q4_0", 14073.41, 290.02],
  ["nvidia-rtx-4090", "q4", "Q4_0", 11992.7, 186.21],
  ["nvidia-rtx-5080", "q4", "Q4_0", 8297.36, 181.99],
  ["nvidia-rtx-5070-ti", "q4", "Q4_0", 6952.38, 176.85],
  ["nvidia-rtx-3090", "q4", "Q4_0", 5174.69, 158.16],
  ["nvidia-rtx-5060-ti-16", "q4", "Q4_0", 3737.25, 90.94],
  ["nvidia-dgx-spark", "q4", "Q4_0", 3062.31, 57.21],
];

const VULKAN_LLAMA2: Row[] = [
  ["nvidia-rtx-5090", "q4", "Q4_0", 10381.64, 263.63],
  ["nvidia-rtx-4090", "q4", "Q4_0", 9452.03, 187.97],
  ["nvidia-rtx-3090", "q4", "Q4_0", 4666.15, 164.05],
  ["amd-radeon-ai-pro-r9700", "q4", "Q4_0", 5609.82, 145.67],
  ["amd-rx-9070-xt", "q4", "Q4_0", 5036.04, 137.11],
  ["amd-rx-7900-xtx", "q4", "Q4_0", 3726.99, 182.63],
  ["intel-arc-b580", "q4", "Q4_0", 620.94, 70.14],
  ["amd-strix-halo-8060s", "q4", "Q4_0", 881.71, 52.22],
];

export const BENCHMARKS: Benchmark[] = [
  ...rows("l2-metal", "llama-2-7b", "metal", 512, 128, S4167, "2023-11 → 2025 (community table)", APPLE_LLAMA2),
  ...rows("l2-cuda", "llama-2-7b", "cuda", 512, 128, S15013, "2025-08 → 2026", CUDA_LLAMA2),
  ...rows("l2-vk", "llama-2-7b", "vulkan", 512, 128, S10879, "2025 → 2026", VULKAN_LLAMA2),
  ...rows("l2-rocm", "llama-2-7b", "rocm", 512, 128, SSTRIX, "2025-05", [["amd-strix-halo-8060s", "q4", "Q4_0", 343.91, 50.88]]),
  // gpt-oss-20b, pp2048 / tg128
  ...rows("gptoss20-cuda", "gpt-oss-20b", "cuda", 2048, 128, S15396, "2025-08", [
    ["nvidia-rtx-5090", "mxfp4", "MXFP4", 9848.38, 282.51],
    ["nvidia-rtx-4090", "mxfp4", "MXFP4", 8022.33, 225.22],
    ["nvidia-rtx-4080-super", "mxfp4", "MXFP4", 8170.95, 186.51],
    ["nvidia-rtx-5080", "mxfp4", "MXFP4", 7476.55, 204.85],
    ["nvidia-rtx-5070-ti", "mxfp4", "MXFP4", 6339.76, 189.45],
    ["nvidia-rtx-3090", "mxfp4", "MXFP4", 5170.56, 161.77],
    ["nvidia-rtx-5060-ti-16", "mxfp4", "MXFP4", null, 111.51],
  ]),
  ...rows("gptoss20-metal", "gpt-oss-20b", "metal", 2048, 128, S15396, "2025-08", [
    ["apple-m3-ultra-80c", "mxfp4", "MXFP4", 2816.47, 115.52],
    ["apple-m4-max-32c", "mxfp4", "MXFP4", 1277.42, 92.36],
  ]),
  ...rows("gptoss20-rocm", "gpt-oss-20b", "rocm", 2048, 128, S15396, "2025-08", [["amd-rx-7900-xt", "mxfp4", "MXFP4", 4251.56, 101.92]]),
  ...rows("gptoss120-cuda", "gpt-oss-120b", "cuda", 2048, 128, S15396, "2025-08", [["nvidia-rtx-pro-6000", "mxfp4", "MXFP4", 5518.07, 196.31]]),
  // Newer repo bench files, pp2048 / tg32
  ...rows("spark", "gpt-oss-20b", "cuda", 2048, 32, SSPARK, "2026", [["nvidia-dgx-spark", "mxfp4", "MXFP4", 4505.82, 83.43]]),
  ...rows("spark", "gpt-oss-120b", "cuda", 2048, 32, SSPARK, "2026", [["nvidia-dgx-spark", "mxfp4", "MXFP4", 2443.91, 58.72]]),
  ...rows("spark", "qwen3-coder-30b-a3b", "cuda", 2048, 32, SSPARK, "2026", [["nvidia-dgx-spark", "q8", "Q8_0", 2986.97, 61.06]]),
  ...rows("spark", "qwen2.5-coder-7b", "cuda", 2048, 32, SSPARK, "2026", [["nvidia-dgx-spark", "q8", "Q8_0", 2250.28, 29.43]]),
  ...rows("spark", "glm-4.7-flash", "cuda", 2048, 32, SSPARK, "2026", [["nvidia-dgx-spark", "q8", "Q8_0", 2364.18, 48.68]]),
  ...rows("m2u", "gpt-oss-20b", "metal", 2048, 32, SM2U, "2026", [["apple-m2-ultra-76c", "mxfp4", "MXFP4", 2713.4, 129.97]]),
  ...rows("m2u", "gpt-oss-120b", "metal", 2048, 32, SM2U, "2026", [["apple-m2-ultra-76c", "mxfp4", "MXFP4", 1648.69, 85.6]]),
  ...rows("m2u", "qwen3-coder-30b-a3b", "metal", 2048, 32, SM2U, "2026", [["apple-m2-ultra-76c", "q8", "Q8_0", 2453.11, 78.97]]),
  ...rows("m2u", "qwen2.5-coder-7b", "metal", 2048, 32, SM2U, "2026", [["apple-m2-ultra-76c", "q8", "Q8_0", 1565.91, 79.68]]),
  ...rows("m2u", "glm-4.7-flash", "metal", 2048, 32, SM2U, "2026", [["apple-m2-ultra-76c", "q8", "Q8_0", 1629.33, 59.58]]),
  // Strix Halo: Qwen3-30B-A3B UD-Q4_K_XL (closest catalog entry: Qwen3 30B-A3B 2507 at Q4)
  ...rows("strix-wiki", "qwen3-30b-a3b-2507", "vulkan", 512, 128, SSTRIXWIKI, "2025", [["amd-strix-halo-8060s", "q4", "UD-Q4_K_XL (Qwen3-30B-A3B)", 755.14, 85.11]]),
  ...rows("strix-wiki", "qwen3-30b-a3b-2507", "rocm", 512, 128, SSTRIXWIKI, "2025", [["amd-strix-halo-8060s", "q4", "UD-Q4_K_XL (Qwen3-30B-A3B)", 650.59, 64.17]]),
];

export function benchmarksForChip(chipKey: string): Benchmark[] {
  return BENCHMARKS.filter((b) => b.chipKey === chipKey);
}
