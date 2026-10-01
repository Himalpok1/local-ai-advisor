import { ArrowDown, Bot, Cpu, HardDrive, Plug, Sparkles } from "lucide-react";
import type { StackLayer } from "@/lib/recommendations";
import { cn } from "@/lib/utils";

const ICON = { Hardware: HardDrive, Runtime: Cpu, Model: Sparkles, "Local API": Plug, "AI tool": Bot } as const;

/** Rendered top-down: tool → API → runtime → model → hardware (how a request flows). */
export function StackDiagram({ layers, order = "bottom-up", className }: { layers: StackLayer[]; order?: "top-down" | "bottom-up"; className?: string }) {
  const list = order === "bottom-up" ? layers : [...layers].reverse();
  return (
    <ol className={cn("flex flex-col items-stretch", className)}>
      {list.map((l, i) => {
        const Icon = ICON[l.layer];
        return (
          <li key={l.layer} className="flex flex-col items-center">
            <div className="flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-4.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{l.layer}</p>
                <p className="truncate font-medium">{l.name}</p>
                <p className="truncate text-xs text-muted-foreground">{l.detail}</p>
              </div>
            </div>
            {i < list.length - 1 && <ArrowDown className="my-1 size-4 text-muted-foreground" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
