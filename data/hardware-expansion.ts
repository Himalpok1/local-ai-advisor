import type { HardwareConfigurationInput, Source } from "@/lib/schemas";

// Primary-source additions. Specs are peak figures, never measured inference speeds.
// New entries deliberately omit unsourced prices and unreviewed ROCm support.
const AMPERE_PAPER = "https://www.nvidia.com/content/PDF/nvidia-ampere-ga-102-gpu-architecture-whitepaper-v2.1.pdf";
const checked = "2026-10-10";
const nvidiaPdf = (name: string) => `https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/nvidia-${name}-datasheet.pdf`;
const amdPage = (family: number, slug: string) => `https://www.amd.com/en/products/graphics/desktops/radeon/${family}-series/amd-radeon-${slug}.html`;
interface CardSpec {
  key: string; name: string; vendor: "nvidia" | "amd"; memory: number; bandwidth: number;
  compute: number; computeKind: "fp16-vector" | "fp32-proxy"; architecture: string;
  year: number; url: string; workstation?: boolean; releaseUrl?: string; computeUrl?: string;
}
export const EXPANSION_CARDS: CardSpec[] = [
  { key: "rtx-2080", name: "GeForce RTX 2080 Founders Edition", vendor: "nvidia", memory: 8, bandwidth: 448, compute: 21.2, computeKind: "fp16-vector", architecture: "Turing", year: 2018, url: AMPERE_PAPER, releaseUrl: "https://nvidianews.nvidia.com/news/10-years-in-the-making-nvidia-brings-real-time-ray-tracing-to-gamers-with-geforce-rtx" },
  { key: "rtx-2080-super", name: "GeForce RTX 2080 SUPER Founders Edition", vendor: "nvidia", memory: 8, bandwidth: 496, compute: 22.3, computeKind: "fp16-vector", architecture: "Turing", year: 2019, url: AMPERE_PAPER, releaseUrl: "https://www.nvidia.com/en-us/geforce/news/nvidia-geforce-rtx-2080-super-out-now/" },
  { key: "rtx-2070-super", name: "GeForce RTX 2070 SUPER Founders Edition", vendor: "nvidia", memory: 8, bandwidth: 448, compute: 18.1, computeKind: "fp16-vector", architecture: "Turing", year: 2019, url: AMPERE_PAPER, releaseUrl: "https://nvidianews.nvidia.com/news/with-great-power-comes-great-gaming-nvidia-launches-geforce-rtx-super-series" },
  { key: "rtx-3080-10", name: "GeForce RTX 3080 10GB Founders Edition", vendor: "nvidia", memory: 10, bandwidth: 760, compute: 29.8, computeKind: "fp16-vector", architecture: "Ampere", year: 2020, url: AMPERE_PAPER, releaseUrl: "https://nvidianews.nvidia.com/news/nvidia-delivers-greatest-ever-generational-leap-in-performance-with-geforce-rtx-30-series-gpus" },
  { key: "rtx-3070", name: "GeForce RTX 3070 Founders Edition", vendor: "nvidia", memory: 8, bandwidth: 448, compute: 20.3, computeKind: "fp16-vector", architecture: "Ampere", year: 2020, url: AMPERE_PAPER, releaseUrl: "https://nvidianews.nvidia.com/news/nvidia-delivers-greatest-ever-generational-leap-in-performance-with-geforce-rtx-30-series-gpus" },
  { key: "titan-rtx", name: "TITAN RTX", vendor: "nvidia", memory: 24, bandwidth: 672, compute: 32.6, computeKind: "fp16-vector", architecture: "Turing", year: 2018, url: AMPERE_PAPER, releaseUrl: "https://nvidianews.nvidia.com/news/nvidia-reveals-the-titan-of-turing-titan-rtx" },
  { key: "rtx-a4000", name: "RTX A4000", vendor: "nvidia", memory: 16, bandwidth: 448, compute: 19.2, computeKind: "fp32-proxy", architecture: "Ampere", releaseUrl: "https://nvidianews.nvidia.com/news/new-nvidia-rtx-gpus-power-next-generation-of-workstations-and-pcs-for-millions-of-artists-designers-engineers-and-virtual-desktop-users", year: 2021, url: nvidiaPdf("rtx-a4000"), workstation: true },
  { key: "rtx-a5000", name: "RTX A5000", vendor: "nvidia", memory: 24, bandwidth: 768, compute: 27.8, computeKind: "fp32-proxy", architecture: "Ampere", releaseUrl: "https://nvidianews.nvidia.com/news/new-nvidia-rtx-gpus-power-next-generation-of-workstations-and-pcs-for-millions-of-artists-designers-engineers-and-virtual-desktop-users", year: 2021, url: nvidiaPdf("rtx-a5000"), workstation: true },
  { key: "rtx-a6000", name: "RTX A6000", vendor: "nvidia", memory: 48, bandwidth: 768, compute: 38.7, computeKind: "fp16-vector", architecture: "Ampere", year: 2020, url: nvidiaPdf("rtx-a6000"), computeUrl: AMPERE_PAPER, releaseUrl: "https://blogs.nvidia.com.tw/blog/a6000-creators/", workstation: true },
  { key: "rtx-6000-ada", name: "RTX 6000 Ada Generation", vendor: "nvidia", memory: 48, bandwidth: 960, compute: 91.1, computeKind: "fp32-proxy", architecture: "Ada Lovelace", year: 2022, releaseUrl: "https://nvidianews.nvidia.com/news/nvidias-new-ada-lovelace-rtx-gpu-arrives-for-designers-and-creators", url: "https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/rtx-6000/proviz-print-rtx6000-datasheet-web-2504660.pdf", workstation: true },
  { key: "rx-6600", name: "Radeon RX 6600", vendor: "amd", memory: 8, bandwidth: 224, compute: 17.86, computeKind: "fp16-vector", architecture: "RDNA 2", year: 2021, url: amdPage(6000, "rx-6600") },
  { key: "rx-6700-xt", name: "Radeon RX 6700 XT", vendor: "amd", memory: 12, bandwidth: 384, compute: 26.43, computeKind: "fp16-vector", architecture: "RDNA 2", year: 2021, url: amdPage(6000, "rx-6700-xt") },
  { key: "rx-6800", name: "Radeon RX 6800", vendor: "amd", memory: 16, bandwidth: 512, compute: 32.33, computeKind: "fp16-vector", architecture: "RDNA 2", year: 2020, url: amdPage(6000, "rx-6800") },
  { key: "rx-6800-xt", name: "Radeon RX 6800 XT", vendor: "amd", memory: 16, bandwidth: 512, compute: 41.47, computeKind: "fp16-vector", architecture: "RDNA 2", year: 2020, url: amdPage(6000, "rx-6800-xt") },
  { key: "rx-6900-xt", name: "Radeon RX 6900 XT", vendor: "amd", memory: 16, bandwidth: 512, compute: 46.08, computeKind: "fp16-vector", architecture: "RDNA 2", year: 2020, url: amdPage(6000, "rx-6900-xt") },
  { key: "rx-7600", name: "Radeon RX 7600", vendor: "amd", memory: 8, bandwidth: 288, compute: 21.7, computeKind: "fp16-vector", architecture: "RDNA 3", releaseUrl: "https://www.amd.com/en/newsroom/press-releases/2023-5-24-amd-introduces-amd-radeon-rx-7600-graphics-card-f.html", year: 2023, url: amdPage(7000, "rx-7600") },
  { key: "rx-7600-xt", name: "Radeon RX 7600 XT", vendor: "amd", memory: 16, bandwidth: 288, compute: 22.6, computeKind: "fp16-vector", architecture: "RDNA 3", releaseUrl: "https://www.amd.com/en/newsroom/press-releases/2024-1-8-amd-unveils-amd-radeon-rx-7600-xt-graphics-card--.html", year: 2024, url: amdPage(7000, "rx-7600-xt") },
  { key: "rx-7700-xt", name: "Radeon RX 7700 XT", vendor: "amd", memory: 12, bandwidth: 432, compute: 35.2, computeKind: "fp16-vector", architecture: "RDNA 3", releaseUrl: "https://www.amd.com/en/newsroom/press-releases/2023-8-25-new-amd-radeon-rx-7800-xt-and-radeon-rx-7700-xt-gr.html", year: 2023, url: amdPage(7000, "rx-7700-xt") },
  { key: "rx-7800-xt", name: "Radeon RX 7800 XT", vendor: "amd", memory: 16, bandwidth: 624, compute: 37.3, computeKind: "fp16-vector", architecture: "RDNA 3", releaseUrl: "https://www.amd.com/en/newsroom/press-releases/2023-8-25-new-amd-radeon-rx-7800-xt-and-radeon-rx-7700-xt-gr.html", year: 2023, url: amdPage(7000, "rx-7800-xt") },
];

export const EXPANDED_HARDWARE: HardwareConfigurationInput[] = EXPANSION_CARDS.flatMap((g) => {
  const source: Source = { url: g.url, title: `${g.vendor === "nvidia" ? "NVIDIA" : "AMD"} ${g.name} specifications`, lastVerified: checked, confidence: "medium" };
  const computeDetail = g.computeKind === "fp32-proxy"
    ? "Vendor FP32 peak is used as a conservative compute proxy. FP16 inference throughput is unverified; sparse/FP8 Tensor TOPS are not substituted."
    : "Vendor peak non-Tensor/vector FP16 throughput; matrix and effective cache-bandwidth marketing figures are not substituted.";
  return (g.memory >= 48 ? [64, 128] : [32, 64]).map((ram) => ({
    id: `pc-${g.key}-${ram}`, name: `${g.workstation ? "Workstation" : "Desktop PC"} · ${g.name} · ${ram} GB RAM`,
    chipKey: `${g.vendor}-${g.key}`, device: g.workstation ? "Workstation" : "Desktop PC", vendor: g.vendor,
    formFactor: g.workstation ? "workstation" : "desktop", year: g.year, memoryArchitecture: "discrete",
    cpu: { name: "Reference desktop CPU (adjust for your machine)", cores: 8, arch: "x86_64", gflops: 3000 },
    gpu: { name: g.name, vendor: g.vendor, vramGB: g.memory, bandwidthGBs: g.bandwidth,
      fp16Tflops: g.compute, architecture: g.architecture, apis: g.vendor === "nvidia" ? ["cuda", "vulkan"] : ["vulkan"] },
    systemRamGB: ram, systemRamBandwidthGBs: 80, os: ["windows", "linux"],
    tags: [g.vendor, "discrete-gpu", "source-reviewed"], source,
    evidence: [
      { fields: ["gpu.vramGB", "gpu.bandwidthGBs", "gpu.architecture"], kind: "vendor-spec", source, detail: "Dedicated memory and physical peak bandwidth from the vendor specification." },
      { fields: ["gpu.fp16Tflops"], kind: g.computeKind === "fp32-proxy" ? "assumption" : "vendor-spec", source: g.computeUrl ? { ...source, url: g.computeUrl, title: "NVIDIA Ampere architecture whitepaper" } : source, detail: computeDetail },
      { fields: ["year"], kind: "vendor-spec", source: { ...source, url: g.releaseUrl ?? g.url, title: `${g.name} release/specification source` }, detail: "GPU announcement/release year, not the assembly date of this example PC." },
      { fields: ["cpu", "systemRamGB", "systemRamBandwidthGBs"], kind: "assumption", source, detail: "Example build: selected 32/64/128 GB RAM, generic eight-core CPU, assumed 80 GB/s RAM bandwidth. These are not vendor specifications for a complete computer." },
      { fields: ["gpu.apis", "os"], kind: "assumption", source, detail: "Runtime routing follows the existing backend matrix; no end-to-end inference validation was performed. AMD uses Vulkan only until exact ROCm support is reviewed." },
    ],
  } satisfies HardwareConfigurationInput));
});
