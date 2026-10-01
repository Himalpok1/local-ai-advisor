"use client";
import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { CloudOff, FileBox, Laptop, MessageSquare, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const NODES = [
  { icon: MessageSquare, title: "An app", what: "Where you type and read", eg: "LM Studio, Open WebUI, a coding agent" },
  { icon: Wrench, title: "A runtime", what: "The engine that runs the model", eg: "Ollama, llama.cpp, MLX" },
  { icon: FileBox, title: "A model", what: "The AI itself: one big file", eg: "Qwen, Gemma, Llama… 2–60 GB" },
];

/**
 * "How local AI works" in one picture: app → runtime → model, all inside your
 * computer. The highlight walks along the chain while the diagram is on screen.
 */
export function LocalAiDiagram({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-15% 0px" });
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const id = setInterval(() => setActive((a) => (a + 1) % (NODES.length + 1)), 1400);
    return () => clearInterval(id);
  }, [inView, reduce]);

  return (
    <figure ref={ref} className={cn("rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-6", className)}>
      <div className="relative rounded-2xl border-2 border-dashed border-primary/30 bg-primary/[0.03] p-4 pt-9 sm:p-6 sm:pt-10">
        <span className="absolute -top-3.5 left-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-card px-3 py-1 text-xs font-semibold text-primary">
          <Laptop className="size-3.5" /> Your computer
        </span>
        <ol className="flex flex-col items-stretch gap-0 md:flex-row md:items-center">
          {NODES.map((n, i) => {
            const Icon = n.icon;
            const on = reduce || active === i || active === NODES.length;
            return (
              <li key={n.title} className="flex flex-col items-stretch md:flex-1 md:flex-row md:items-center">
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border bg-card p-3 transition-all duration-500 md:flex-1 md:flex-col md:p-4 md:text-center",
                    on ? "border-primary/50 shadow-md shadow-primary/10" : "border-border/70 opacity-70",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-xl transition-colors duration-500",
                      on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">
                      {i + 1}. {n.title}
                    </span>
                    <span className="block text-sm text-foreground/80">{n.what}</span>
                    <span className="block text-xs text-muted-foreground">e.g. {n.eg}</span>
                  </span>
                </div>
                {i < NODES.length - 1 && (
                  <div className="flex justify-center py-1 md:px-1 md:py-0" aria-hidden>
                    <span className={cn("h-7 w-1 rounded-full md:h-1 md:w-8", reduce ? "bg-primary/50" : "flow-y md:flow-x")} />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
      <figcaption className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
        <CloudOff className="mt-0.5 size-4 shrink-0 text-comfortable" />
        <span>
          Your question goes from the app to the runtime, which runs the model and streams the answer back. <strong className="text-foreground">Nothing leaves your computer.</strong>
        </span>
      </figcaption>
    </figure>
  );
}
