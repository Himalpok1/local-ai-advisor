"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

export interface Bar {
  label: string;
  value: number;
  display: string;
  note?: string;
  className?: string;
}

/** Horizontal bars that grow one after another when scrolled into view. */
export function AnimatedBars({ title, bars, caption, className }: { title?: string; bars: Bar[]; caption?: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const max = Math.max(...bars.map((b) => b.value));
  return (
    <figure ref={ref} className={cn("rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-5", className)}>
      {title && <p className="mb-4 text-sm font-semibold">{title}</p>}
      <ul className="space-y-3.5">
        {bars.map((b, i) => (
          <li key={b.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">
                {b.label}
                {b.note && <span className="ml-1.5 text-xs font-normal text-muted-foreground">{b.note}</span>}
              </span>
              <span className="shrink-0 font-mono text-xs font-semibold tabular-nums">{b.display}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <motion.div
                className={cn("h-full rounded-full", b.className ?? "bg-primary")}
                initial={reduce ? false : { width: 0 }}
                animate={{ width: inView || reduce ? `${Math.max(2, (b.value / max) * 100)}%` : 0 }}
                transition={{ duration: 0.9, delay: reduce ? 0 : 0.1 + i * 0.15, ease: EASE }}
              />
            </div>
          </li>
        ))}
      </ul>
      {caption && <figcaption className="mt-4 text-xs leading-relaxed text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}

/** A router lighting up 2 of 16 experts for each new token. */
export function MoeAnimated() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const tokens = ["The", " cat", " sat", " on", " the", " mat"];
  const picks = [
    [2, 9],
    [5, 12],
    [0, 7],
    [3, 14],
    [2, 10],
    [6, 13],
  ];
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!inView || reduce) return;
    const id = setInterval(() => setT((x) => (x + 1) % tokens.length), 1100);
    return () => clearInterval(id);
  }, [inView, reduce, tokens.length]);
  const active = new Set(picks[t]);

  return (
    <figure ref={ref} className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center gap-1 text-sm">
        <span className="mr-1 text-xs font-medium text-muted-foreground">Writing:</span>
        {tokens.map((w, i) => (
          <span
            key={i}
            className={cn(
              "rounded-md px-1.5 py-0.5 font-mono transition-colors duration-300",
              i === t ? "bg-primary text-primary-foreground" : i < t ? "bg-muted text-foreground" : "text-muted-foreground/50",
            )}
          >
            {w.trim()}
          </span>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-8 gap-1.5" aria-label="2 of 16 experts active for each word">
        {Array.from({ length: 16 }, (_, i) => (
          <motion.div
            key={i}
            animate={{ scale: active.has(i) && !reduce ? 1.08 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className={cn(
              "grid aspect-square place-items-center rounded-lg border text-[10px] font-semibold transition-colors duration-300 sm:text-xs",
              active.has(i) ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30" : "border-border/70 bg-muted text-muted-foreground",
            )}
          >
            E{i + 1}
          </motion.div>
        ))}
      </div>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <p className="rounded-xl bg-muted px-3 py-2">
          <span className="font-semibold">Memory</span> holds all 16 experts.
        </p>
        <p className="rounded-xl bg-primary/10 px-3 py-2">
          <span className="font-semibold">Speed</span> depends on the 2 that work per word.
        </p>
      </div>
      <figcaption className="mt-3 text-xs text-muted-foreground">Simplified: real MoE models have many more experts, chosen again in every layer.</figcaption>
    </figure>
  );
}

const SENTENCE = ["Local", " models", " run", " on", " your", " own", " comp", "uter", ",", " even", " offline", "!"];
const CHIP_COLORS = ["bg-sky-500/15 text-sky-700 dark:text-sky-300", "bg-violet-500/15 text-violet-700 dark:text-violet-300", "bg-amber-500/15 text-amber-700 dark:text-amber-300", "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"];

/** Shows how a sentence is split into tokens, one chip at a time. */
export function TokenChips() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const reduce = useReducedMotion();
  const show = inView || reduce;
  return (
    <figure ref={ref} className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
      <p className="text-sm text-muted-foreground">What you type</p>
      <p className="mt-1 text-lg font-semibold">Local models run on your own computer, even offline!</p>
      <p className="mt-4 text-sm text-muted-foreground">What the model sees: {SENTENCE.length} tokens</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SENTENCE.map((tok, i) => (
          <motion.span
            key={i}
            initial={reduce ? false : { opacity: 0, scale: 0.6, y: 6 }}
            animate={show ? { opacity: 1, scale: 1, y: 0 } : {}}
            transition={{ delay: reduce ? 0 : 0.2 + i * 0.12, type: "spring", stiffness: 400, damping: 22 }}
            className={cn("rounded-lg px-2 py-1 font-mono text-sm font-medium", CHIP_COLORS[i % CHIP_COLORS.length])}
          >
            {tok.replace(/^ /, "·")}
          </motion.span>
        ))}
      </div>
      <figcaption className="mt-3 text-xs text-muted-foreground">
        “·” marks a space. Common words are one token; rarer ones (like “computer”) may be split. Illustrative, as every model splits text a little differently.
      </figcaption>
    </figure>
  );
}

/** A context window "filling up" as a conversation grows. */
export function ContextFill() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const reduce = useReducedMotion();
  const parts = [
    { label: "Instructions", k: 2, className: "bg-slate-400 dark:bg-slate-500" },
    { label: "Your messages", k: 3, className: "bg-primary" },
    { label: "Its replies", k: 5, className: "bg-sky-500" },
    { label: "A pasted file", k: 12, className: "bg-amber-500" },
  ];
  const capacity = 32;
  const show = inView || reduce;
  return (
    <figure ref={ref} className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold">A 32K-token context window</span>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{parts.reduce((a, p) => a + p.k, 0)}K used</span>
      </div>
      <div className="mt-2 flex h-10 overflow-hidden rounded-xl bg-muted">
        {parts.map((p, i) => (
          <motion.div
            key={p.label}
            className={cn("h-full border-r-2 border-card", p.className)}
            initial={reduce ? false : { width: 0 }}
            animate={{ width: show ? `${(p.k / capacity) * 100}%` : 0 }}
            transition={{ duration: 0.6, delay: reduce ? 0 : 0.2 + i * 0.5, ease: EASE }}
            title={`${p.label}: ${p.k}K tokens`}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-sm", p.className)} />
            {p.label} · {p.k}K
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-muted ring-1 ring-border" />
          Still free
        </li>
      </ul>
      <figcaption className="mt-3 text-xs text-muted-foreground">Everything in the conversation counts. When it is full, the oldest parts get dropped or the app refuses more.</figcaption>
    </figure>
  );
}
