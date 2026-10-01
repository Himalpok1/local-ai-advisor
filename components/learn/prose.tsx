import { Lightbulb, Link2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/** A top-level group heading ("Memory", "Speed"…). */
export function GroupHeading({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <header id={id} className="scroll-mt-20 border-t pt-12">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {children && <p className="mt-2 max-w-prose text-muted-foreground">{children}</p>}
    </header>
  );
}

/** One explained term with an anchor link. */
export function Section({
  id,
  title,
  summary,
  children,
  className,
}: {
  id: string;
  title: React.ReactNode;
  /** One-sentence plain-language definition. */
  summary: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("scroll-mt-20", className)}>
      <h3 id={`${id}-title`} className="group flex items-center gap-2 text-xl font-semibold tracking-tight">
        {title}
        <a href={`#${id}`} className="text-muted-foreground opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100" aria-label="Link to this section">
          <Link2 className="size-4" />
        </a>
      </h3>
      <p className="mt-2 text-lg leading-relaxed">{summary}</p>
      <div className="mt-3 space-y-3 leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

/** A short, concrete example. */
export function Example({ children, title = "Example" }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="rounded-lg border-l-4 border-primary/50 bg-muted/60 px-4 py-3 text-sm leading-relaxed">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
        <Lightbulb className="size-3.5" />
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

/** "What this means for you" line. */
export function Takeaway({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2 text-sm text-muted-foreground">
      <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
      <span>{children}</span>
    </p>
  );
}

/** Visually prominent "key concept" block. */
export function KeyConcept({
  id,
  index,
  title,
  lead,
  children,
}: {
  id: string;
  index: number;
  title: React.ReactNode;
  lead: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-20 overflow-hidden rounded-2xl border border-primary/30 bg-linear-to-b from-accent/70 to-card shadow-sm"
    >
      <div className="p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Key concept {index}</p>
        <h2 id={`${id}-title`} className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 max-w-prose text-lg leading-relaxed text-foreground/90">{lead}</p>
        <div className="mt-5 space-y-5 leading-relaxed">{children}</div>
      </div>
    </section>
  );
}

/** Small caption under a figure. */
export function FigureCaption({ children }: { children: React.ReactNode }) {
  return <figcaption className="mt-2 text-xs text-muted-foreground">{children}</figcaption>;
}

/** Inline code / file-name style. */
export function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>;
}
