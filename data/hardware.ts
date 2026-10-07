import {
  HardwareConfigurationSchema,
  type HardwareConfiguration,
  type HardwareConfigurationInput,
  type Source,
} from "@/lib/schemas";

/* ------------------------------------------------------------------ */
/* Apple Silicon                                                       */
/* ------------------------------------------------------------------ */

interface AppleChip {
  key: string;
  name: string;
  generation: number;
  cpuCores: number;
  gpuCores: number;
  bandwidth: number;
  /** FP32≈FP16 GPU TFLOPS (approximate: cores × per-core rate). */
  tflops: number;
  /** M5+: GPU Neural Accelerators used by MLX for matmul. Approximation of Apple's "up to 4× prefill" claim. */
  accel?: number;
  source: Source;
}

const SRC_4167: Source = {
  url: "https://github.com/ggml-org/llama.cpp/discussions/4167",
  title: "llama.cpp Apple Silicon performance table",
  lastVerified: "2026-09-30",
  confidence: "high",
};
const SRC_M5_PRO_MAX: Source = {
  url: "https://support.apple.com/en-us/126318",
  title: "Apple tech specs — MacBook Pro (M5 Pro / M5 Max)",
  lastVerified: "2026-09-30",
  confidence: "high",
};
const SRC_M5: Source = { url: "https://support.apple.com/en-us/125405", title: "Apple tech specs — MacBook Pro (M5)", lastVerified: "2026-09-30", confidence: "high" };
const SRC_STUDIO_2026: Source = {
  url: "https://www.apple.com/newsroom/2026/08/apple-introduces-new-mac-studio-with-m5-max-and-m5-ultra/",
  title: "Apple Newsroom — Mac Studio with M5 Max and M5 Ultra",
  lastVerified: "2026-09-30",
  confidence: "medium",
  note: "Memory configurations below are partially assumed; verify on apple.com.",
};
const SRC_MINI_2026: Source = {
  url: "https://www.apple.com/newsroom/2026/09/the-new-mac-mini-and-mac-studio-are-available-today/",
  title: "Apple Newsroom — new Mac mini and Mac Studio",
  lastVerified: "2026-09-30",
  confidence: "medium",
};
const SRC_M3_ULTRA: Source = {
  url: "https://www.apple.com/newsroom/2025/03/apple-unveils-new-mac-studio-the-most-powerful-mac-ever/",
  title: "Apple Newsroom — Mac Studio (M4 Max / M3 Ultra)",
  lastVerified: "2026-09-30",
  confidence: "medium",
  note: "Apple states \"over 800GB/s\"; 819 GB/s is the commonly cited spec.",
};

const chip = (c: AppleChip) => c;
export const APPLE_CHIPS: Record<string, AppleChip> = Object.fromEntries(
  [
    chip({ key: "m1-8c", name: "M1 (8-core GPU)", generation: 1, cpuCores: 8, gpuCores: 8, bandwidth: 68, tflops: 2.6, source: SRC_4167 }),
    chip({ key: "m1-pro-16c", name: "M1 Pro (16-core GPU)", generation: 1, cpuCores: 10, gpuCores: 16, bandwidth: 200, tflops: 5.2, source: SRC_4167 }),
    chip({ key: "m1-max-32c", name: "M1 Max (32-core GPU)", generation: 1, cpuCores: 10, gpuCores: 32, bandwidth: 400, tflops: 10.4, source: SRC_4167 }),
    chip({ key: "m1-ultra-64c", name: "M1 Ultra (64-core GPU)", generation: 1, cpuCores: 20, gpuCores: 64, bandwidth: 800, tflops: 20.8, source: SRC_4167 }),
    chip({ key: "m2-10c", name: "M2 (10-core GPU)", generation: 2, cpuCores: 8, gpuCores: 10, bandwidth: 100, tflops: 3.6, source: SRC_4167 }),
    chip({ key: "m2-pro-19c", name: "M2 Pro (19-core GPU)", generation: 2, cpuCores: 12, gpuCores: 19, bandwidth: 200, tflops: 6.8, source: SRC_4167 }),
    chip({ key: "m2-max-38c", name: "M2 Max (38-core GPU)", generation: 2, cpuCores: 12, gpuCores: 38, bandwidth: 400, tflops: 13.6, source: SRC_4167 }),
    chip({ key: "m2-ultra-76c", name: "M2 Ultra (76-core GPU)", generation: 2, cpuCores: 24, gpuCores: 76, bandwidth: 800, tflops: 27.2, source: SRC_4167 }),
    chip({ key: "m3-10c", name: "M3 (10-core GPU)", generation: 3, cpuCores: 8, gpuCores: 10, bandwidth: 100, tflops: 3.6, source: SRC_4167 }),
    chip({ key: "m3-pro-18c", name: "M3 Pro (18-core GPU)", generation: 3, cpuCores: 12, gpuCores: 18, bandwidth: 150, tflops: 6.4, source: SRC_4167 }),
    chip({ key: "m3-max-30c", name: "M3 Max (30-core GPU)", generation: 3, cpuCores: 14, gpuCores: 30, bandwidth: 300, tflops: 10.6, source: SRC_4167 }),
    chip({ key: "m3-max-40c", name: "M3 Max (40-core GPU)", generation: 3, cpuCores: 16, gpuCores: 40, bandwidth: 400, tflops: 14.2, source: SRC_4167 }),
    chip({ key: "m3-ultra-80c", name: "M3 Ultra (80-core GPU)", generation: 3, cpuCores: 32, gpuCores: 80, bandwidth: 819, tflops: 28.4, source: SRC_M3_ULTRA }),
    chip({ key: "m4-10c", name: "M4 (10-core GPU)", generation: 4, cpuCores: 10, gpuCores: 10, bandwidth: 120, tflops: 4.3, source: SRC_4167 }),
    chip({ key: "m4-pro-16c", name: "M4 Pro (16-core GPU)", generation: 4, cpuCores: 12, gpuCores: 16, bandwidth: 273, tflops: 6.9, source: SRC_4167 }),
    chip({ key: "m4-pro-20c", name: "M4 Pro (20-core GPU)", generation: 4, cpuCores: 14, gpuCores: 20, bandwidth: 273, tflops: 8.6, source: SRC_4167 }),
    chip({ key: "m4-max-32c", name: "M4 Max (32-core GPU)", generation: 4, cpuCores: 14, gpuCores: 32, bandwidth: 410, tflops: 13.8, source: SRC_4167 }),
    chip({ key: "m4-max-40c", name: "M4 Max (40-core GPU)", generation: 4, cpuCores: 16, gpuCores: 40, bandwidth: 546, tflops: 17.2, source: SRC_4167 }),
    chip({ key: "m5-10c", name: "M5 (10-core GPU)", generation: 5, cpuCores: 10, gpuCores: 10, bandwidth: 153, tflops: 4.6, accel: 15, source: SRC_M5 }),
    chip({ key: "m5-pro-20c", name: "M5 Pro (20-core GPU)", generation: 5, cpuCores: 18, gpuCores: 20, bandwidth: 307, tflops: 9.2, accel: 30, source: SRC_M5_PRO_MAX }),
    chip({ key: "m5-max-32c", name: "M5 Max (32-core GPU)", generation: 5, cpuCores: 18, gpuCores: 32, bandwidth: 460, tflops: 14.7, accel: 48, source: SRC_M5_PRO_MAX }),
    chip({ key: "m5-max-40c", name: "M5 Max (40-core GPU)", generation: 5, cpuCores: 18, gpuCores: 40, bandwidth: 614, tflops: 18.4, accel: 60, source: SRC_M5_PRO_MAX }),
    chip({ key: "m5-ultra-80c", name: "M5 Ultra (80-core GPU)", generation: 5, cpuCores: 36, gpuCores: 80, bandwidth: 1228, tflops: 36.8, accel: 120, source: SRC_STUDIO_2026 }),
    chip({ key: "m6-12c", name: "M6 (12-core GPU)", generation: 6, cpuCores: 12, gpuCores: 12, bandwidth: 170, tflops: 5.8, accel: 19, source: SRC_MINI_2026 }),
  ].map((c) => [c.key, c]),
);

interface AppleMachine {
  device: string;
  idPrefix: string;
  formFactor: HardwareConfigurationInput["formFactor"];
  year: number;
  chip: string;
  memory: number[];
  /** Approx. base price (USD) and price per extra 8GB step. */
  basePrice?: number;
}

const APPLE_MACHINES: AppleMachine[] = [
  // MacBook Air
  { device: "MacBook Air", idPrefix: "mba", formFactor: "fanless-laptop", year: 2020, chip: "m1-8c", memory: [8, 16], basePrice: 999 },
  { device: "MacBook Air", idPrefix: "mba", formFactor: "fanless-laptop", year: 2022, chip: "m2-10c", memory: [8, 16, 24], basePrice: 1199 },
  { device: "MacBook Air", idPrefix: "mba", formFactor: "fanless-laptop", year: 2024, chip: "m3-10c", memory: [8, 16, 24], basePrice: 1099 },
  { device: "MacBook Air", idPrefix: "mba", formFactor: "fanless-laptop", year: 2025, chip: "m4-10c", memory: [16, 24, 32], basePrice: 999 },
  { device: "MacBook Air", idPrefix: "mba", formFactor: "fanless-laptop", year: 2026, chip: "m5-10c", memory: [16, 24, 32], basePrice: 1099 },
  // MacBook Pro
  { device: "MacBook Pro", idPrefix: "mbp", formFactor: "laptop", year: 2021, chip: "m1-pro-16c", memory: [16, 32], basePrice: 1999 },
  { device: "MacBook Pro", idPrefix: "mbp", formFactor: "laptop", year: 2021, chip: "m1-max-32c", memory: [32, 64], basePrice: 3299 },
  { device: "MacBook Pro", idPrefix: "mbp", formFactor: "laptop", year: 2023, chip: "m2-pro-19c", memory: [16, 32], basePrice: 2499 },
  { device: "MacBook Pro", idPrefix: "mbp", formFactor: "laptop", year: 2023, chip: "m2-max-38c", memory: [32, 64, 96], basePrice: 3499 },
  { device: "MacBook Pro", idPrefix: "mbp", formFactor: "laptop", year: 2023, chip: "m3-pro-18c", memory: [18, 36], basePrice: 1999 },
  { device: "MacBook Pro", idPrefix: "mbp", formFactor: "laptop", year: 2023, chip: "m3-max-30c", memory: [36, 96], basePrice: 3199 },
  { device: "MacBook Pro", idPrefix: "mbp", formFactor: "laptop", year: 2023, chip: "m3-max-40c", memory: [48, 64, 128], basePrice: 3699 },
  { device: "MacBook Pro", idPrefix: "mbp", formFactor: "laptop", year: 2024, chip: "m4-10c", memory: [16, 24, 32], basePrice: 1599 },
  { device: "MacBook Pro", idPrefix: "mbp", formFactor: "laptop", year: 2024, chip: "m4-pro-20c", memory: [24, 48], basePrice: 2399 },
  { device: "MacBook Pro", idPrefix: "mbp", formFactor: "laptop", year: 2024, chip: "m4-max-32c", memory: [36], basePrice: 3199 },
  { device: "MacBook Pro", idPrefix: "mbp", formFactor: "laptop", year: 2024, chip: "m4-max-40c", memory: [48, 64, 128], basePrice: 3699 },
  { device: "MacBook Pro", idPrefix: "mbp", formFactor: "laptop", year: 2025, chip: "m5-10c", memory: [16, 24, 32], basePrice: 1699 },
  { device: "MacBook Pro", idPrefix: "mbp", formFactor: "laptop", year: 2026, chip: "m5-pro-20c", memory: [24, 48, 64], basePrice: 2199 },
  { device: "MacBook Pro", idPrefix: "mbp", formFactor: "laptop", year: 2026, chip: "m5-max-32c", memory: [36], basePrice: 3599 },
  { device: "MacBook Pro", idPrefix: "mbp", formFactor: "laptop", year: 2026, chip: "m5-max-40c", memory: [48, 64, 128], basePrice: 3999 },
  // Mac mini
  { device: "Mac mini", idPrefix: "mini", formFactor: "mini", year: 2023, chip: "m2-10c", memory: [8, 16, 24], basePrice: 599 },
  { device: "Mac mini", idPrefix: "mini", formFactor: "mini", year: 2023, chip: "m2-pro-19c", memory: [16, 32], basePrice: 1299 },
  { device: "Mac mini", idPrefix: "mini", formFactor: "mini", year: 2024, chip: "m4-10c", memory: [16, 24, 32], basePrice: 599 },
  { device: "Mac mini", idPrefix: "mini", formFactor: "mini", year: 2024, chip: "m4-pro-20c", memory: [24, 48, 64], basePrice: 1399 },
  { device: "Mac mini", idPrefix: "mini", formFactor: "mini", year: 2026, chip: "m6-12c", memory: [16, 24, 32], basePrice: 899 },
  { device: "Mac mini", idPrefix: "mini", formFactor: "mini", year: 2026, chip: "m5-pro-20c", memory: [24, 48, 64], basePrice: 1699 },
  // Mac Studio
  { device: "Mac Studio", idPrefix: "studio", formFactor: "desktop", year: 2022, chip: "m1-max-32c", memory: [32, 64], basePrice: 1999 },
  { device: "Mac Studio", idPrefix: "studio", formFactor: "desktop", year: 2022, chip: "m1-ultra-64c", memory: [64, 128], basePrice: 4999 },
  { device: "Mac Studio", idPrefix: "studio", formFactor: "desktop", year: 2023, chip: "m2-max-38c", memory: [32, 64, 96], basePrice: 2199 },
  { device: "Mac Studio", idPrefix: "studio", formFactor: "desktop", year: 2023, chip: "m2-ultra-76c", memory: [64, 128, 192], basePrice: 4999 },
  { device: "Mac Studio", idPrefix: "studio", formFactor: "desktop", year: 2025, chip: "m4-max-40c", memory: [48, 64, 128], basePrice: 2499 },
  { device: "Mac Studio", idPrefix: "studio", formFactor: "desktop", year: 2025, chip: "m3-ultra-80c", memory: [96, 256, 512], basePrice: 5499 },
  { device: "Mac Studio", idPrefix: "studio", formFactor: "desktop", year: 2026, chip: "m5-max-40c", memory: [48, 64, 128], basePrice: 2499 },
  { device: "Mac Studio", idPrefix: "studio", formFactor: "desktop", year: 2026, chip: "m5-ultra-80c", memory: [128, 256, 512], basePrice: 5499 },
  // Mac Pro
  { device: "Mac Pro", idPrefix: "macpro", formFactor: "workstation", year: 2023, chip: "m2-ultra-76c", memory: [64, 128, 192], basePrice: 6999 },
];

function appleConfigs(): HardwareConfigurationInput[] {
  const out: HardwareConfigurationInput[] = [];
  for (const m of APPLE_MACHINES) {
    const c = APPLE_CHIPS[m.chip];
    m.memory.forEach((mem, i) => {
      const chipShort = c.name.replace(/ \(.*\)/, "");
      out.push({
        id: `${m.idPrefix}-${m.chip}-${mem}`,
        name: `${m.device} ${chipShort} ${mem} GB`,
        chipKey: `apple-${c.key}`,
        device: m.device,
        vendor: "apple",
        formFactor: m.formFactor,
        year: m.year,
        memoryArchitecture: "unified",
        cpu: { name: chipShort, cores: c.cpuCores, arch: "arm64", gflops: 250 * c.cpuCores },
        gpu: {
          name: `${chipShort} ${c.gpuCores}-core GPU`,
          vendor: "apple",
          cores: c.gpuCores,
          bandwidthGBs: c.bandwidth,
          fp16Tflops: c.tflops,
          acceleratedFp16Tflops: c.accel,
          apis: ["metal"],
          architecture: `Apple GPU (M${c.generation})`,
        },
        npu: { name: "Apple Neural Engine", tops: c.generation >= 4 ? 38 : c.generation === 3 ? 18 : c.generation === 2 ? 15.8 : 11 },
        systemRamGB: mem,
        systemRamBandwidthGBs: c.bandwidth,
        // macOS lets the GPU wire ~2/3 of RAM up to 36 GB, ~3/4 above (adjustable via iogpu.wired_limit_mb).
        gpuMemoryFraction: mem <= 36 ? 0.67 : 0.75,
        gpuMemoryFractionRaised: Math.min(0.92, (mem - 5) / mem),
        os: ["macos"],
        approxPriceUSD: m.basePrice ? m.basePrice + i * (mem >= 96 ? 800 : 400) : undefined,
        tags: [m.device.toLowerCase(), `m${c.generation}`, c.accel ? "neural-accelerators" : ""].filter(Boolean),
        source: c.source,
      });
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* PCs, GPUs and other systems                                         */
/* ------------------------------------------------------------------ */

const specSrc = (url: string, title: string, confidence: Source["confidence"] = "medium", note?: string, verified = "2026-09-30"): Source => ({
  url,
  title,
  lastVerified: verified,
  confidence,
  note,
});

const SRC_CUDA = specSrc("https://github.com/ggml-org/llama.cpp/discussions/15013", "llama.cpp CUDA scoreboard + vendor spec sheets", "medium");
const SRC_VULKAN = specSrc("https://github.com/ggml-org/llama.cpp/discussions/10879", "llama.cpp Vulkan scoreboard + vendor spec sheets", "medium");

interface GpuSpec {
  key: string;
  name: string;
  vendor: "nvidia" | "amd" | "intel";
  vram: number;
  bandwidth: number;
  tflops: number;
  arch: string;
  apis: ("cuda" | "rocm" | "vulkan" | "sycl")[];
  cuda?: string;
  rocm?: "official" | "unofficial" | "none";
  laptop?: boolean;
  year: number;
  price?: number;
  source: Source;
}

const DESKTOP_GPUS: GpuSpec[] = [
  { key: "rtx-3060-12", name: "GeForce RTX 3060 12GB", vendor: "nvidia", vram: 12, bandwidth: 360, tflops: 25.6, arch: "Ampere", apis: ["cuda", "vulkan"], cuda: "8.6", year: 2021, price: 300, source: SRC_CUDA },
  { key: "rtx-3090", name: "GeForce RTX 3090", vendor: "nvidia", vram: 24, bandwidth: 936, tflops: 71, arch: "Ampere", apis: ["cuda", "vulkan"], cuda: "8.6", year: 2020, price: 800, source: SRC_CUDA },
  { key: "rtx-4060-ti-16", name: "GeForce RTX 4060 Ti 16GB", vendor: "nvidia", vram: 16, bandwidth: 288, tflops: 44, arch: "Ada Lovelace", apis: ["cuda", "vulkan"], cuda: "8.9", year: 2023, price: 450, source: SRC_CUDA },
  { key: "rtx-4070-ti-super", name: "GeForce RTX 4070 Ti SUPER", vendor: "nvidia", vram: 16, bandwidth: 672, tflops: 88, arch: "Ada Lovelace", apis: ["cuda", "vulkan"], cuda: "8.9", year: 2024, price: 800, source: SRC_CUDA },
  { key: "rtx-4080-super", name: "GeForce RTX 4080 SUPER", vendor: "nvidia", vram: 16, bandwidth: 736, tflops: 104, arch: "Ada Lovelace", apis: ["cuda", "vulkan"], cuda: "8.9", year: 2024, price: 1000, source: SRC_CUDA },
  { key: "rtx-4090", name: "GeForce RTX 4090", vendor: "nvidia", vram: 24, bandwidth: 1008, tflops: 165, arch: "Ada Lovelace", apis: ["cuda", "vulkan"], cuda: "8.9", year: 2022, price: 1800, source: SRC_CUDA },
  { key: "rtx-5060-ti-16", name: "GeForce RTX 5060 Ti 16GB", vendor: "nvidia", vram: 16, bandwidth: 448, tflops: 47, arch: "Blackwell", apis: ["cuda", "vulkan"], cuda: "12.0", year: 2025, price: 430, source: SRC_CUDA },
  { key: "rtx-5070", name: "GeForce RTX 5070", vendor: "nvidia", vram: 12, bandwidth: 672, tflops: 62, arch: "Blackwell", apis: ["cuda", "vulkan"], cuda: "12.0", year: 2025, price: 550, source: SRC_CUDA },
  { key: "rtx-5070-ti", name: "GeForce RTX 5070 Ti", vendor: "nvidia", vram: 16, bandwidth: 896, tflops: 88, arch: "Blackwell", apis: ["cuda", "vulkan"], cuda: "12.0", year: 2025, price: 750, source: SRC_CUDA },
  { key: "rtx-5080", name: "GeForce RTX 5080", vendor: "nvidia", vram: 16, bandwidth: 960, tflops: 113, arch: "Blackwell", apis: ["cuda", "vulkan"], cuda: "12.0", year: 2025, price: 1000, source: SRC_CUDA },
  { key: "rtx-5090", name: "GeForce RTX 5090", vendor: "nvidia", vram: 32, bandwidth: 1792, tflops: 210, arch: "Blackwell", apis: ["cuda", "vulkan"], cuda: "12.0", year: 2025, price: 2000, source: SRC_CUDA },
  { key: "rtx-pro-6000", name: "RTX PRO 6000 Blackwell", vendor: "nvidia", vram: 96, bandwidth: 1792, tflops: 250, arch: "Blackwell", apis: ["cuda", "vulkan"], cuda: "12.0", year: 2025, price: 16000, source: specSrc("https://www.thundercompute.com/blog/nvidia-rtx-pro-6000-pricing", "NVIDIA raised the official price to $16,000 (Aug 2026); launched at $8,565 (Mar 2025); specs via llama.cpp CUDA scoreboard", "medium", undefined, "2026-10-07") },
  { key: "dual-rtx-3090", name: "2× GeForce RTX 3090 (48 GB)", vendor: "nvidia", vram: 48, bandwidth: 936, tflops: 120, arch: "Ampere", apis: ["cuda", "vulkan"], cuda: "8.6", year: 2020, price: 1600, source: specSrc("https://github.com/ggml-org/llama.cpp/discussions/15013", "Layer split across two GPUs: capacity adds up, decode bandwidth does not", "low") },
  { key: "rx-7900-xt", name: "Radeon RX 7900 XT", vendor: "amd", vram: 20, bandwidth: 800, tflops: 103, arch: "RDNA 3", apis: ["rocm", "vulkan"], rocm: "official", year: 2022, price: 650, source: SRC_VULKAN },
  { key: "rx-7900-xtx", name: "Radeon RX 7900 XTX", vendor: "amd", vram: 24, bandwidth: 960, tflops: 123, arch: "RDNA 3", apis: ["rocm", "vulkan"], rocm: "official", year: 2022, price: 900, source: SRC_VULKAN },
  { key: "rx-9070-xt", name: "Radeon RX 9070 XT", vendor: "amd", vram: 16, bandwidth: 640, tflops: 195, arch: "RDNA 4", apis: ["rocm", "vulkan"], rocm: "official", year: 2025, price: 600, source: specSrc("https://github.com/ggml-org/llama.cpp/discussions/10879", "llama.cpp Vulkan scoreboard; 640 GB/s widely cited", "medium") },
  { key: "radeon-ai-pro-r9700", name: "Radeon AI PRO R9700", vendor: "amd", vram: 32, bandwidth: 640, tflops: 191, arch: "RDNA 4", apis: ["rocm", "vulkan"], rocm: "official", year: 2025, price: 1300, source: SRC_VULKAN },
  { key: "arc-b580", name: "Intel Arc B580", vendor: "intel", vram: 12, bandwidth: 456, tflops: 117, arch: "Xe2 (Battlemage)", apis: ["vulkan", "sycl"], year: 2024, price: 250, source: specSrc("https://github.com/ggml-org/llama.cpp/discussions/10879", "llama.cpp Vulkan scoreboard; 456 GB/s widely cited", "medium") },
  { key: "arc-pro-b60", name: "Intel Arc Pro B60 24GB", vendor: "intel", vram: 24, bandwidth: 456, tflops: 98, arch: "Xe2 (Battlemage)", apis: ["vulkan", "sycl"], year: 2025, price: 600, source: specSrc("https://www.intel.com/content/www/us/en/products/docs/discrete-gpus/arc/workstations/b-series/overview.html", "Intel Arc Pro B-series; bandwidth from secondary source", "low") },
];

const LAPTOP_GPUS: GpuSpec[] = [
  { key: "rtx-4060-laptop", name: "GeForce RTX 4060 Laptop", vendor: "nvidia", vram: 8, bandwidth: 256, tflops: 30, arch: "Ada Lovelace", apis: ["cuda", "vulkan"], cuda: "8.9", laptop: true, year: 2023, price: 1200, source: specSrc("https://www.nvidia.com/en-us/geforce/laptops/40-series/", "NVIDIA RTX 40 laptop specs", "medium") },
  { key: "rtx-4090-laptop", name: "GeForce RTX 4090 Laptop", vendor: "nvidia", vram: 16, bandwidth: 576, tflops: 90, arch: "Ada Lovelace", apis: ["cuda", "vulkan"], cuda: "8.9", laptop: true, year: 2023, price: 3000, source: specSrc("https://www.nvidia.com/en-us/geforce/laptops/40-series/", "NVIDIA RTX 40 laptop specs", "medium") },
  { key: "rtx-5090-laptop", name: "GeForce RTX 5090 Laptop", vendor: "nvidia", vram: 24, bandwidth: 896, tflops: 115, arch: "Blackwell", apis: ["cuda", "vulkan"], cuda: "12.0", laptop: true, year: 2025, price: 3800, source: specSrc("https://www.nvidia.com/en-us/geforce/laptops/50-series/", "NVIDIA RTX 50 laptop specs", "medium") },
];

const DESKTOP_CPU = { name: "Ryzen 7 / Core i7 class desktop CPU", cores: 8, arch: "x86_64" as const, gflops: 3000 };
const LAPTOP_CPU = { name: "Core i9 / Ryzen 9 laptop CPU", cores: 16, arch: "x86_64" as const, gflops: 3000 };

function gpuConfigs(): HardwareConfigurationInput[] {
  const out: HardwareConfigurationInput[] = [];
  for (const g of DESKTOP_GPUS) {
    const ramOptions = g.vram >= 48 ? [128] : g.vram >= 24 ? [32, 64] : [32];
    for (const ram of ramOptions) {
      out.push({
        id: `pc-${g.key}-${ram}`,
        name: `Desktop PC · ${g.name} · ${ram} GB RAM`,
        chipKey: `${g.vendor}-${g.key}`,
        device: "Desktop PC",
        vendor: g.vendor,
        formFactor: g.vram >= 48 ? "workstation" : "desktop",
        year: g.year,
        memoryArchitecture: "discrete",
        cpu: DESKTOP_CPU,
        gpu: {
          name: g.name,
          vendor: g.vendor,
          vramGB: g.vram,
          bandwidthGBs: g.bandwidth,
          fp16Tflops: g.tflops,
          apis: g.apis,
          architecture: g.arch,
          cudaCapability: g.cuda,
          rocmSupport: g.rocm ?? (g.vendor === "amd" ? "unofficial" : undefined),
        },
        systemRamGB: ram,
        systemRamBandwidthGBs: 80,
        os: ["windows", "linux"],
        approxPriceUSD: g.price ? g.price + 900 + (ram - 32) * 4 : undefined,
        tags: [g.vendor, g.arch.toLowerCase(), "discrete-gpu"],
        source: g.source,
      });
    }
  }
  for (const g of LAPTOP_GPUS) {
    out.push({
      id: `laptop-${g.key}-32`,
      name: `Laptop · ${g.name} · 32 GB RAM`,
      chipKey: `${g.vendor}-${g.key}`,
      device: "Windows laptop",
      vendor: g.vendor,
      formFactor: "laptop",
      year: g.year,
      memoryArchitecture: "discrete",
      cpu: LAPTOP_CPU,
      gpu: {
        name: g.name,
        vendor: g.vendor,
        vramGB: g.vram,
        bandwidthGBs: g.bandwidth,
        fp16Tflops: g.tflops,
        apis: g.apis,
        architecture: g.arch,
        cudaCapability: g.cuda,
        laptop: true,
      },
      systemRamGB: 32,
      systemRamBandwidthGBs: 75,
      os: ["windows", "linux"],
      approxPriceUSD: g.price,
      tags: [g.vendor, "laptop", "discrete-gpu"],
      source: g.source,
    });
  }
  return out;
}

const SRC_STRIX = specSrc(
  "https://llm-tracker.info/AMD-Strix-Halo-(Ryzen-AI-Max+-395)-GPU-Performance",
  "Strix Halo GPU performance (256 GB/s theoretical, ~212 measured)",
  "medium",
);

const OTHER: HardwareConfigurationInput[] = [
  ...[64, 128].map<HardwareConfigurationInput>((ram) => ({
    id: `strix-halo-395-${ram}`,
    name: `Ryzen AI Max+ 395 mini PC / Framework Desktop · ${ram} GB`,
    chipKey: "amd-strix-halo-8060s",
    device: "Ryzen AI Max+ 395 system",
    vendor: "amd",
    formFactor: "mini",
    year: 2025,
    memoryArchitecture: "unified",
    cpu: { name: "Ryzen AI Max+ 395 (16 Zen 5 cores)", cores: 16, arch: "x86_64", gflops: 8000 },
    gpu: { name: "Radeon 8060S (40 CU)", vendor: "amd", cores: 40, bandwidthGBs: 256, fp16Tflops: 32, apis: ["vulkan", "rocm"], architecture: "RDNA 3.5", rocmSupport: "official" },
    npu: { name: "XDNA 2", tops: 50 },
    systemRamGB: ram,
    systemRamBandwidthGBs: 256,
    // Up to 96 GB of a 128 GB system can be assigned to the GPU on Windows; Linux GTT allows more.
    gpuMemoryFraction: 0.75,
    gpuMemoryFractionRaised: 0.9,
    os: ["windows", "linux"],
    approxPriceUSD: ram === 128 ? 2000 : 1600,
    tags: ["amd", "unified", "ryzen-ai"],
    source: SRC_STRIX,
  })),
  {
    id: "dgx-spark-128",
    name: "NVIDIA DGX Spark (GB10) · 128 GB",
    chipKey: "nvidia-dgx-spark",
    device: "DGX Spark",
    vendor: "nvidia",
    formFactor: "mini",
    year: 2025,
    memoryArchitecture: "unified",
    cpu: { name: "Grace (20 Arm cores)", cores: 20, arch: "arm64", gflops: 4000 },
    gpu: { name: "GB10 Blackwell GPU", vendor: "nvidia", bandwidthGBs: 273, fp16Tflops: 50, apis: ["cuda", "vulkan"], architecture: "Blackwell", cudaCapability: "12.1" },
    systemRamGB: 128,
    systemRamBandwidthGBs: 273,
    gpuMemoryFraction: 0.92,
    gpuMemoryFractionRaised: 0.95,
    os: ["linux"],
    approxPriceUSD: 6950,
    tags: ["nvidia", "unified", "dgx"],
    source: specSrc("https://groundtruth.day/news/nvidia-dgx-spark-64gb-starts-at-4999.html", "NVIDIA raised the 128GB Founders Edition to $6,950 on Oct 2, 2026 (was $3,999 launch, $4,699 since Feb 23, 2026); verified against NVIDIA announcement", "medium", undefined, "2026-10-07"),
  },
  {
    id: "dgx-spark-64",
    name: "NVIDIA DGX Spark (GB10) · 64 GB",
    chipKey: "nvidia-dgx-spark",
    device: "DGX Spark",
    vendor: "nvidia",
    formFactor: "mini",
    year: 2026,
    memoryArchitecture: "unified",
    cpu: { name: "Grace (20 Arm cores)", cores: 20, arch: "arm64", gflops: 4000 },
    gpu: { name: "GB10 Blackwell GPU", vendor: "nvidia", bandwidthGBs: 273, fp16Tflops: 50, apis: ["cuda", "vulkan"], architecture: "Blackwell", cudaCapability: "12.1" },
    systemRamGB: 64,
    systemRamBandwidthGBs: 273,
    gpuMemoryFraction: 0.92,
    gpuMemoryFractionRaised: 0.95,
    os: ["linux"],
    approxPriceUSD: 4999,
    tags: ["nvidia", "unified", "dgx"],
    source: specSrc("https://videocardz.com/newz/nvidia-dgx-spark-drops-to-64gb-memory-but-costs-more-than-the-original-128gb-version", "NVIDIA announced the 64GB DGX Spark on Oct 2, 2026: same GB10 chip, 64GB unified, $4,999 starting price, shipping Oct 23 via Acer/ASUS/Dell/Gigabyte/HP/MSI (NVIDIA PR)", "medium", "Starting price; partners set final configs and prices. No Founders Edition for 64GB.", "2026-10-07"),
  },
  {
    id: "laptop-ryzen-ai-hx370-32",
    name: "Laptop · Ryzen AI 9 HX 370 (Radeon 890M) · 32 GB",
    chipKey: "amd-890m",
    device: "Ryzen AI laptop",
    vendor: "amd",
    formFactor: "laptop",
    year: 2024,
    memoryArchitecture: "unified",
    cpu: { name: "Ryzen AI 9 HX 370 (12 cores)", cores: 12, arch: "x86_64", gflops: 4000 },
    gpu: { name: "Radeon 890M (16 CU)", vendor: "amd", cores: 16, bandwidthGBs: 120, fp16Tflops: 12, apis: ["vulkan"], architecture: "RDNA 3.5", rocmSupport: "unofficial" },
    npu: { name: "XDNA 2", tops: 50 },
    systemRamGB: 32,
    systemRamBandwidthGBs: 120,
    gpuMemoryFraction: 0.5,
    gpuMemoryFractionRaised: 0.75,
    os: ["windows", "linux"],
    approxPriceUSD: 1300,
    tags: ["amd", "laptop", "integrated-gpu", "ryzen-ai"],
    source: specSrc("https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-9-hx-370.html", "AMD Ryzen AI 9 HX 370 specs (LPDDR5X-7500)", "low"),
  },
  {
    id: "laptop-core-ultra-258v-32",
    name: "Laptop · Core Ultra 7 258V (Arc 140V) · 32 GB",
    chipKey: "intel-arc-140v",
    device: "Core Ultra laptop",
    vendor: "intel",
    formFactor: "laptop",
    year: 2024,
    memoryArchitecture: "unified",
    cpu: { name: "Core Ultra 7 258V (8 cores)", cores: 8, arch: "x86_64", gflops: 1500 },
    gpu: { name: "Arc 140V (Xe2, 8 cores)", vendor: "intel", cores: 8, bandwidthGBs: 136, fp16Tflops: 32, apis: ["vulkan", "sycl"], architecture: "Xe2 (Lunar Lake)" },
    npu: { name: "Intel NPU 4", tops: 48 },
    systemRamGB: 32,
    systemRamBandwidthGBs: 136,
    gpuMemoryFraction: 0.57,
    gpuMemoryFractionRaised: 0.8,
    os: ["windows", "linux"],
    approxPriceUSD: 1300,
    tags: ["intel", "laptop", "integrated-gpu", "core-ultra"],
    source: specSrc("https://www.intel.com/content/www/us/en/products/sku/240957/intel-core-ultra-7-processor-258v-12m-cache-up-to-4-80-ghz/specifications.html", "Intel Core Ultra 7 258V specs (LPDDR5X-8533)", "low"),
  },
  {
    id: "pc-cpu-only-9950x-64",
    name: "Desktop PC · Ryzen 9 9950X (no GPU) · 64 GB DDR5",
    chipKey: "amd-9950x-cpu",
    device: "Desktop PC (CPU only)",
    vendor: "amd",
    formFactor: "desktop",
    year: 2024,
    memoryArchitecture: "cpu-only",
    cpu: { name: "Ryzen 9 9950X (16 cores, AVX-512)", cores: 16, arch: "x86_64", gflops: 7000 },
    gpu: null,
    systemRamGB: 64,
    systemRamBandwidthGBs: 89,
    os: ["windows", "linux"],
    approxPriceUSD: 1400,
    tags: ["cpu-only"],
    source: specSrc("https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-9-9950x.html", "AMD Ryzen 9 9950X; dual-channel DDR5-5600 ≈ 89 GB/s", "medium"),
  },
];

export const HARDWARE: HardwareConfiguration[] = [...appleConfigs(), ...gpuConfigs(), ...OTHER].map((h) =>
  HardwareConfigurationSchema.parse(h),
);
export const HARDWARE_MAP = new Map(HARDWARE.map((h) => [h.id, h]));

export function getHardware(id: string): HardwareConfiguration {
  const h = HARDWARE_MAP.get(id);
  if (!h) throw new Error(`Unknown hardware: ${id}`);
  return h;
}

/** Build a custom configuration from user-entered specs. */
export interface CustomHardwareInput {
  name?: string;
  architecture: "unified" | "discrete" | "cpu-only";
  gpuVendor?: "apple" | "nvidia" | "amd" | "intel";
  vramGB?: number;
  ramGB: number;
  bandwidthGBs: number;
  ramBandwidthGBs?: number;
  tflops?: number;
  os: "macos" | "linux" | "windows";
  laptop?: boolean;
}

export function buildCustomHardware(c: CustomHardwareInput): HardwareConfiguration {
  const vendor = c.gpuVendor ?? (c.os === "macos" ? "apple" : "nvidia");
  const apis: ("metal" | "cuda" | "rocm" | "vulkan" | "sycl")[] =
    vendor === "apple" ? ["metal"] : vendor === "nvidia" ? ["cuda", "vulkan"] : vendor === "amd" ? ["rocm", "vulkan"] : ["vulkan", "sycl"];
  const isGpu = c.architecture !== "cpu-only";
  return HardwareConfigurationSchema.parse({
    id: "custom",
    name: c.name || "Custom hardware",
    chipKey: "custom",
    device: "Custom",
    vendor: "custom",
    formFactor: c.laptop ? "laptop" : "desktop",
    year: 2026,
    memoryArchitecture: c.architecture,
    cpu: { name: "Custom CPU", cores: 8, arch: vendor === "apple" ? "arm64" : "x86_64", gflops: 2500 },
    gpu: isGpu
      ? {
          name: `Custom ${vendor} GPU`,
          vendor,
          vramGB: c.architecture === "discrete" ? (c.vramGB ?? 8) : undefined,
          bandwidthGBs: c.bandwidthGBs,
          fp16Tflops: c.tflops ?? Math.max(2, c.bandwidthGBs / 12),
          apis,
          laptop: c.laptop,
        }
      : null,
    systemRamGB: c.ramGB,
    systemRamBandwidthGBs: c.ramBandwidthGBs ?? (c.architecture === "unified" ? c.bandwidthGBs : 80),
    gpuMemoryFraction: c.architecture === "unified" ? (vendor === "apple" ? (c.ramGB <= 36 ? 0.67 : 0.75) : 0.75) : undefined,
    gpuMemoryFractionRaised: c.architecture === "unified" ? 0.9 : undefined,
    os: [c.os],
    tags: ["custom"],
    source: { url: "https://example.com/custom", title: "User-entered specifications", lastVerified: "2026-09-30", confidence: "low" },
  });
}
