import type { MetadataRoute } from "next";

const PAGES = ["", "/check", "/hardware-for-model", "/stack", "/compare/models", "/compare/hardware", "/models", "/hardware", "/runtimes", "/tools", "/learn", "/methodology"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({ url: `https://iownchatgpt.com${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.7 }));
}
