import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Content Signals (contentsignals.org): search indexing, AI answers and AI training are all allowed.
      other: { "Content-Signal": "search=yes, ai-input=yes, ai-train=yes" },
    },
    sitemap: "https://iownchatgpt.com/sitemap.xml",
  };
}
