"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Cpu,
  Database,
  Gauge,
  Layers,
  Sparkles,
  Zap,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Laptop,
} from "lucide-react";
import { getHardware } from "@/data";
import type { UseCaseId, WorkloadProfileInput } from "@/lib/schemas";
import { evaluate } from "@/lib/recommendations";
import { evaluateHref } from "@/lib/links";
import { fmtGB, fmtTps, fmtSec, fmtCtx } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ComfortBadge, ComfortScale, COMFORT_STYLE } from "@/components/advisor/comfort";
import { DimensionGauges } from "@/components/advisor/gauges";

const HW = [
  { id: "mbp-m4-pro-20c-48", label: "MacBook Pro M4 Pro", spec: "48 GB Unified" },
  { id: "mba-m3-10c-16", label: "MacBook Air M3", spec: "16 GB Unified" },
  { id: "pc-rtx-4090-64", label: "PC · RTX 4090", spec: "24 GB VRAM" },
  { id: "pc-rtx-4080-super-32", label: "PC · RTX 4080 Super", spec: "16 GB VRAM" },
  { id: "strix-halo-395-128", label: "Ryzen AI Max+", spec: "128 GB Unified" },
];

const MODELS = [
  { id: "qwen3.5-9b", quant: "q4" as const, label: "Qwen 3.5 9B", type: "Dense · 9.7B" },
  { id: "qwen3.6-27b", quant: "q4" as const, label: "Qwen 3.6 27B", type: "Dense · 27.8B" },
  { id: "qwen3.6-35b-a3b", quant: "q4" as const, label: "Qwen 3.6 35B-A3B", type: "MoE · 3B active" },
  { id: "gpt-oss-20b", quant: "mxfp4" as const, label: "gpt-oss-20b", type: "Dense · 20.8B" },
];

const WORKLOADS: { id: string; label: string; icon: string; w: WorkloadProfileInput }[] = [
  { id: "chat", label: "Casual Chat", icon: "💬", w: { useCase: "casual-chat", toolId: "open-webui", devEnv: "light" } },
  { id: "qa", label: "Coding Assistant", icon: "💻", w: { useCase: "coding-questions", toolId: "continue", devEnv: "normal" } },
  { id: "agent", label: "Agentic Loop", icon: "🤖", w: { useCase: "agentic-coding", toolId: "opencode", repositorySize: "medium", devEnv: "normal" } },
  { id: "docs", label: "Long Docs 64K", icon: "📑", w: { useCase: "long-doc-qa", toolId: "open-webui", devEnv: "light", desiredContextWindow: 65536 } },
];

export function HomeDemo() {
  const [hw, setHw] = useState(HW[0].id);
  const [model, setModel] = useState(MODELS[1].id);
  const [wl, setWl] = useState("agent");

  const currentHw = HW.find((x) => x.id === hw) ?? HW[0];
  const m = MODELS.find((x) => x.id === model) ?? MODELS[0];
  const workload = WORKLOADS.find((x) => x.id === wl)!.w;

  const rec = useMemo(
    () => evaluate({ hardware: getHardware(hw), modelId: m.id, quant: m.quant, workload }),
    [hw, m, workload],
  );

  const allWorkloadRatings = useMemo(
    () =>
      WORKLOADS.map((x) => ({
        id: x.id,
        level: evaluate({ hardware: getHardware(hw), modelId: m.id, quant: m.quant, workload: x.w }).level,
      })),
    [hw, m],
  );

  const style = COMFORT_STYLE[rec.level];
  const reason = rec.explanation.blockers[0] ?? rec.explanation.warnings[0] ?? rec.explanation.positives[0];
  const perf = rec.performance;
  const isBlocked = rec.level === "unsupported" || rec.level === "does-not-fit";

  // Calculate memory bar fractions
  const totalMem = rec.memory.installedGB || 1;
  const osPct = Math.min(100, (rec.memory.osReserveGB / totalMem) * 100);
  const modelPct = Math.min(100, (rec.memory.weightsGB / totalMem) * 100);
  const kvPct = Math.min(100, (rec.memory.kvCacheGB / totalMem) * 100);
  const freePct = Math.max(0, 100 - osPct - modelPct - kvPct);

  return (
    <div className="relative rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-5 shadow-lg sm:p-7 transition-all">
      {/* Top Header Label */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-md bg-primary/10 text-primary">
            <Zap className="size-3.5" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Interactive Hardware Simulator
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Engine Active
        </span>
      </div>

      {/* Selectors Grid */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {/* Hardware Selector */}
        <div>
          <label className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Laptop className="size-3.5 text-primary" /> 1. Select Hardware
            </span>
            <span className="text-[11px] text-primary font-medium">{currentHw.spec}</span>
          </label>
          <div className="flex flex-nowrap lg:flex-wrap gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {HW.map((h) => {
              const active = hw === h.id;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setHw(h.id)}
                  className={cn(
                    "flex-1 shrink-0 rounded-xl border p-2.5 text-left transition cursor-pointer select-none",
                    active
                      ? "border-primary bg-primary/10 ring-1 ring-primary shadow-2xs"
                      : "border-border/70 bg-card hover:bg-muted/70",
                  )}
                >
                  <p className="text-xs font-semibold leading-tight text-foreground truncate">{h.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{h.spec}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Model Selector */}
        <div>
          <label className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Database className="size-3.5 text-primary" /> 2. Pick Model
            </span>
            <span className="text-[11px] text-primary font-medium">{m.type}</span>
          </label>
          <div className="flex flex-nowrap lg:flex-wrap gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {MODELS.map((x) => {
              const active = model === x.id;
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => setModel(x.id)}
                  className={cn(
                    "flex-1 shrink-0 rounded-xl border p-2.5 text-left transition cursor-pointer select-none",
                    active
                      ? "border-primary bg-primary/10 ring-1 ring-primary shadow-2xs"
                      : "border-border/70 bg-card hover:bg-muted/70",
                  )}
                >
                  <p className="text-xs font-semibold leading-tight text-foreground truncate">{x.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{x.type}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Workload Selector */}
        <div>
          <label className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Layers className="size-3.5 text-primary" /> 3. Choose Workload
            </span>
            <span className="text-[11px] text-muted-foreground">Dots show rating</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {WORKLOADS.map((x) => {
              const lvl = allWorkloadRatings.find((a) => a.id === x.id)?.level ?? "comfortable";
              const active = wl === x.id;
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => setWl(x.id)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-2.5 text-left transition cursor-pointer select-none",
                    active
                      ? "border-primary bg-primary/10 ring-1 ring-primary shadow-2xs"
                      : "border-border/70 bg-card hover:bg-muted/70",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground truncate">
                    <span>{x.icon}</span>
                    <span className="truncate">{x.label}</span>
                  </span>
                  <span
                    className={cn(
                      "size-2.5 shrink-0 rounded-full ring-2 ring-background",
                      COMFORT_STYLE[lvl]?.dot ?? "bg-border",
                    )}
                    title={`Rating: ${lvl}`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Verdict Card with Ambient Tint */}
      <div className={cn("mt-6 rounded-2xl border p-5 sm:p-6 transition-all", style.bg, style.border)}>
        {/* Top Status & Headline */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl space-y-1.5">
            <div className="flex items-center gap-2">
              <ComfortBadge level={rec.level} size="md" />
              <ComfortScale level={rec.level} />
            </div>
            <h3 className={cn("text-xl font-bold tracking-tight sm:text-2xl pt-1", style.text)}>
              {rec.headline}
            </h3>
            <p className="text-sm font-medium text-foreground/90">{rec.verdict}</p>
            {reason && !isBlocked && (
              <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">{reason}</p>
            )}
          </div>

          {/* Quick Metrics Strip */}
          {!isBlocked && perf && (
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 shrink-0 sm:min-w-[170px]">
              <div className="rounded-xl border border-border/70 bg-card/80 p-3 shadow-2xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Speed
                </span>
                <p className="text-base font-bold text-foreground">
                  {fmtTps(perf.perStreamGenerationTps, perf.basis)}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  {perf.basis === "measured" ? "Measured bench" : "Calibrated estimate"}
                </span>
              </div>
              <div className="rounded-xl border border-border/70 bg-card/80 p-3 shadow-2xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Headroom
                </span>
                <p className="text-base font-bold text-foreground">
                  {fmtGB(rec.memory.headroomGB)}
                </p>
                <span className="text-[10px] text-muted-foreground">Free for OS &amp; IDE</span>
              </div>
            </div>
          )}
        </div>

        {/* Memory Allocation Visualizer */}
        {!isBlocked && (
          <div className="mt-5 rounded-xl border border-border/60 bg-card/60 p-4">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
              <span className="flex items-center gap-1.5 text-foreground font-semibold">
                <HardDrive className="size-3.5 text-primary" /> Memory Breakdown
              </span>
              <span>
                Total: <strong className="text-foreground">{fmtGB(rec.memory.installedGB)}</strong> ({rec.memory.architecture} memory)
              </span>
            </div>
            {/* Visual Bar */}
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted flex" role="progressbar">
              <div
                style={{ width: `${osPct}%` }}
                className="h-full bg-slate-400 dark:bg-slate-600 transition-all"
                title={`OS & Tool Reserve: ${fmtGB(rec.memory.osReserveGB)}`}
              />
              <div
                style={{ width: `${modelPct}%` }}
                className="h-full bg-primary transition-all"
                title={`Model Weights: ${fmtGB(rec.memory.weightsGB)}`}
              />
              <div
                style={{ width: `${kvPct}%` }}
                className="h-full bg-amber-500 transition-all"
                title={`KV Cache: ${fmtGB(rec.memory.kvCacheGB)}`}
              />
              <div
                style={{ width: `${freePct}%` }}
                className="h-full bg-emerald-500/80 transition-all"
                title={`Free Headroom: ${fmtGB(rec.memory.headroomGB)}`}
              />
            </div>
            {/* Legend */}
            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-slate-400 dark:bg-slate-600" />
                OS &amp; Dev ({fmtGB(rec.memory.osReserveGB)})
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-primary" />
                Model Weights ({fmtGB(rec.memory.weightsGB)})
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-amber-500" />
                KV Cache ({fmtGB(rec.memory.kvCacheGB)})
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-500" />
                Free Headroom ({fmtGB(rec.memory.headroomGB)})
              </span>
            </div>
          </div>
        )}

        {/* Dimension Gauges */}
        {rec.dimensions.length > 0 && !isBlocked && (
          <div className="mt-5">
            <DimensionGauges
              dims={rec.dimensions}
              compact
              keys={["memory", "generation", "prefill", "context", "tool", "suitability"]}
            />
          </div>
        )}

        {/* Action Link */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
          <p className="text-xs text-muted-foreground">
            Looking for setup instructions, full context scaling &amp; token-per-second curve?
          </p>
          <Link
            href={evaluateHref({ hardwareId: hw, modelId: m.id, quant: m.quant, workload })}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:underline"
          >
            <span>Inspect Full Evaluation &amp; What-If Scenarios</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
