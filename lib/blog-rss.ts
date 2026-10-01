import type { Post } from "@/lib/blog";

export const SITE_URL = "https://iownchatgpt.com";
export const RSS_LIMIT = 20;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** RSS 2.0 feed of the newest posts. `posts` must already be sorted newest first. */
export function buildBlogRss(posts: Post[]): string {
  const latest = posts.slice(0, RSS_LIMIT);
  const pubDate = (date: string) => new Date(`${date}T12:00:00Z`).toUTCString();
  const items = latest
    .map((p) => {
      const url = `${SITE_URL}/blog/${p.slug}`;
      return `<item>
<title>${esc(p.title)}</title>
<link>${url}</link>
<guid isPermaLink="true">${url}</guid>
<pubDate>${pubDate(p.date)}</pubDate>
<dc:creator>${esc(p.author)}</dc:creator>
${p.tags.map((t) => `<category>${esc(t)}</category>`).join("\n")}
<description>${esc(p.excerpt)}</description>
</item>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
<title>Blog · Local AI Advisor</title>
<link>${SITE_URL}/blog</link>
<atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
<description>Plain-language news and guides about local AI and running LLMs on your own computer.</description>
<language>en</language>
${latest.length ? `<lastBuildDate>${pubDate(latest[0].date)}</lastBuildDate>\n` : ""}${items}
</channel>
</rss>`;
}
