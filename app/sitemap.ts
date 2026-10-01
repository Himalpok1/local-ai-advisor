import type { MetadataRoute } from "next";

import { POPULAR_HF_REPOS } from "@/lib/hf/popular";

const PAGES = ["", "/check", "/hardware-for-model", "/stack", "/hugging-face", "/compare/models", "/compare/hardware", "/models", "/hardware", "/runtimes", "/tools", "/learn", "/methodology"];

export default function sitemap(): MetadataRoute.Sitemap {
  return [...PAGES, ...POPULAR_HF_REPOS.map((repo) => `/hf/${repo}`)].map((p) => ({ url: `https://iownchatgpt.com${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.7 }));
}
