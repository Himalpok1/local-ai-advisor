import { HARDWARE, MODELS } from "@/data";
import { LESSONS } from "@/components/learn/lessons";
import { TOOL_GROUPS } from "@/components/site/nav";
import { getAllPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/blog-rss";

// llms.txt (llmstxt.org): a plain-Markdown map of the site for AI agents. Built from the same data as the pages.
export function buildLlmsTxt(): string {
  const tools = [...new Map(TOOL_GROUPS.flatMap((g) => g.items).map((t) => [t.href, t])).values()];
  const posts = getAllPosts().slice(0, 10);
  const line = (href: string, label: string, note?: string) => `- [${label}](${SITE_URL}${href})${note ? `: ${note}` : ""}`;
  return [
    "# Local AI Advisor",
    "",
    `> Free, beginner-friendly advisor that tells you which open-weight AI models will run comfortably on your own computer (Mac, PC, GPU or AI mini PC) for chat, coding and agent workloads, not just which ones technically fit. It rates ${MODELS.length} models on ${HARDWARE.length} computers.`,
    "",
    `Speeds and memory figures are estimates from a documented model, calibrated on public benchmarks. Read the [methodology](${SITE_URL}/methodology) before quoting numbers.`,
    "",
    "## Tools",
    ...tools.map((t) => line(t.href, t.label, t.description)),
    line("/can-i-run", "Answer pages", "one page per model and computer at /can-i-run/<model>/<computer>, and per computer at /what-runs-on/<computer>"),
    "",
    "## Learn",
    ...LESSONS.map((l) => line(`/learn/${l.slug}`, l.title, l.summary)),
    "",
    "## Blog",
    ...posts.map((p) => line(`/blog/${p.slug}`, p.title, p.excerpt)),
    "",
    "## Optional",
    line("/blog", "All blog posts"),
    line("/rss.xml", "Blog RSS feed"),
    line("/new-models/feed.xml", "New models RSS feed"),
    line("/sitemap.xml", "Sitemap"),
    "",
  ].join("\n");
}
