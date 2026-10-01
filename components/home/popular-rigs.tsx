"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Cpu, Laptop, HardDrive, Zap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PopularRig {
  id: string;
  name: string;
  category: "apple" | "nvidia" | "apu";
  tagline: string;
  memoryBadge: string;
  sweetSpotModel: string;
  comfortLabel: string;
  expectedSpeed: string;
  features: string[];
}

const RIGS: PopularRig[] = [
  // Apple
  {
    id: "mba-m3-10c-16",
    category: "apple",
    name: "MacBook Air M3 (16 GB)",
    tagline: "Ultraportable everyday AI setup",
    memoryBadge: "16 GB Unified",
    sweetSpotModel: "Qwen 3.5 9B / Llama 3.2 3B",
    comfortLabel: "Comfortable for Chat & Assist",
    expectedSpeed: "26–34 tok/s",
    features: ["Silent zero-fan operation", "3–4 GB OS reserve protected", "Great for Open WebUI & Continue"],
  },
  {
    id: "mbp-m4-pro-20c-48",
    category: "apple",
    name: "MacBook Pro M4 Pro (48 GB)",
    tagline: "The sweet spot for local coding agents",
    memoryBadge: "48 GB Unified · 273 GB/s",
    sweetSpotModel: "Qwen 3.6 27B / 35B-A3B MoE",
    comfortLabel: "Excellent for Agentic Coding",
    expectedSpeed: "30–38 tok/s",
    features: ["High memory bandwidth", "Runs Claude Code & OpenCode", "Comfortable with 32K context"],
  },
  {
    id: "studio-m2-ultra-76c-128",
    category: "apple",
    name: "Mac Studio M2 Ultra (128 GB)",
    tagline: "Heavyweight local workstation",
    memoryBadge: "128 GB Unified · 800 GB/s",
    sweetSpotModel: "Llama 3.3 70B / Qwen 2.5 72B",
    comfortLabel: "Comfortable for 70B Class",
    expectedSpeed: "18–24 tok/s",
    features: ["Runs massive 70B flagships", "Zero GPU layer splitting issues", "64K+ document reasoning"],
  },

  // NVIDIA
  {
    id: "pc-rtx-3060-12-32",
    category: "nvidia",
    name: "Desktop PC · RTX 3060 (12 GB)",
    tagline: "The most popular budget local AI GPU",
    memoryBadge: "12 GB VRAM · 360 GB/s",
    sweetSpotModel: "Qwen 2.5 7B (Q8) / Mistral 7B",
    comfortLabel: "Fast for 7B–9B Models",
    expectedSpeed: "45–60 tok/s",
    features: ["High tokens/second on small models", "Full CUDA tensor core acceleration", "Affordable entry into local LLMs"],
  },
  {
    id: "pc-rtx-4070-ti-super-32",
    category: "nvidia",
    name: "Desktop PC · RTX 4070 Ti Super",
    tagline: "High-speed 16GB Ada Lovelace rig",
    memoryBadge: "16 GB VRAM · 672 GB/s",
    sweetSpotModel: "Mistral Nemo 12B / Gemma 2 9B",
    comfortLabel: "Excellent for Fast Development",
    expectedSpeed: "65–85 tok/s",
    features: ["Blazing fast generation speed", "Full VRAM offload up to 14B", "Super snappy time-to-first-token"],
  },
  {
    id: "pc-rtx-4090-64",
    category: "nvidia",
    name: "Desktop PC · RTX 4090 (24 GB)",
    tagline: "The pinnacle consumer GPU for coding",
    memoryBadge: "24 GB VRAM · 1,008 GB/s",
    sweetSpotModel: "Qwen 2.5 32B (Q4) / DeepSeek 33B",
    comfortLabel: "Flies on 32B Coding Agents",
    expectedSpeed: "75–110 tok/s",
    features: ["Over 1,000 GB/s memory bandwidth", "Sub-second prompt ingest for agents", "The gold standard for local speed"],
  },

  // APUs
  {
    id: "strix-halo-395-128",
    category: "apu",
    name: "Ryzen AI Max+ 395 (128 GB)",
    tagline: "Next-gen massive unified memory APU",
    memoryBadge: "128 GB Unified · 270 GB/s",
    sweetSpotModel: "Qwen 2.5 72B / Llama 3.3 70B",
    comfortLabel: "Massive Models on Linux/Windows",
    expectedSpeed: "14–20 tok/s",
    features: ["Up to 96GB dedicated to GPU", "No PCIe transfer bottlenecks", "Affordable alternative to Mac Studio"],
  },
  {
    id: "laptop-core-ultra-258v-32",
    category: "apu",
    name: "Core Ultra 7 (Arc 140V · 32 GB)",
    tagline: "Efficient thin-and-light laptop AI",
    memoryBadge: "32 GB LPDDR5X · 136 GB/s",
    sweetSpotModel: "Qwen 3.5 9B / Phi-4 14B",
    comfortLabel: "Comfortable Mobile Assistant",
    expectedSpeed: "18–26 tok/s",
    features: ["All-day battery life efficiency", "Vulkan & SYCL acceleration", "Clean on-the-go coding companion"],
  },
];

const CATEGORIES = [
  { id: "apple", label: "Apple Silicon", icon: Laptop },
  { id: "nvidia", label: "NVIDIA RTX GPUs", icon: Zap },
  { id: "apu", label: "Unified APUs & Laptops", icon: Cpu },
] as const;

export function PopularRigsMatrix() {
  const [tab, setTab] = useState<"apple" | "nvidia" | "apu">("apple");

  const filtered = RIGS.filter((r) => r.category === tab);

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex max-w-full items-center gap-1.5 overflow-x-auto no-scrollbar rounded-2xl border border-border/80 bg-muted/70 p-1.5 shadow-2xs">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = tab === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setTab(c.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition cursor-pointer select-none",
                  active
                    ? "bg-card text-foreground shadow-xs font-semibold ring-1 ring-border/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                <Icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rigs Cards Grid */}
      <div className="grid gap-5 md:grid-cols-3">
        {filtered.map((rig) => (
          <div
            key={rig.id}
            className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs hover:border-primary/40 hover:shadow-md transition-all duration-200"
          >
            <div>
              {/* Top Badges */}
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {rig.memoryBadge}
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {rig.expectedSpeed}
                </span>
              </div>

              {/* Title & Tagline */}
              <h3 className="mt-3 text-lg font-bold tracking-tight text-foreground leading-snug">
                {rig.name}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">{rig.tagline}</p>

              {/* Sweet spot model box */}
              <div className="mt-4 rounded-xl border border-border/70 bg-muted/40 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Sweet Spot Model
                </p>
                <p className="mt-0.5 text-sm font-bold text-foreground">{rig.sweetSpotModel}</p>
                <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" />
                  {rig.comfortLabel}
                </p>
              </div>

              {/* Features list */}
              <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                {rig.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary/70 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Direct Test CTA */}
            <div className="mt-6 pt-4 border-t border-border/60">
              <Link
                href={`/check?hw=${rig.id}&uc=agentic-coding`}
                className="flex items-center justify-between rounded-xl bg-muted/70 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-150"
              >
                <span>Check What Runs on This Rig</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
