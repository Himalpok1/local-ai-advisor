import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Newspaper, Rss } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPostDate, getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog: local AI news and guides in plain language",
  description:
    "What’s new in AI and local LLMs, explained for beginners: new open models, apps, hardware and honest takes on what runs well on your own computer.",
  alternates: { canonical: "/blog", types: { "application/rss+xml": "/rss.xml" } },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  return (
    <div className="relative">
      <div className="glow-primary pointer-events-none absolute inset-x-0 top-0 h-96" aria-hidden />
      <div className="relative mx-auto max-w-4xl px-4 pb-6 pt-8 sm:px-6 sm:pt-14">
        <header className="flex animate-fade-up flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Newspaper className="size-3.5" /> Blog
            </p>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">Local AI, in plain language</h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
              The latest in AI and local LLMs, explained for beginners. Honest about what runs well on your own computer, and with sources for every claim.
            </p>
          </div>
          <Link
            href="/rss.xml"
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 self-start rounded-xl border border-border/80 bg-card px-3.5 text-sm font-medium transition hover:bg-muted sm:self-auto"
          >
            <Rss className="size-4 text-orange-500" aria-hidden /> RSS feed
          </Link>
        </header>

        {posts.length ? (
          <ol className="mt-10 space-y-4 sm:mt-14">
            {posts.map((p) => (
              <li key={p.slug}>
                <article className="group relative rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md sm:p-7">
                  <p className="text-sm text-muted-foreground">
                    <time dateTime={p.date}>{formatPostDate(p.date)}</time> · {p.readingMinutes} min read
                  </p>
                  <h2 className="mt-2 text-xl font-bold tracking-tight text-balance sm:text-2xl">
                    <Link href={`/blog/${p.slug}`} className="after:absolute after:inset-0 after:rounded-3xl group-hover:text-primary">
                      {p.title}
                    </Link>
                  </h2>
                  <p className="mt-2 leading-relaxed text-muted-foreground text-pretty">{p.excerpt}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {p.tags.map((t) => (
                      <Badge key={t}>{t}</Badge>
                    ))}
                    <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      Read <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-10 rounded-3xl border border-border/70 bg-card p-6 text-muted-foreground">
            The first posts are on their way. Meanwhile, <Link href="/learn" className="font-medium text-primary hover:underline">learn local AI step by step</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
