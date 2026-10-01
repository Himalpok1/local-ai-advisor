"use client";
import { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Gauge,
  TriangleAlert,
  CircleAlert,
  CircleX,
  CircleSlash,
  ArrowRight,
  Info,
} from "lucide-react";
import { COMFORT_DESCRIPTION, COMFORT_LABEL, type ComfortLevel } from "@/lib/schemas/results";
import { COMFORT_STYLE } from "@/components/advisor/comfort";
import { cn } from "@/lib/utils";

interface ComfortDetail {
  level: ComfortLevel;
  experienceHeadline: string;
  speedExpectation: string;
  headroomExpectation: string;
  dailyFeel: string;
  exampleScenario: string;
}

const DETAILS: Record<ComfortLevel, ComfortDetail> = {
  excellent: {
    level: "excellent",
    experienceHeadline: "Flies effortlessly with huge headroom",
    speedExpectation: "> 35 tok/s decode · < 1.0s first token",
    headroomExpectation: "12+ GB free RAM for IDE, Docker, and 50 Chrome tabs",
    dailyFeel: "Instant, responsive streaming. The LLM feels like a native local OS daemon with zero thermal fan noise.",
    exampleScenario: "Qwen 2.5 32B on an M4 Pro 48GB or RTX 4090 for fast multi-turn Claude Code workflows.",
  },
  comfortable: {
    level: "comfortable",
    experienceHeadline: "The ideal practical daily driver setup",
    speedExpectation: "20–35 tok/s decode · < 2.5s first token",
    headroomExpectation: "4–8 GB free RAM reserved for your OS & editor",
    dailyFeel: "Great fluid experience. Perfect for coding assistants, deep doc analysis, and long interactive discussions.",
    exampleScenario: "Qwen 3.5 9B on a 16GB MacBook Air or RTX 3060; or 27B on a 32GB Mac mini.",
  },
  acceptable: {
    level: "acceptable",
    experienceHeadline: "Usable for everyday work with minor tradeoffs",
    speedExpectation: "12–20 tok/s decode · 3–6s first token",
    headroomExpectation: "2–4 GB headroom; system remains stable",
    dailyFeel: "Readable pace (roughly as fast as human reading). Noticeable delay on cold prompt ingest, but totally viable.",
    exampleScenario: "Running a 14B model on an 16GB laptop or offloading 20% of layers to CPU.",
  },
  borderline: {
    level: "borderline",
    experienceHeadline: "Frustrating for iterative agents; tolerable for slow chat",
    speedExpectation: "5–12 tok/s decode · 8–18s first token",
    headroomExpectation: "< 2 GB free; system close to swap threshold",
    dailyFeel: "You wait on each response. Agentic multi-turn loops take minutes per step. Other heavy apps will lag.",
    exampleScenario: "Running a 20B dense model with only 1GB RAM remaining on Windows.",
  },
  "technically-runs": {
    level: "technically-runs",
    experienceHeadline: "Executes without crashing, but agonizingly slow",
    speedExpectation: "1–4 tok/s decode · > 30s first token",
    headroomExpectation: "Virtually zero headroom; heavy disk swap paging",
    dailyFeel: "One word every two seconds. The machine fans spin at 100%, battery drains fast, and coding agents time out.",
    exampleScenario: "70B model offloaded to DDR4 system RAM on an older 4-core desktop.",
  },
  "does-not-fit": {
    level: "does-not-fit",
    experienceHeadline: "Out of memory: will abort or crash the OS",
    speedExpectation: "0 tok/s (Allocation failed)",
    headroomExpectation: "Required memory exceeds physical limit + safe swap",
    dailyFeel: "The runtime triggers an Out-Of-Memory (OOM) error immediately upon model initialization or context allocation.",
    exampleScenario: "Trying to load a 70B FP16 model (140GB) on a 32GB computer.",
  },
  unsupported: {
    level: "unsupported",
    experienceHeadline: "Missing architecture or API driver support",
    speedExpectation: "N/A",
    headroomExpectation: "Hardware lacks required instructions, CUDA, or Metal",
    dailyFeel: "Tool cannot establish an API connection or runtime lacks the needed tensor compute backend.",
    exampleScenario: "Attempting to run a CUDA-exclusive quantization on an Intel integrated GPU.",
  },
};

const LEVELS: ComfortLevel[] = [
  "excellent",
  "comfortable",
  "acceptable",
  "borderline",
  "technically-runs",
  "does-not-fit",
  "unsupported",
];

export function ComfortExplorer() {
  const [selected, setSelected] = useState<ComfortLevel>("comfortable");
  const detail = DETAILS[selected];
  const style = COMFORT_STYLE[selected];
  const Icon = style.Icon;

  return (
    <div className="space-y-6">
      {/* Pills Slider on mobile / bar on desktop */}
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 p-1 rounded-2xl border border-border/80 bg-muted/60 shadow-2xs">
        {LEVELS.map((lvl) => {
          const s = COMFORT_STYLE[lvl];
          const active = selected === lvl;
          const StepIcon = s.Icon;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelected(lvl)}
              className={cn(
                "flex-1 min-w-[120px] sm:min-w-0 flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold transition cursor-pointer select-none",
                active
                  ? "bg-card text-foreground shadow-xs ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50",
              )}
            >
              <StepIcon className={cn("size-3.5", active ? s.text : "text-muted-foreground")} />
              <span className="truncate">{COMFORT_LABEL[lvl]}</span>
            </button>
          );
        })}
      </div>

      {/* Detail Showcase Card */}
      <div className={cn("rounded-2xl border p-5 sm:p-7 transition-all duration-200", style.bg, style.border)}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold", style.text, style.border, "bg-card/80")}>
                <Icon className="size-4" />
                {COMFORT_LABEL[selected]}
              </span>
              <span className="text-xs font-medium text-muted-foreground">Local AI Rating Philosophy</span>
            </div>
            <h3 className={cn("text-xl font-bold tracking-tight sm:text-2xl", style.text)}>
              {detail.experienceHeadline}
            </h3>
            <p className="text-sm font-medium text-foreground/90 leading-relaxed">
              {COMFORT_DESCRIPTION[selected]}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Daily feeling:</strong> {detail.dailyFeel}
            </p>
          </div>

          {/* Metric Expectations Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 shrink-0 lg:w-80">
            <div className="rounded-xl border border-border/70 bg-card/80 p-3.5 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Typical Latency
              </span>
              <p className="mt-0.5 text-sm font-bold text-foreground">{detail.speedExpectation}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/80 p-3.5 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                RAM / VRAM Headroom
              </span>
              <p className="mt-0.5 text-sm font-bold text-foreground">{detail.headroomExpectation}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/80 p-3.5 shadow-2xs sm:col-span-2 lg:col-span-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Real-World Example
              </span>
              <p className="mt-0.5 text-xs text-muted-foreground leading-normal">{detail.exampleScenario}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
