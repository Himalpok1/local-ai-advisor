import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Recommendation } from "@/lib/schemas/results";
import { fmtGB, fmtTps } from "@/lib/format";
import { blocked } from "@/lib/can-i-run";
import { cn } from "@/lib/utils";

export function speedOf(rec: Recommendation): string {
  return !blocked(rec.level) && rec.performance ? fmtTps(rec.performance.perStreamGenerationTps, rec.performance.basis) : "—";
}

export function quantOf(rec: Recommendation): string {
  return rec.quant.formatNames[rec.format] ?? rec.quant.label;
}

export function headroomOf(rec: Recommendation): string {
  return rec.memory.fits ? fmtGB(Math.max(0, rec.memory.headroomGB)) : "—";
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5" aria-hidden />}
            {it.href ? (
              <Link href={it.href} className="hover:text-foreground hover:underline">
                {it.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Section({ title, intro, children, className }: { title: string; intro?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-4", className)}>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {intro && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{intro}</p>}
      </div>
      {children}
    </section>
  );
}

/** Structured data so search engines can show the answer directly. */
export function FaqJsonLd({ items }: { items: { q: string; a: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
