import type { ContextPoint } from "@/lib/schemas/results";
import { fmtCtx, fmtGB, fmtSec } from "@/lib/format";
import { ComfortBadge } from "./comfort";
import { cn } from "@/lib/utils";

export function ContextTable({ points, current }: { points: ContextPoint[]; current: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Context</th>
            <th className="py-2 pr-4 font-medium">Rating for this workload</th>
            <th className="py-2 pr-4 text-right font-medium">Generation when full</th>
            <th className="py-2 pr-4 text-right font-medium">First prompt</th>
            <th className="py-2 text-right font-medium">Headroom</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.context} className={cn("border-b-2 last:border-0", p.context === current && "bg-accent/50")}>
              <td className="py-2 pr-4 font-medium">
                {fmtCtx(p.context)} {p.context === current && <span className="text-xs text-muted-foreground">(selected)</span>}
              </td>
              <td className="py-2 pr-4">{p.supported ? <ComfortBadge level={p.level} size="sm" /> : <span className="text-xs text-muted-foreground">Beyond model limit</span>}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{p.fits && p.supported ? `≈${Math.round(p.generationTps)} tok/s` : "—"}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{p.fits && p.supported ? fmtSec(p.coldPromptSec) : "—"}</td>
              <td className={cn("py-2 text-right tabular-nums", p.headroomGB < 1 && "text-technical")}>{p.fits ? fmtGB(p.headroomGB) : "doesn't fit"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
