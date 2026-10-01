"use client";
import { useMemo, useState } from "react";
import { getModel, QUANT_ORDER, QUANTIZATIONS } from "@/data";
import { weightsGB } from "@/lib/memory";
import { fmtGB } from "@/lib/format";
import type { QuantId } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/form";
import { MODEL_OPTIONS } from "./model-options";
import { WidgetFrame } from "./widget-frame";

function qualityNote(loss: number): { label: string; dot: string } {
  if (loss === 0) return { label: "No loss", dot: "bg-excellent" };
  if (loss < 0.005) return { label: "Negligible loss", dot: "bg-excellent" };
  if (loss < 0.015) return { label: "Very small loss", dot: "bg-comfortable" };
  if (loss < 0.03) return { label: "Small loss", dot: "bg-comfortable" };
  if (loss < 0.06) return { label: "Slight loss", dot: "bg-acceptable" };
  return { label: "Noticeable loss", dot: "bg-borderline" };
}

export function QuantCalculator() {
  const [modelId, setModelId] = useState("qwen3.6-27b");
  const [picked, setPicked] = useState<QuantId | null>(null);
  const model = getModel(modelId);

  const rows = useMemo(
    () =>
      QUANT_ORDER.filter((q) => model.supportedQuantizations.includes(q) && QUANTIZATIONS[q].bitsPerWeight.gguf !== undefined).map((q) => {
        const quant = QUANTIZATIONS[q];
        return { quant, gb: weightsGB(model, quant, "gguf") };
      }),
    [model],
  );
  const max = Math.max(...rows.map((r) => r.gb));
  const selected = rows.find((r) => r.quant.id === picked) ?? rows.find((r) => r.quant.id === "q4") ?? rows[0];

  return (
    <WidgetFrame
      title="Quantization size calculator"
      description="Weights only (GGUF). KV cache and runtime overhead come on top."
      controls={<Select ariaLabel="Model" value={modelId} onChange={(v) => { setModelId(v); setPicked(null); }} options={MODEL_OPTIONS} className="w-full sm:w-80" />}
    >
      <div className="space-y-1.5" role="group" aria-label={`Weight size of ${model.name} at each quantization`}>
        {rows.map(({ quant, gb }) => {
          const q = qualityNote(quant.qualityLoss);
          const active = selected?.quant.id === quant.id;
          return (
            <button
              key={quant.id}
              type="button"
              aria-pressed={active}
              onClick={() => setPicked(quant.id)}
              className={cn(
                "grid w-full grid-cols-[5.5rem_1fr_4rem] items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-muted sm:grid-cols-[9rem_1fr_4.5rem]",
                active && "bg-muted",
              )}
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium">{quant.label}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {quant.formatNames.gguf} · {quant.bitsPerWeight.gguf} bits
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-5 flex-1 rounded bg-muted">
                  <span
                    className={cn("block h-full rounded transition-all", active ? "bg-primary/80" : "bg-primary/35")}
                    style={{ width: `${Math.max(2, (gb / max) * 100)}%` }}
                  />
                </span>
                <span className={cn("hidden size-2 shrink-0 rounded-full sm:block", q.dot)} title={q.label} />
              </span>
              <span className="text-right font-mono text-sm tabular-nums">{fmtGB(gb)}</span>
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="mt-4 rounded-lg bg-muted/60 px-4 py-3 text-sm">
          <p className="flex flex-wrap items-center gap-x-2 font-medium">
            {selected.quant.label} ({selected.quant.formatNames.gguf}) ≈ {fmtGB(selected.gb)}
            <span className="inline-flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
              <span className={cn("size-2 rounded-full", qualityNote(selected.quant.qualityLoss).dot)} />
              {qualityNote(selected.quant.qualityLoss).label}
            </span>
          </p>
          <p className="mt-1 text-muted-foreground">{selected.quant.description}</p>
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Click a row for details. Sizes use published file sizes where known, otherwise parameters × bits per weight. Quality notes are editorial approximations.
      </p>
    </WidgetFrame>
  );
}
