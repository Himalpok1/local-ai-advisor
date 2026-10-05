import type { DimensionResult } from "@/lib/schemas/results";
import { cn } from "@/lib/utils";
import { BrainCircuit, Cpu, Gauge, Layers, MemoryStick, Plug, Repeat, ScrollText, Timer } from "lucide-react";

const ICONS = {
  memory: MemoryStick,
  generation: Gauge,
  prefill: Timer,
  context: ScrollText,
  runtime: Cpu,
  tool: Plug,
  suitability: BrainCircuit,
  concurrency: Layers,
  stability: Repeat,
} as const;

const LEVEL_TEXT = { excellent: "Excellent", good: "Good", fair: "Fair", poor: "Poor", inadequate: "Inadequate" } as const;
const LEVEL_COLOR = {
  excellent: "bg-excellent",
  good: "bg-comfortable",
  fair: "bg-acceptable",
  poor: "bg-borderline",
  inadequate: "bg-technical",
} as const;

/** Separate indicators per dimension — never one collapsed score. */
export function DimensionGauges({ dims, compact, keys }: { dims: DimensionResult[]; compact?: boolean; keys?: DimensionResult["key"][] }) {
  const list = keys ? keys.map((k) => dims.find((d) => d.key === k)!).filter(Boolean) : dims;
  return (
    <div className={cn("grid gap-3", compact ? "grid-cols-2 sm:grid-cols-3" : "sm:grid-cols-2")}>
      {list.map((d) => {
        const Icon = ICONS[d.key];
        const pct = Math.max(6, (d.score / 4) * 100);
        return (
          <div key={d.key} className={cn("rounded-lg border-2 bg-card p-3", compact && "p-2.5")}>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Icon className="size-4 text-muted-foreground" />
                {d.label}
              </span>
              <span className="text-xs text-muted-foreground">{LEVEL_TEXT[d.level]}</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full border-[1.5px] border-ink bg-muted" role="meter" aria-valuemin={0} aria-valuemax={4} aria-valuenow={Math.round(d.score)} aria-label={`${d.label}: ${LEVEL_TEXT[d.level]}`}>
              <div className={cn("h-full rounded-full", LEVEL_COLOR[d.level])} style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1.5 truncate text-xs text-muted-foreground" title={d.summary}>
              {d.summary}
            </p>
            {!compact && (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground/90">
                <span className="font-medium text-foreground/70">Importance for this workload: {d.importance.replace("-", " ")}.</span> {d.detail}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
