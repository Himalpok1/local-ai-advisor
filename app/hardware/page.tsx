import type { Metadata } from "next";
import { Cpu, MemoryStick } from "lucide-react";
import { BENCHMARKS, HARDWARE } from "@/data";
import { Callout, ExplorePage } from "@/components/explore/explore-nav";
import { HardwareExplorer } from "@/components/explore/hardware-explorer";

export const metadata: Metadata = {
  title: "Hardware catalog",
  description:
    "Compare Macs, GPUs and AI mini PCs by the specs that matter for local AI: usable memory, memory bandwidth, GPU compute, OS support and whether verified benchmarks exist.",
  alternates: { canonical: "/hardware" },
};

export default function HardwarePage() {
  const benchmarkedChips = [...new Set(BENCHMARKS.filter((b) => b.verified).map((b) => b.chipKey))].filter((k) => HARDWARE.some((h) => h.chipKey === k));
  return (
    <ExplorePage
      current="hardware"
      title="Hardware catalog"
      intro="Macs, GPU desktops, laptops and AI mini PCs, described by the specs that actually decide local AI performance: memory and bandwidth."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Callout icon={<MemoryStick className="size-4" />} title="Unified memory: one shared pool">
          Apple Silicon, AMD Ryzen AI Max and NVIDIA DGX Spark share one pool between the OS, your apps and the GPU. Large models fit, but the
          OS, your dev tools and a <strong>GPU wired-memory limit</strong> all take a share, so a 32 GB Mac does not have 32 GB for a model.
        </Callout>
        <Callout icon={<Cpu className="size-4" />} title="Discrete GPUs: two separate pools">
          A graphics card has its own fast <strong>VRAM</strong>; system RAM is separate and much slower. Models that fit in VRAM fly; layers that
          spill into system RAM run at RAM speed. The advisor never adds VRAM and RAM together as if they were the same.
        </Callout>
      </div>
      <p className="-mt-4 max-w-3xl text-sm text-muted-foreground">
        <strong className="text-foreground">Bandwidth</strong> (GB/s) is the best single predictor of generation speed: every new token reads the
        model’s active weights from memory once. <strong className="text-foreground">Compute</strong> (TFLOPS) mainly determines how fast long prompts
        are ingested.
      </p>
      <p className="text-sm text-muted-foreground">{HARDWARE.length} machine configurations across {new Set(HARDWARE.map((h) => h.chipKey)).size} chip families. Search by name, compare specifications, and expand each row for its sources and assumptions. A published chip benchmark does not make every configuration a measured result.</p>
      <HardwareExplorer hardware={HARDWARE} benchmarkedChips={benchmarkedChips} />
    </ExplorePage>
  );
}
