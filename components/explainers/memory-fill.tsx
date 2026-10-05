"use client";
import { useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface Part {
  label: string;
  gb: number;
  className: string;
}

interface Scenario {
  key: string;
  tab: string;
  parts: Part[];
  verdict: string;
  detail: string;
  ok: boolean;
}

const INSTALLED = 16;

const SCENARIOS: Scenario[] = [
  {
    key: "big",
    tab: "A model that’s too big",
    parts: [
      { label: "System", gb: 4, className: "bg-slate-400 dark:bg-slate-500" },
      { label: "Your apps", gb: 3, className: "bg-sky-400 dark:bg-sky-500" },
      { label: "Model", gb: 9.5, className: "bg-primary" },
      { label: "Chat memory", gb: 1.5, className: "bg-amber-400" },
    ],
    verdict: "It “fits”… but your computer crawls",
    detail: "The model squeezes out your apps. The computer starts swapping to disk and everything, including the AI, slows to a crawl.",
    ok: false,
  },
  {
    key: "right",
    tab: "The right-sized model",
    parts: [
      { label: "System", gb: 4, className: "bg-slate-400 dark:bg-slate-500" },
      { label: "Your apps", gb: 3, className: "bg-sky-400 dark:bg-sky-500" },
      { label: "Model", gb: 5.5, className: "bg-primary" },
      { label: "Chat memory", gb: 1, className: "bg-amber-400" },
    ],
    verdict: "Runs smoothly, with room to spare",
    detail: "Everything fits with a few GB left over, so the AI is fast and your other apps stay snappy.",
    ok: true,
  },
];

/**
 * A 16 GB memory bar that fills up piece by piece: the clearest way to show
 * why "it fits" is not the same as "it runs well".
 */
export function MemoryFill({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const s = SCENARIOS[idx];
  const used = s.parts.reduce((a, p) => a + p.gb, 0);
  const scale = Math.max(INSTALLED, used);
  const play = inView || reduce;

  return (
    <div ref={ref} className={cn("rounded-2xl border-2 border-ink bg-card p-4 shadow-brutal-sm sm:p-6", className)}>
      <div role="tablist" aria-label="Scenario" className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
        {SCENARIOS.map((x, i) => (
          <button
            key={x.key}
            role="tab"
            aria-selected={idx === i}
            type="button"
            onClick={() => setIdx(i)}
            className={cn(
              "min-h-11 cursor-pointer rounded-xl px-2 text-sm font-semibold transition",
              idx === i ? "bg-card text-foreground shadow-brutal-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {x.tab}
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-baseline justify-between text-sm">
        <span className="font-semibold">A laptop with {INSTALLED} GB of memory</span>
        <span className={cn("font-mono text-xs font-semibold tabular-nums", s.ok ? "text-comfortable" : "text-technical")}>
          {used} / {INSTALLED} GB
        </span>
      </div>

      <div className="relative mt-2">
        <div className="flex h-12 overflow-hidden rounded-xl bg-muted" key={s.key}>
          {s.parts.map((p, i) => (
            <motion.div
              key={p.label}
              className={cn("flex h-full items-center justify-center overflow-hidden whitespace-nowrap border-r-2 border-card text-[11px] font-semibold text-white last:border-r-0", p.className)}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: play ? `${(p.gb / scale) * 100}%` : 0 }}
              transition={{ duration: 0.6, delay: reduce ? 0 : 0.15 + i * 0.45, ease: [0.22, 1, 0.36, 1] }}
              title={`${p.label}: ${p.gb} GB`}
            >
              <span className="truncate px-1">{p.gb >= 2.5 ? p.label : ""}</span>
            </motion.div>
          ))}
        </div>
        {/* The physical limit of the machine. */}
        <div className="pointer-events-none absolute -bottom-2 -top-2 w-0.5 rounded bg-foreground" style={{ left: `${(INSTALLED / scale) * 100}%` }} aria-hidden />
        {!s.ok && (
          <motion.div
            key={`over-${s.key}`}
            className="pointer-events-none absolute inset-y-0 right-0 rounded-r-xl bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgb(0_0_0/0.25)_6px_12px)]"
            style={{ width: `${((used - INSTALLED) / scale) * 100}%` }}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: play ? 1 : 0 }}
            transition={{ delay: reduce ? 0 : 1.9 }}
            aria-hidden
          />
        )}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {s.parts.map((p) => (
          <li key={p.label} className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-sm", p.className)} />
            {p.label} · {p.gb} GB
          </li>
        ))}
      </ul>

      <motion.div
        key={`verdict-${s.key}`}
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: play ? 1 : 0, y: play ? 0 : 8 }}
        transition={{ delay: reduce ? 0 : 2, duration: 0.4 }}
        className={cn("mt-4 flex gap-3 rounded-2xl p-3.5", s.ok ? "bg-comfortable/10" : "bg-technical/10")}
      >
        {s.ok ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-comfortable" /> : <TriangleAlert className="mt-0.5 size-5 shrink-0 text-technical" />}
        <div>
          <p className="font-semibold">{s.verdict}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{s.detail}</p>
        </div>
      </motion.div>
    </div>
  );
}
