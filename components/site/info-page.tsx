import { formatPostDate } from "@/lib/blog";
import { JsonLd, breadcrumbList } from "@/components/seo/json-ld";

/** Shared shell for About, Privacy, Terms and Contact: same typography as blog articles. */
export function InfoPage({ title, intro, updated, children }: { title: string; intro: string; updated?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-8 sm:px-6 sm:pt-12">
      <JsonLd data={breadcrumbList([{ label: title }])} />
      <header className="animate-fade-up border-b border-border/70 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground text-pretty">{intro}</p>
        {updated && (
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated <time dateTime={updated}>{formatPostDate(updated)}</time>
          </p>
        )}
      </header>
      <div className="blog-prose mt-8">{children}</div>
    </div>
  );
}
