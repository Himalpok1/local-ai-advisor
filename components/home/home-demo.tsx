"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getHardware } from "@/data";
import type { UseCaseId, WorkloadProfileInput } from "@/lib/schemas";
import { evaluate } from "@/lib/recommendations";
import { evaluateHref } from "@/lib/links";
import { cn } from "@/lib/utils";
import { Segmented } from "@/components/ui/form";
import { ComfortBadge, ComfortScale, COMFORT_STYLE } from "@/components/advisor/comfort";
import { DimensionGauges } from "@/components/advisor/gauges";

const HW = [
  { id: "mbp-m4-pro-20c-48", label: "MacBook Pro M4 Pro · 48 GB" },
  { id: "mbp-m4-pro-20c-24", label: "MacBook Pro M4 Pro · 24 GB" },
  { id: "pc-rtx-4090-64", label: "PC · RTX 4090" },
  { id: "strix-halo-395-128", label: "Ryzen AI Max+ · 128 GB" },
];
const MODELS = [
  { id: "qwen3.6-27b", quant: "q4" as const, label: "Qwen3.6 27B (dense)" },
  { id: "qwen3.6-35b-a3b", quant: "q4" as const, label: "Qwen3.6 35B-A3B (MoE)" },
  { id: "gpt-oss-20b", quant: "mxfp4" as const, label: "gpt-oss-20b" },
];
const WORKLOADS: { id: string; label: string; w: WorkloadProfileInput }[] = [
  { id: "chat", label: "Casual chat", w: { useCase: "casual-chat", toolId: "open-webui", devEnv: "light" } },
  { id: "qa", label: "Coding questions", w: { useCase: "coding-questions", toolId: "continue", devEnv: "normal" } },
  { id: "agent", label: "Agentic coding", w: { useCase: "agentic-coding", toolId: "opencode", repositorySize: "medium", devEnv: "normal" } },
  { id: "docs", label: "Long documents", w: { useCase: "long-doc-qa", toolId: "open-webui", devEnv: "light", desiredContextWindow: 65536 } },
];

export function HomeDemo() {
  const [hw, setHw] = useState(HW[0].id);
  const [model, setModel] = useState(MODELS[0].id);
  const [wl, setWl] = useState("chat");
  const m = MODELS.find((x) => x.id === model)!;
  const workload = WORKLOADS.find((x) => x.id === wl)!.w;
  const rec = useMemo(() => evaluate({ hardware: getHardware(hw), modelId: m.id, quant: m.quant, workload }), [hw, m, workload]);
  const all = useMemo(
    () => WORKLOADS.map((x) => ({ id: x.id, level: evaluate({ hardware: getHardware(hw), modelId: m.id, quant: m.quant, workload: x.w }).level as ReturnType<typeof evaluate>["level"] })),
    [hw, m],
  );
  const style = COMFORT_STYLE[rec.level];
  const reason = rec.explanation.blockers[0] ?? rec.explanation.warnings[0] ?? rec.explanation.positives[0];

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hardware</p>
          <Segmented ariaLabel="Example hardware" size="sm" value={hw} onChange={setHw} options={HW.map((h) => ({ value: h.id, label: h.label }))} />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Model</p>
          <Segmented ariaLabel="Example model" size="sm" value={model} onChange={setModel} options={MODELS.map((x) => ({ value: x.id, label: x.label }))} />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">What you want to do</p>
          <div className="flex flex-wrap gap-1.5">
            {WORKLOADS.map((x) => {
              const lvl = all.find((a) => a.id === x.id)!.level;
              return (
                <button
                  key={x.id}
                  type="button"
                  aria-pressed={wl === x.id}
                  onClick={() => setWl(x.id)}
                  className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition", wl === x.id ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted")}
                >
                  <span className={cn("size-2 rounded-full", COMFORT_STYLE[lvl].dot)} />
                  {x.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className={cn("mt-5 rounded-xl border p-5", style.bg, style.border)}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <h3 className={cn("text-2xl font-semibold tracking-tight", style.text)}>{rec.headline}</h3>
            <p className="mt-1.5 text-sm">{rec.verdict}</p>
            {reason && rec.level !== "comfortable" && rec.level !== "excellent" && <p className="mt-1 text-sm text-muted-foreground">{reason}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <ComfortBadge level={rec.level} />
            <ComfortScale level={rec.level} />
          </div>
        </div>
        {rec.dimensions.length > 0 && (
          <div className="mt-4">
            <DimensionGauges dims={rec.dimensions} compact keys={["memory", "generation", "prefill", "context", "tool", "suitability"]} />
          </div>
        )}
        <Link href={evaluateHref({ hardwareId: hw, modelId: m.id, quant: m.quant, workload })} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          See the full explanation <ArrowRight className="size-4" />
        </Link>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Same hardware, same model — the dots show how the rating changes with the workload. {useCaseHint(workload.useCase)}</p>
    </div>
  );
}

function useCaseHint(u: UseCaseId) {
  return u === "agentic-coding" ? "Agents repeat large prompts dozens of times, so prompt processing and per-step latency dominate." : "";
}
