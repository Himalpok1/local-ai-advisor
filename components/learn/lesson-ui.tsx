import { Lightbulb, Sparkles } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/**
 * One small step of a lesson: a numbered dot on a vertical rail, a heading,
 * and a few short paragraphs. Steps reveal as you scroll.
 */
export function Step({ n, id, title, children }: { n: number; id?: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <Reveal as="section" id={id} className="relative scroll-mt-24 pb-10 pl-11 last:pb-2 sm:pl-14">
      <span className="absolute left-[15px] top-9 bottom-0 w-0.5 bg-border sm:left-[19px]" aria-hidden />
      <span className="absolute left-0 top-0 grid size-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-md shadow-primary/25 sm:size-10 sm:text-base">
        {n}
      </span>
      <h2 className="pt-0.5 text-xl font-bold tracking-tight text-balance sm:pt-1.5 sm:text-2xl">{title}</h2>
      <div className="mt-3 space-y-4 text-[1.0625rem] leading-relaxed text-foreground/85">{children}</div>
    </Reveal>
  );
}

/** "Think of it like…" — an everyday comparison. */
export function Analogy({ children, title = "Think of it like this" }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
        <Lightbulb className="size-5" />
      </span>
      <div className="min-w-0 text-base leading-relaxed">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">{title}</p>
        <div className="mt-1 space-y-2">{children}</div>
      </div>
    </div>
  );
}

/** The one thing to remember from a lesson. */
export function KeyIdea({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Reveal className={cn("relative overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/20 sm:p-7", className)}>
      <span className="absolute -right-8 -top-8 size-32 rounded-full bg-white/10" aria-hidden />
      <span className="absolute -bottom-10 right-16 size-20 rounded-full bg-white/5" aria-hidden />
      <p className="relative flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
        <Sparkles className="size-4" /> Remember this
      </p>
      <div className="relative mt-2 text-lg font-semibold leading-snug text-balance sm:text-xl">{children}</div>
    </Reveal>
  );
}

/** A labelled pair of numbers or facts, for quick comparisons inside a step. */
export function FactGrid({ items }: { items: { label: string; value: React.ReactNode; note?: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((x) => (
        <div key={x.label} className="rounded-2xl border border-border/70 bg-card p-3">
          <dt className="text-xs font-medium text-muted-foreground">{x.label}</dt>
          <dd className="mt-0.5 text-lg font-bold tabular-nums">{x.value}</dd>
          {x.note && <dd className="text-xs text-muted-foreground">{x.note}</dd>}
        </div>
      ))}
    </dl>
  );
}

/** A collapsible "for the curious" box so beginners can skip the details. */
export function GoDeeper({ title = "Want the details?", children }: { title?: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl border border-border/70 bg-muted/40">
      <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-semibold">
        {title}
        <span className="grid size-6 place-items-center rounded-full bg-card text-muted-foreground transition-transform group-open:rotate-45" aria-hidden>
          +
        </span>
      </summary>
      <div className="space-y-3 border-t border-border/60 px-4 py-4 text-sm leading-relaxed text-foreground/85">{children}</div>
    </details>
  );
}
