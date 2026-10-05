"use client";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckCircle2, CircleHelp, RotateCcw, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuickCheckOption {
  text: string;
  correct?: boolean;
  /** Shown after picking this option. */
  why: string;
}

/** A single multiple-choice question to check understanding. Nothing is recorded. */
export function QuickCheck({ question, options }: { question: string; options: QuickCheckOption[] }) {
  const [picked, setPicked] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const answered = picked !== null;
  const right = answered && options[picked].correct;

  return (
    <section className="rounded-2xl border-2 border-ink bg-card p-4 shadow-brutal-sm sm:p-6" aria-labelledby="quick-check-title">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-link">
        <CircleHelp className="size-4" /> Quick check
      </p>
      <h2 id="quick-check-title" className="mt-1.5 text-lg font-bold leading-snug text-balance">
        {question}
      </h2>
      <ul className="mt-4 space-y-2">
        {options.map((o, i) => {
          const isPicked = picked === i;
          const showRight = answered && o.correct;
          const showWrong = isPicked && !o.correct;
          return (
            <li key={o.text}>
              <motion.button
                type="button"
                disabled={answered}
                onClick={() => setPicked(i)}
                animate={showWrong && !reduce ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.35 }}
                className={cn(
                  "flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors disabled:cursor-default",
                  !answered && "border-ink hover:border-ink hover:bg-primary/15 active:scale-[0.99]",
                  showRight && "border-ink bg-comfortable/10",
                  showWrong && "border-ink bg-technical/10",
                  answered && !showRight && !showWrong && "border-ink opacity-60",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border-2 text-xs font-bold",
                    showRight ? "border-ink bg-comfortable text-white" : showWrong ? "border-ink bg-technical text-white" : "border-ink",
                  )}
                >
                  {showRight ? <CheckCircle2 className="size-4" /> : showWrong ? <XCircle className="size-4" /> : String.fromCharCode(65 + i)}
                </span>
                {o.text}
              </motion.button>
            </li>
          );
        })}
      </ul>
      <AnimatePresence>
        {answered && (
          <motion.div
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={cn("mt-4 rounded-2xl p-4 text-sm leading-relaxed", right ? "bg-comfortable/10" : "bg-muted")} role="status">
              <p className="font-semibold">{right ? "Exactly right!" : "Not quite."}</p>
              <p className="mt-1 text-foreground/85">{options[picked].why}</p>
              {!right && (
                <p className="mt-2 text-foreground/85">
                  <span className="font-semibold">Answer:</span> {options.find((o) => o.correct)?.text}
                </p>
              )}
            </div>
            <button type="button" onClick={() => setPicked(null)} className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-link hover:underline">
              <RotateCcw className="size-3.5" /> Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
