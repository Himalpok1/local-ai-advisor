"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const ANSWER =
  "Sure! A quick way to save money on groceries is to plan your meals for the week before you shop. Write a list, check what you already have, and stick to it. Buying store brands and seasonal fruit and vegetables also helps a lot, and cooking a big batch on Sunday means fewer takeaway nights when you are tired.";

/** Roughly 4 characters per token for English text. */
const CHARS_PER_TOKEN = 4;

const SPEEDS = [
  { tps: 3, label: "3 tok/s", feel: "Painful", note: "Slower than you read. You'll go and make a coffee." },
  { tps: 10, label: "10 tok/s", feel: "Readable", note: "About reading speed. Fine for chat." },
  { tps: 30, label: "30 tok/s", feel: "Fast", note: "Faster than you read. Feels like ChatGPT." },
  { tps: 80, label: "80 tok/s", feel: "Instant", note: "What coding agents want: they read nothing, just wait." },
];

/**
 * Lets people *feel* what "tokens per second" means by streaming the same
 * answer at different speeds.
 */
export function SpeedFeel({ className, initial = 1 }: { className?: string; initial?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduce = useReducedMotion();
  const [speed, setSpeed] = useState(initial);
  const [shown, setShown] = useState(0);
  const [running, setRunning] = useState(false);
  const start = useRef(0);
  const raf = useRef(0);

  const run = useCallback((idx: number) => {
    cancelAnimationFrame(raf.current);
    setShown(0);
    setRunning(true);
    start.current = performance.now();
    const cps = SPEEDS[idx].tps * CHARS_PER_TOKEN;
    const tick = (now: number) => {
      const n = Math.min(ANSWER.length, Math.floor(((now - start.current) / 1000) * cps));
      setShown(n);
      if (n < ANSWER.length) raf.current = requestAnimationFrame(tick);
      else setRunning(false);
    };
    raf.current = requestAnimationFrame(tick);
  }, []);

  // Autoplay once when first scrolled into view (not with reduced motion).
  useEffect(() => {
    if (!inView || reduce) return;
    const id = requestAnimationFrame(() => run(initial));
    return () => cancelAnimationFrame(id);
  }, [inView, reduce, run, initial]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const s = SPEEDS[speed];
  const total = ANSWER.length / CHARS_PER_TOKEN / s.tps;
  const elapsed = (shown / ANSWER.length) * total;

  return (
    <div ref={ref} className={cn("overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-brutal", className)}>
      <div className="border-b-2 border-ink p-4 sm:p-5">
        <div role="radiogroup" aria-label="Generation speed" className="grid grid-cols-4 gap-1 rounded-2xl border-2 border-ink bg-muted p-1">
          {SPEEDS.map((x, i) => (
            <button
              key={x.tps}
              type="button"
              role="radio"
              aria-checked={speed === i}
              onClick={() => {
                setSpeed(i);
                run(i);
              }}
              className={cn(
                "flex min-h-11 cursor-pointer flex-col items-center justify-center rounded-xl border-2 px-1 py-1.5 text-center transition",
                speed === i ? "border-ink bg-primary text-on-fill" : "border-transparent text-muted-foreground hover:bg-card hover:text-foreground",
              )}
            >
              <span className="text-sm font-bold tabular-nums">{x.label}</span>
              <span className="text-[11px] font-bold">{x.feel}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md border-2 border-ink bg-primary px-3.5 py-2 text-sm font-medium text-on-fill">How can I save money on groceries?</div>
        <div className="min-h-[9.5rem] rounded-2xl rounded-bl-md border-2 border-ink bg-muted px-3.5 py-2.5 text-sm leading-relaxed sm:min-h-[7.5rem]" aria-live="off">
          {shown === 0 && !running ? <span className="text-muted-foreground">Press play to watch the answer appear.</span> : ANSWER.slice(0, shown)}
          {running && <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-blink bg-ink" aria-hidden />}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            <span className="rounded-full border-[1.5px] border-ink bg-primary px-2 py-0.5 text-xs font-extrabold text-on-fill">{s.feel}</span> <span className="text-muted-foreground">{s.note}</span>
          </p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {elapsed.toFixed(1)}s / {total.toFixed(1)}s
            </span>
            <button
              type="button"
              onClick={() => run(speed)}
              className="press inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border-2 border-ink bg-card px-4 text-sm font-bold shadow-brutal-sm"
            >
              {shown > 0 ? <RotateCcw className="size-4" /> : <Play className="size-4" />}
              {shown > 0 ? "Replay" : "Play"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
