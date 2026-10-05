"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Lock, WifiOff, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const QUESTION = "Explain what a GPU does, like I’m 10.";
const ANSWER =
  "Imagine your computer’s brain is one very clever teacher who solves problems one at a time. A GPU is like a whole classroom of students doing thousands of small sums at once. AI needs lots of small sums, so the classroom wins!";

/**
 * Hero illustration: a tiny chat window answering a question with a model that
 * runs on the laptop itself. Replays while on screen; static with reduced motion.
 */
export function HeroChat({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<"ask" | "think" | "stream" | "done">("ask");

  useEffect(() => {
    if (!inView || reduce) return;
    let raf = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const cycle = () => {
      setShown(0);
      setPhase("ask");
      timers.push(setTimeout(() => setPhase("think"), 900));
      timers.push(
        setTimeout(() => {
          setPhase("stream");
          const t0 = performance.now();
          const tick = (now: number) => {
            const n = Math.min(ANSWER.length, Math.floor(((now - t0) / 1000) * 110));
            setShown(n);
            if (n < ANSWER.length) raf = requestAnimationFrame(tick);
            else {
              setPhase("done");
              timers.push(setTimeout(cycle, 4000));
            }
          };
          raf = requestAnimationFrame(tick);
        }, 1700),
      );
    };
    cycle();
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [inView, reduce]);

  const text = reduce ? ANSWER : ANSWER.slice(0, shown);
  const showAnswer = reduce || phase === "stream" || phase === "done";

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-brutal-xl">
        {/* Window chrome */}
        <div className="flex items-center gap-3 border-b-2 border-ink bg-muted/50 px-4 py-3">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-rose-400" />
            <span className="size-2.5 rounded-full bg-amber-400" />
            <span className="size-2.5 rounded-full bg-emerald-400" />
          </span>
          <span className="min-w-0 truncate text-xs font-semibold text-muted-foreground">Qwen 3.5 9B · on this laptop</span>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-comfortable/12 px-2 py-0.5 text-[11px] font-semibold text-comfortable">
            <WifiOff className="size-3" /> Offline
          </span>
        </div>

        <div className="space-y-3 p-4 sm:p-5" aria-label={`Example chat. Question: ${QUESTION} Answer: ${ANSWER}`} role="img">
          <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-primary-foreground">{QUESTION}</div>
          <div className="min-h-[8.5rem] max-w-[92%] rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5 text-sm leading-relaxed">
            {showAnswer ? (
              <>
                {text}
                {phase === "stream" && <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-blink bg-primary" aria-hidden />}
              </>
            ) : phase === "think" ? (
              <span className="flex gap-1 py-1.5" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="size-2 rounded-full bg-muted-foreground/60"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
                  />
                ))}
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-ink border-t-2 border-ink text-center">
          <Stat icon={<Zap className="size-3.5" />} value="28 tok/s" label="Speed" />
          <Stat icon={<Lock className="size-3.5" />} value="0 bytes" label="Sent online" />
          <Stat icon={<span className="text-xs font-bold">$</span>} value="$0" label="Per month" />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="px-2 py-3">
      <p className="flex items-center justify-center gap-1 text-sm font-bold tabular-nums">
        <span className="text-link">{icon}</span>
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
