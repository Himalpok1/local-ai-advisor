import { SITE_URL } from "@/lib/blog-rss";

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** Inline JSON-LD; `<` is escaped so content can never close the script tag. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export interface Crumb {
  href?: string;
  label: string;
}

/** BreadcrumbList for a visible trail; Home is prepended, the current page (no href) has no `item`. */
export function breadcrumbList(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ href: "/", label: "Home" }, ...items].map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.label,
      ...(it.href ? { item: new URL(it.href, SITE_URL).toString() } : {}),
    })),
  };
}

/** Site identity: who publishes iownchatgpt.com, and that its name is "Local AI Advisor". */
export function siteGraph({ models, computers }: { models: number; computers: number }) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: "Local AI Advisor",
        url: `${SITE_URL}/`,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/logo-mark-512.png`, width: 512, height: 512 },
        description: "Free tool that tells beginners which local AI models will run comfortably on their own computer, not just which ones technically fit.",
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: "Local AI Advisor",
        alternateName: "iownchatgpt.com",
        url: `${SITE_URL}/`,
        inLanguage: "en",
        publisher: { "@id": ORGANIZATION_ID },
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#app`,
        name: "Local AI Advisor",
        url: `${SITE_URL}/check`,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any (web browser)",
        browserRequirements: "Requires JavaScript",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: [
          `Rates ${models} open-weight AI models on ${computers} computers`,
          "Comfort rating for chat, coding and agentic workloads",
          "Estimated tokens per second and memory headroom",
          "Step-by-step setup for Ollama, llama.cpp and LM Studio",
        ],
        publisher: { "@id": ORGANIZATION_ID },
      },
    ],
  };
}
