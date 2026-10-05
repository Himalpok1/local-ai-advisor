import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MdxContent } from "@/components/blog/mdx-content";
import { JsonLd, ORGANIZATION_ID, breadcrumbList } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { formatPostDate, getAllPosts, getPost } from "@/lib/blog";
import { SITE_URL } from "@/lib/blog-rss";
import { OG_BASE } from "@/lib/og";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    authors: [{ name: post.author }],
    keywords: post.tags,
    alternates: { canonical: `/blog/${post.slug}`, types: { "application/rss+xml": "/rss.xml" } },
    openGraph: { type: "article", ...OG_BASE, title: post.title, description: post.excerpt, url: `/blog/${post.slug}`, publishedTime: post.date, authors: [post.author], tags: post.tags },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const all = getAllPosts();
  const i = all.findIndex((p) => p.slug === slug);
  const newer = all[i - 1];
  const older = all[i + 1];
  const url = `${SITE_URL}/blog/${post.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    // Ray is the site's AI writer, not a person, so the byline is credited as part of the site.
    author: { "@type": "Organization", name: post.author, url: `${SITE_URL}/blog` },
    publisher: { "@type": "Organization", "@id": ORGANIZATION_ID, name: "Local AI Advisor", url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/logo-mark-512.png` } },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    isPartOf: { "@type": "Blog", "@id": `${SITE_URL}/blog#blog`, name: "Local AI Advisor blog", url: `${SITE_URL}/blog` },
    inLanguage: "en",
    url,
    image: { "@type": "ImageObject", url: `${url}/opengraph-image`, width: 1200, height: 630 },
    keywords: post.tags.join(", "),
    wordCount: post.content.split(/\s+/).filter(Boolean).length,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-6 sm:px-6 sm:pt-10">
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbList([{ href: "/blog", label: "Blog" }, { label: post.title }])} />
      <article>
        <header className="animate-fade-up">
          <Link href="/blog" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> All posts
          </Link>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{post.title}</h1>
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground text-pretty">{post.excerpt}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-b-2 border-ink pb-6 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">By {post.author}</span>
            <span aria-hidden>·</span>
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
            <span aria-hidden>·</span>
            <span>{post.readingMinutes} min read</span>
            <span className="flex w-full flex-wrap gap-1.5 sm:ml-auto sm:w-auto">
              {post.tags.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </span>
          </div>
        </header>

        <div className="blog-prose mt-8">
          <MdxContent source={post.content} />
        </div>
      </article>

      {(newer || older) && (
        <nav aria-label="More posts" className="mt-12 grid gap-3 sm:grid-cols-2">
          {older ? (
            <Link href={`/blog/${older.slug}`} className="press group rounded-2xl border-2 border-ink bg-card p-4 shadow-brutal-sm">
              <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <ArrowLeft className="size-3.5" /> Older
              </span>
              <span className="mt-1 block font-semibold group-hover:text-link">{older.title}</span>
            </Link>
          ) : (
            <span className="hidden sm:block" />
          )}
          {newer && (
            <Link href={`/blog/${newer.slug}`} className="press group rounded-2xl border-2 border-ink bg-card p-4 text-right shadow-brutal-sm">
              <span className="flex items-center justify-end gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Newer <ArrowRight className="size-3.5" />
              </span>
              <span className="mt-1 block font-semibold group-hover:text-link">{newer.title}</span>
            </Link>
          )}
        </nav>
      )}

      <aside className="mt-10 rounded-2xl border-2 border-ink bg-primary/30 p-5 shadow-brutal sm:p-6">
        <p className="text-lg font-bold tracking-tight">Will it run on your computer?</p>
        <p className="mt-1 text-sm text-muted-foreground">Answer a few questions and see which local AI models will feel comfortable on your hardware.</p>
        <Link
          href="/check"
          className="mt-4 inline-flex min-h-11 items-center gap-2 bg-primary px-5 text-primary-foreground rounded-full border-2 border-ink font-bold shadow-brutal press"
        >
          Check my computer <ArrowRight className="size-4" />
        </Link>
      </aside>
    </div>
  );
}
