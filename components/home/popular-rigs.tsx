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
  { id: "apple", label: "Macs", icon: Laptop },
  { id: "nvidia", label: "NVIDIA PCs", icon: Zap },
  { id: "apu", label: "AI PCs", icon: Cpu },
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
        <div className="no-scrollbar inline-flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full border-2 border-ink bg-card p-1.5 shadow-brutal-sm">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = tab === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setTab(c.id)}
                className={cn(
                  "flex shrink-0 cursor-pointer select-none items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold transition",
                  active ? "border-ink bg-primary text-on-fill" : "border-transparent text-foreground hover:bg-muted",
                )}
              >
                <Icon className="size-4" />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0">
        {filtered.map((rig) => (
          <div
            key={rig.id}
            className="flex w-[85%] shrink-0 snap-center flex-col justify-between rounded-2xl border-2 border-ink bg-card p-5 shadow-brutal sm:w-80 sm:p-6 md:w-auto"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex items-center rounded-full border-2 border-ink bg-primary px-2.5 py-0.5 text-xs font-bold text-on-fill">{rig.memory}</span>
                {rig.price && <span className="text-xs text-muted-foreground">≈{fmtUSD(rig.price)}</span>}
              </div>
              <h3 className="mt-3 text-lg font-bold leading-snug tracking-tight text-foreground">{rig.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Runs <strong className="text-foreground">{rig.usableForChat}</strong> of {rig.total} models well enough for chat
              </p>

              <div className="mt-4 space-y-2">
                <Pick label="Best for chat" pick={rig.chat} />
                <Pick label="Best for coding agents" pick={rig.agent} />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 border-t-2 border-ink pt-4">
              <Link
                href={rig.href}
                className="flex min-h-11 items-center justify-between rounded-xl border-2 border-ink bg-card px-3.5 py-2 text-sm font-bold text-foreground transition-colors hover:bg-primary hover:text-on-fill"
              >
                <span>Everything it can run</span>
                <ArrowRight className="size-3.5" />
              </Link>
              <Link href={rig.checkHref} className="inline-flex min-h-10 items-center px-1 text-sm font-semibold text-link underline decoration-primary decoration-2 underline-offset-4 hover:bg-primary hover:text-on-fill">
                Check it for what I want to do
              </Link>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        <span className="md:hidden">Swipe for more. </span>Picks assume a chat app (Open WebUI) and a coding agent (OpenCode) on a medium-sized project.
      </p>
    </div>
  );
}

function Pick({ label, pick }: { label: string; pick?: RigPick }) {
  return (
    <div className="rounded-xl border-2 border-ink bg-muted p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {pick ? (
        <>
          <Link href={pick.href} className="mt-0.5 block text-sm font-bold text-foreground hover:underline">
            {pick.model} <span className="font-normal text-muted-foreground">· {pick.quant}</span>
          </Link>
          <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-foreground/80">
            <span className={cn("rounded-full border-[1.5px] border-ink px-2 py-0.5 font-bold", COMFORT_STYLE[pick.level].chip)}>{COMFORT_LABEL[pick.level]}</span>
            {pick.speed}
          </p>
        </>
      ) : (
        <p className="mt-0.5 text-sm text-muted-foreground">Nothing in our catalog is usable for this here.</p>
      )}
    </div>
  );
}
