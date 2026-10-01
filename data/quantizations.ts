import type { QuantId, Quantization } from "@/lib/schemas";

/**
 * Bits-per-weight figures are effective averages including block scales:
 * GGUF k-quants per llama.cpp's quantize table, MLX affine quantization with
 * group size 64 (+fp16 scale and bias → +0.5 bpw), AWQ/GPTQ-style INT4 for safetensors.
 * Quality loss values are editorial approximations used only for ranking.
 */
export const QUANTIZATIONS: Record<QuantId, Quantization> = {
  q3: {
    id: "q3",
    label: "Q3",
    bitsPerWeight: { gguf: 3.91, mlx: 3.5 },
    formatNames: { gguf: "Q3_K_M", mlx: "3-bit" },
    qualityLoss: 0.12,
    description: "Aggressive compression. Noticeable quality loss, especially for coding and small models.",
  },
  q4: {
    id: "q4",
    label: "Q4",
    bitsPerWeight: { gguf: 4.85, mlx: 4.5, safetensors: 4.25 },
    formatNames: { gguf: "Q4_K_M", mlx: "4-bit", safetensors: "AWQ / GPTQ INT4" },
    qualityLoss: 0.04,
    description: "The usual sweet spot: roughly a quarter of FP16 size with small quality loss.",
  },
  q5: {
    id: "q5",
    label: "Q5",
    bitsPerWeight: { gguf: 5.69, mlx: 5.5 },
    formatNames: { gguf: "Q5_K_M", mlx: "5-bit" },
    qualityLoss: 0.022,
    description: "Slightly larger than Q4 with measurably lower loss.",
  },
  q6: {
    id: "q6",
    label: "Q6",
    bitsPerWeight: { gguf: 6.59, mlx: 6.5 },
    formatNames: { gguf: "Q6_K", mlx: "6-bit" },
    qualityLoss: 0.01,
    description: "Near-lossless for most tasks.",
  },
  q8: {
    id: "q8",
    label: "Q8",
    bitsPerWeight: { gguf: 8.5, mlx: 8.5, safetensors: 8.0 },
    formatNames: { gguf: "Q8_0", mlx: "8-bit", safetensors: "INT8" },
    qualityLoss: 0.003,
    description: "Practically lossless, about half of FP16 size. Slower decode than Q4 (more bytes per token).",
  },
  fp8: {
    id: "fp8",
    label: "FP8",
    bitsPerWeight: { gguf: 8, safetensors: 8 },
    formatNames: { gguf: "FP8", safetensors: "fp8" },
    qualityLoss: 0.003,
    description: "8-bit floating point. Runtime and architecture support varies; quality loss is estimated.",
  },
  fp16: {
    id: "fp16",
    label: "FP16 / BF16",
    bitsPerWeight: { gguf: 16, mlx: 16, safetensors: 16 },
    formatNames: { gguf: "F16 / BF16", mlx: "bf16", safetensors: "BF16" },
    qualityLoss: 0,
    description: "Full precision. Rarely worth the memory for local use.",
  },
  mxfp4: {
    id: "mxfp4",
    label: "MXFP4 (native)",
    bitsPerWeight: { gguf: 4.25, mlx: 4.25, safetensors: 4.25 },
    formatNames: { gguf: "MXFP4", mlx: "MXFP4", safetensors: "MXFP4" },
    qualityLoss: 0,
    description: "Native 4-bit format the model was trained/released in (gpt-oss). No additional loss.",
  },
};

export const QUANT_ORDER: QuantId[] = ["q3", "q4", "q5", "q6", "q8", "fp8", "fp16", "mxfp4"];

export function getQuant(id: QuantId): Quantization {
  return QUANTIZATIONS[id];
}
