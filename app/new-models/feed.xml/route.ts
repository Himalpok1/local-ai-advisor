import { newOpenModels } from "@/lib/hf/new-models";
import { OPENNESS_LABEL } from "@/lib/hf/licenses";
import { COMFORT_LABEL } from "@/lib/schemas/results";

export const dynamic = "force-static";
export const revalidate = 21600;

const SITE = "https://iownchatgpt.com";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const items = await newOpenModels();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>New open models · Local AI Advisor</title>
<link>${SITE}/new-models</link>
<atom:link href="${SITE}/new-models/feed.xml" rel="self" type="application/rss+xml"/>
<description>New open-weight LLM releases, rated for everyday hardware.</description>
<language>en</language>
${items
  .map((m) => {
    const ratings = m.ratings?.map((r) => `${r.label}: ${COMFORT_LABEL[r.level]}`).join(" · ");
    const desc = [
      `${m.repo}${m.paramsB ? `, ${m.paramsB}B parameters` : ""}${m.pipeline === "image-text-to-text" ? ", vision" : ""}.`,
      m.license ? `License: ${m.license}${m.openness !== "unknown" ? ` (${OPENNESS_LABEL[m.openness]})` : ""}.` : "",
      ratings ? `Chat rating: ${ratings}.` : m.unrated ? `Not rated: ${m.unrated}` : "Rating pending.",
    ]
      .filter(Boolean)
      .join(" ");
    return `<item>
<title>${esc(m.repo)}</title>
<link>${SITE}/hugging-face?repo=${encodeURIComponent(m.repo)}</link>
<guid isPermaLink="false">hf:${esc(m.repo)}</guid>
<pubDate>${new Date(m.createdAt).toUTCString()}</pubDate>
<description>${esc(desc)}</description>
</item>`;
  })
  .join("\n")}
</channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
