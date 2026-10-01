"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Cpu, Laptop, Zap } from "lucide-react";
import type { RigPick, RigSummary } from "@/lib/can-i-run";
import { COMFORT_LABEL } from "@/lib/schemas/results";
import { fmtUSD } from "@/lib/format";
import { cn } from "@/lib/utils";
import { COMFORT_STYLE } from "@/components/advisor/comfort";

export type RigCategory = "apple" | "nvidia" | "apu";

const CATEGORIES = [
  { id: "apple", label: "Apple Silicon", icon: Laptop },
  { id: "nvidia", label: "NVIDIA RTX GPUs", icon: Zap },
  { id: "apu", label: "Unified APUs & Laptops", icon: Cpu },
] as const;

/**
 * Popular machines with their best chat and agentic-coding picks. Every value
 * is computed by the engine on the server (see rigSummary); nothing here is
 * hand-written, so the cards always agree with the rest of the site.
 */
export function PopularRigsMatrix({ rigs }: { rigs: (RigSummary & { category: RigCategory })[] }) {
  const [tab, setTab] = useState<RigCategory>("apple");
  const filtered = rigs.filter((r) => r.category === tab);

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="no-scrollbar inline-flex max-w-full items-center gap-1.5 overflow-x-auto rounded-2xl border border-border/80 bg-muted/70 p-1.5 shadow-2xs">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = tab === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setTab(c.id)}
                className={cn(
                  "flex shrink-0 cursor-pointer select-none items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
                  active ? "bg-card font-semibold text-foreground shadow-xs ring-1 ring-border/50" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <Icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {filtered.map((rig) => (
          <div
            key={rig.id}
            className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-2xs transition-all duration-200 hover:border-primary/40 hover:shadow-md sm:p-6"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{rig.memory}</span>
                {rig.price && <span className="text-xs text-muted-foreground">≈{fmtUSD(rig.price)}</span>}
              </div>
              <h3 className="mt-3 text-lg font-bold leading-snug tracking-tight text-foreground">{rig.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {rig.usableForChat} of {rig.total} catalog models run acceptably or better for chat
              </p>

              <div className="mt-4 space-y-2">
                <Pick label="Best for chat" pick={rig.chat} />
                <Pick label="Best for agentic coding" pick={rig.agent} />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 border-t border-border/60 pt-4">
              <Link
                href={rig.href}
                className="flex items-center justify-between rounded-xl bg-muted/70 px-3.5 py-2 text-xs font-semibold text-foreground transition-all duration-150 hover:bg-primary hover:text-primary-foreground"
              >
                <span>Everything this machine can run</span>
                <ArrowRight className="size-3.5" />
              </Link>
              <Link href={rig.checkHref} className="px-1 text-xs font-medium text-primary hover:underline">
                Check it for my exact workload
              </Link>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Picks and speeds come from the same engine as the full check, assuming Open WebUI for chat and OpenCode on a medium repository for agentic coding.
      </p>
    </div>
  );
}

function Pick({ label, pick }: { label: string; pick?: RigPick }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {pick ? (
        <>
          <Link href={pick.href} className="mt-0.5 block text-sm font-bold text-foreground hover:underline">
            {pick.model} <span className="font-normal text-muted-foreground">· {pick.quant}</span>
          </Link>
          <p className={cn("mt-1 text-xs font-medium", COMFORT_STYLE[pick.level].text)}>
            {COMFORT_LABEL[pick.level]} · {pick.speed}
          </p>
        </>
      ) : (
        <p className="mt-0.5 text-sm text-muted-foreground">Nothing in our catalog is usable for this here.</p>
      )}
    </div>
  );
}
