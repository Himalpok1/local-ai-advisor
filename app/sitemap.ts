import type { MetadataRoute } from "next";

import { HARDWARE, MODELS } from "@/data";
import { LESSONS } from "@/components/learn/lessons";
import { getAllPosts } from "@/lib/blog";
import { POPULAR_HF_REPOS } from "@/lib/hf/popular";
import { hardwareSlug } from "@/lib/slugs";

const SITE = "https://iownchatgpt.com";
const PAGES = ["", "/check", "/can-i-run", "/new-models", "/speed-test", "/community", "/hardware-for-model", "/stack", "/hugging-face", "/compare/models", "/compare/hardware", "/models", "/hardware", "/runtimes", "/tools", "/learn", "/methodology", "/blog", "/about", "/contact", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const models = MODELS.filter((m) => !m.referenceOnly);
  const entry = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({ url: `${SITE}${path}`, changeFrequency: "weekly", priority });
  return [
    ...PAGES.map((p) => entry(p, p === "" ? 1 : 0.8)),
    ...LESSONS.map((l) => entry(`/learn/${l.slug}`, 0.7)),
    ...getAllPosts().map((p) => ({ ...entry(`/blog/${p.slug}`, 0.7), lastModified: p.date })),
    ...POPULAR_HF_REPOS.map((repo) => entry(`/hf/${repo}`, 0.6)),
    ...models.map((m) => entry(`/can-i-run/${m.id}`, 0.7)),
    ...HARDWARE.map((h) => entry(`/what-runs-on/${hardwareSlug(h)}`, 0.7)),
    // Every model × machine answer page (~4.5K); most render on first visit and are then cached.
    ...models.flatMap((m) => HARDWARE.map((h) => entry(`/can-i-run/${m.id}/${hardwareSlug(h)}`, 0.5))),
  ];
}
