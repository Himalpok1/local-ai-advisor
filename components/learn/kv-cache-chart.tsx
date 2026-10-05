"use client";
import { useMemo, useState } from "react";
import { getModel } from "@/data";
import { kvCacheGB } from "@/lib/memory";
import { fmtCtx, fmtGB } from "@/lib/format";
import type { Model } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/form";
import { MODEL_OPTIONS } from "./model-options";
import { WidgetFrame } from "./widget-frame";

const CONTEXTS = [8, 16, 32, 64, 128].map((k) => k * 1024);
const REFERENCE_ID = "qwen3-32b";
const PRESETS = ["qwen3.6-27b", "gemma-4-31b", "qwen3-32b"];

function attentionKind(m: Model): { label: string; detail: string; efficient: boolean } {
  const a = m.architecture;
  const pct = Math.round(a.fullAttentionFraction * 100);
  if (a.fullAttentionFraction < 1 && a.slidingWindow) {
    return {
      label: "Sliding-window hybrid",
      detail: `Only ~${pct}% of layers remember the whole context; the rest only look at the last ${a.slidingWindow.toLocaleString("en-US")} tokens, so their cache stops growing.`,
      efficient: true,
    };
  }
  if (a.fullAttentionFraction < 1) {
    return {
      label: "Hybrid linear attention",
      detail: `Only ~${pct}% of layers keep a per-token KV cache; the others keep a small fixed-size state, whatever the context length.`,
      efficient: true,
    };
  }
  return {
    label: "Classic full attention",
    detail: "Every layer stores keys and values for every token, so the cache grows in a straight line with context.",
    efficient: false,
  };
}

export function KvCacheChart() {
  const [modelId, setModelId] = useState("qwen3.6-27b");
  const model = getModel(modelId);
  const reference = getModel(REFERENCE_ID);
  const showRef = modelId !== REFERENCE_ID;
  const kind = attentionKind(model);

  const rows = useMemo(
    () =>
      CONTEXTS.map((ctx) => ({
        ctx,
        supported: ctx <= model.contextWindow,
        f16: kvCacheGB(model, ctx, 1, "f16"),
        q8: kvCacheGB(model, ctx, 1, "q8"),
        ref: kvCacheGB(reference, ctx, 1, "f16"),
      })),
    [model, reference],
  );
  const max = Math.max(...rows.map((r) => Math.max(r.supported ? r.f16 : 0, showRef ? r.ref : 0)), 0.1);
  const last = rows[rows.length - 1];
  const pct = (gb: number) => `${Math.max(1, (gb / max) * 100)}%`;

  return (
    <WidgetFrame
      title="KV cache vs. context length"
      description="Extra memory needed on top of the weights for one conversation."
      controls={<Select ariaLabel="Model" value={modelId} onChange={setModelId} options={MODEL_OPTIONS} className="w-full sm:w-80" />}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">Try:</span>
        {PRESETS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setModelId(id)}
            aria-pressed={modelId === id}
            className={cn("rounded-full border-2 px-2.5 py-1 transition hover:bg-muted", modelId === id && "border-ink bg-accent text-accent-foreground")}
          >
            {getModel(id).name}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-primary/75" /> {model.name}, FP16 KV
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-primary/35" /> {model.name}, Q8 KV
        </span>
        {showRef && (
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm border-2 border-dashed border-muted-foreground/70" /> {reference.name} (classic), FP16
          </span>
        )}
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.ctx} className="grid grid-cols-[3rem_1fr] items-center gap-3">
            <span className="text-right font-mono text-sm tabular-nums">{fmtCtx(r.ctx)}</span>
            {r.supported ? (
              <div className="space-y-1">
                <Bar width={pct(r.f16)} className="bg-primary/75" value={fmtGB(r.f16)} label={`FP16 KV at ${fmtCtx(r.ctx)}`} />
                <Bar width={pct(r.q8)} className="bg-primary/35" value={fmtGB(r.q8)} label={`Q8 KV at ${fmtCtx(r.ctx)}`} />
                {showRef && (
                  <Bar
                    width={pct(r.ref)}
                    className="border-2 border-dashed border-muted-foreground/70 bg-transparent"
                    value={fmtGB(r.ref)}
                    label={`${reference.name} FP16 KV at ${fmtCtx(r.ctx)}`}
                    muted
                  />
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Beyond this model’s {fmtCtx(model.contextWindow)} context window</p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-[3rem_1fr] gap-3 text-[11px] text-muted-foreground">
        <span className="text-right">context</span>
        <span>GB of KV cache (one conversation)</span>
      </div>

      <div className={cn("mt-4 rounded-lg px-4 py-3 text-sm", kind.efficient ? "bg-comfortable/10" : "bg-muted/70")}>
        <p className="font-medium">{kind.label}</p>
        <p className="mt-0.5 text-muted-foreground">{kind.detail}</p>
        {last.supported && showRef && (
          <p className="mt-1.5">
            At {fmtCtx(last.ctx)}: <span className="font-semibold">{fmtGB(last.f16)}</span> for {model.name} vs.{" "}
            <span className="font-semibold">{fmtGB(last.ref)}</span> for {reference.name}
            {last.f16 > 0 && last.ref / last.f16 >= 1.5 ? ` (${(last.ref / last.f16).toFixed(1)}× less)` : ""}.
          </p>
        )}
      </div>
    </WidgetFrame>
  );
}

function Bar({ width, className, value, label, muted }: { width: string; className: string; value: string; label: string; muted?: boolean }) {
  return (
    <div className="flex items-center gap-2" title={`${label}: ${value}`}>
      <div className="h-3.5 flex-1">
        <div className={cn("h-full rounded-sm transition-all", className)} style={{ width }} />
      </div>
      <span className={cn("w-14 shrink-0 text-right font-mono text-xs tabular-nums", muted && "text-muted-foreground")}>{value}</span>
    </div>
  );
}
