# GEO / AI Search Readiness Findings: iownchatgpt.com (Local AI Advisor)

Agent: seo-geo. Audit date: 2026-10-01.
Framing: Google's AI optimization guide says optimizing for AI search "is still SEO". AI Overviews and AI Mode use the Googlebot index and core quality systems. The findings below are SEO fundamentals applied to AI surfaces. Scores are claude-seo heuristics. No DataForSEO, SE Ranking or Profound data was available, so **platform citation rates were not measured**.

## AI Search Readiness (GEO) Score: **58 / 100**

| Dimension | Weight | Score | Notes |
|---|---|---|---|
| Citability | 25% | 72 | Answer-first "Short answer" blocks with specific numbers (tok/s, GB, quant); FAQ JSON-LD restates the answer. Penalized for contradictory verdicts (8 GB "nothing fits") and "too slow" mislabels. |
| Structural readability | 20% | 70 | Question H1s, clean H1→H2, data tables, short paragraphs. Hubs lack summary sentences by RAM tier. |
| Multi-modal | 15% | 45 | Interactive tools and animated explainers exist, but the only `<img>` on sampled pages is the logo. No charts as images, no video, no image schema. |
| Authority & brand | 20% | 25 | No About/author entity; domain still indexed under a previous identity; brand name collides with other tools; no Organization `sameAs`; no visible dates. |
| Technical accessibility | 20% | 80 | SSR (content in raw HTML), robots allows all, AI user-agents get 200. llms.txt is missing (0 weight). Burst 403s from the Hostinger CDN were observed. |

Platform readiness is qualitative only, because it was not measured with a tool:
- **Google AIO / AI Mode:** Moderate. Indexable SSR answers exist, but authority and freshness are weak.
- **ChatGPT Search:** Moderate. OAI-SearchBot can fetch pages, but there is no entity presence on Wikipedia or Reddit.
- **Perplexity:** Moderate-to-weak. PerplexityBot can fetch pages, but there is no community (Reddit) footprint.
- **Bing Copilot:** Unknown. Bing indexation was not checked, and IndexNow is not detected.

---

## AI crawler access (each bot reported against the capability it governs)

robots.txt (verbatim): `User-Agent: * / Allow: / / Sitemap: https://iownchatgpt.com/sitemap.xml` (no bot-specific rules). Source: `app/robots.ts`.
Live fetch of `/can-i-run/llama-3.1-8b/macbook-air-m1-16gb` with each user-agent string, 3 s apart (UA spoof from one IP; it does not prove how the CDN treats real bot IP ranges):

| User-agent | Governs | robots.txt | Live HTTP |
|---|---|---|---|
| Googlebot | Google Search + AI Overviews/AI Mode | Allowed | 200 |
| bingbot | Bing index / Copilot | Allowed | 200 |
| OAI-SearchBot | ChatGPT Search citability | Allowed | 200 |
| ChatGPT-User | ChatGPT user-triggered fetch | Allowed | 200 |
| GPTBot | OpenAI training only | Allowed | 200 |
| Claude-SearchBot | Claude search citability | Allowed | 200 |
| ClaudeBot | Anthropic training only | Allowed | 200 |
| PerplexityBot | Perplexity search | Allowed | 200 |
| CCBot | Common Crawl training | Allowed | 200 |
| Google-Extended | Gemini/Vertex training and grounding (not Search) | Allowed (no rule) | n/a (token only) |
| Applebot-Extended | Apple Intelligence training (not Siri/Spotlight) | Allowed (no rule) | n/a |

All search-citability crawlers are allowed. Training crawlers are also allowed, which is a licensing choice and has no effect on search visibility.

## llms.txt status: **Missing**
`/llms.txt` and `/llms-full.txt` return **404**, served as the HTML 404 page. Google says llms.txt does not help or hurt Search, and claude-seo gives it no weight. It is optional and might be used by non-Google tools. RSL licensing: not detected.

---

## Findings

### G-1. The domain is still indexed and described as a different site ("I own CHAT GPT" games/blog) (High)
- **Evidence:** A web search for `"iownchatgpt.com" OR "iownchatgpt"` returns `iownchatgpt.com/games/viralimpostertiktokgame` ("Play Imposter Viral TikTok Game") and `iownchatgpt.com/privacy-policy/` ("Privacy Policy - I own CHAT GPT"). The search tool's summary describes the site as "free browser games and trending blog coverage across AI, tech, crypto". Live: `/games/viralimpostertiktokgame` → **404**; `/games` → 404; `/privacy-policy/` → 308 → `/privacy-policy` → **404**.
- **Why it matters for GEO:** AI systems ground entity descriptions in what is indexed. Until the old URLs drop out and the new entity is clearly stated, answer engines may describe the brand wrongly or not connect "iownchatgpt.com" with "Local AI Advisor".
- **Recommendation:**
  - 301 the legacy URLs to the closest new pages (privacy-policy → a new `/privacy`; games → `/`), or return 410 for content that is truly gone.
  - Request removal or recrawl in Search Console and Bing Webmaster.
  - Publish `/about` stating "Local AI Advisor (iownchatgpt.com) is…" with a date.
- **Source:** `next.config.mjs` (redirects); new `app/privacy`, `app/about`.

### G-2. No Organization/WebSite entity markup, and the brand name collides with other tools (High)
- **Evidence:** The homepage has **0 JSON-LD blocks** (`render-home.json → structured_data.block_count: 0`). No sampled page has Organization or WebSite schema. Only `BlogPosting` (blog) and `FAQPage` (pair, hub and what-runs-on pages) exist. The blog's `publisher` is an Organization with only `name`, `url` and `logo`, and no `sameAs`. A search for "Local AI Advisor" local LLM hardware returns `localllm-advisor.com` ("LocalLLM Advisor"), GitHub `localllm-advisor`, `keplerTR/LocalAI-Advisor`, `doorukb/local-llm-advisor` and `blackstart-labs/local-llm-advisor`. **iownchatgpt.com does not appear.**
- **Recommendation:**
  - Add sitewide `Organization` and `WebSite` JSON-LD in the root layout (name "Local AI Advisor", alternateName "iownchatgpt", url, logo, `sameAs` → GitHub/X/Reddit/YouTube profiles once they exist), plus a founder `Person` (Himal) with a profile link.
  - Use the full "Local AI Advisor (iownchatgpt.com)" consistently in on-site copy and social profiles to separate it from the similarly named tools.
- **Source:** `app/layout.tsx`.

### G-3. Programmatic answers are citable, but some are wrong or contradict each other (High)
- **Evidence:**
  - Each `/can-i-run/<m>/<hw>` page opens with a self-contained answer that AI systems can lift, e.g. *"Yes, excellent for chat; borderline for coding in a repository. Best quantization for chat: 3-bit (3.4 GB of weights) on LM Studio. Generation: 19–25 tok/s…"*. FAQPage JSON-LD repeats it.
  - Some of these answers are the most damaging thing to have quoted:
    - "0 open models run well for chat on the MacBook Air M1 8 GB" (it says Llama 3.2 3B "Needs ≈5.0 GB but only ≈0.0 GB is available").
    - The 3-bit "best quant" on a 32 GB machine, which contradicts the site's own `/learn/quantization`.
    - "too slow for coding" at 70–230 tok/s.
  - Details are in content.md C-3/C-4.
- **Recommendation:** Fix the engine reserve and label mapping before scaling citability work. Citable wrong answers spread.
- **Source:** `lib/can-i-run.ts`.

### G-4. No dates anywhere except the blog, and no lastmod in the sitemap (Medium)
- **Evidence:** No visible "updated" or "as of" text on /methodology, /models, /new-models, any /can-i-run page, /what-runs-on or /learn. FAQPage JSON-LD has no `dateModified`. The sitemap has `<lastmod>` on 1 of 4,720 URLs (the blog post). The topic changes monthly (the catalog includes 2026 hardware such as M5 Ultra and M6). `data/hardware.ts` already stores `lastVerified: "2026-09-30"`.
- **Recommendation:** Show "Ratings updated 30 Sep 2026" on every data page, and add `dateModified` to JSON-LD and `lastModified` to `app/sitemap.ts`, using the data's real `lastVerified` and not build time.

### G-5. AI-authored blog with an AI listed as `Person` author (Medium)
- **Evidence:** `/blog/welcome-to-the-local-ai-advisor-blog` JSON-LD: `"author":{"@type":"Person","name":"Ray, Himal's AI assistant"}`. The body says "Posts are researched and drafted by Ray, an AI assistant". The disclosure is good, but the entity graph has no real human author with credentials, which weakens authority signals for AI citation.
- **Recommendation:** Make a human (Himal) the `author` or `editor` `Person` with a `url` to a bio page, note the AI assistance in the text, and do not model the AI as a `Person`.
- **Source:** `app/blog/[slug]/page.tsx`, `lib/blog.ts`.

### G-6. Hubs lack self-contained summary passages for "by RAM" questions (Medium)
- **Evidence:** `/can-i-run/llama-3.1-8b` gives one aggregate sentence ("108 of 125 machines…"), then a 125-row table. No passage answers "Can I run Llama 3.1 8B on 16 GB?" directly. `/what-runs-on/macbook-air-m2-16gb` opens with "Best for agentic coding — Nothing in our catalog is usable for this." before the chat picks.
- **Recommendation:** Add 2–4 sentence, self-contained answers by memory tier near the top of model hubs. Lead device pages with the top chat pick and speed. Question-form H2s ("Can a 16 GB Mac run Llama 3.1 8B?") match how people ask.
- **Source:** `app/can-i-run/[model]/page.tsx`, `app/what-runs-on/[hardware]/page.tsx`.

### G-7. CDN returned 403 under concurrent crawling (Medium, observed; cause not confirmed)
- **Evidence:** During this audit, a parallel fetcher in the same workspace received `HTTP/2 403`, `server: hcdn` (Hostinger CDN), `cache-control: private, no-store` on about 20 consecutive requests at 18:43 UTC (`(audit workspace)/pages/*.h`). Sequential requests with 2 s spacing a minute later returned 200.
- **Why it matters:** AI and search crawlers often fetch in bursts. If the CDN's rate or bot protection returns 403 to them, those pages cannot be cited.
- **Recommendation:** Check Hostinger CDN/WAF bot-protection and rate-limit settings. Allowlist verified Googlebot, bingbot, OAI-SearchBot, Claude-SearchBot and PerplexityBot. Watch Search Console crawl stats for 403s.

### G-8. Almost no non-text media on answer pages (Low)
- **Evidence:** The only `<img>` elements on sampled pages (home, pair, lesson, blog) are the 3 logo SVGs. Speed comparisons are interactive JS widgets, not images or charts with alt text. The blog has an OG image.
- **Recommendation:** Add a static chart image per model hub (tok/s by machine) with descriptive alt text and an `ImageObject`. Consider short screen-capture videos for "/learn/first-model". YouTube presence correlates strongly with AI citation in third-party studies.

### G-9. llms.txt missing (Info)
- Optional, with no Google effect. If wanted for non-Google tools, a short `/llms.txt` could list /methodology, /learn/*, /can-i-run hubs and /models, with a one-line description of the engine.

---

## Brand mention analysis (WebSearch only; not exhaustive)
| Platform | Presence found |
|---|---|
| Wikipedia / Wikidata | None found |
| Reddit | None found in searches run |
| YouTube | None found |
| LinkedIn / GitHub org | None found for this brand (other similarly named GitHub repos exist) |
| Web mentions | Only legacy "I own CHAT GPT" pages surfaced for the domain |

## Top 5 highest-impact changes
1. **Fix wrong or contradictory engine verdicts** (8 GB reserve, 3-bit picks, "too slow" label) so citable answers are correct. Effort: Medium. (G-3)
2. **Clean up the legacy identity**: 301 or 410 the old games/privacy URLs, publish About/Privacy/Contact. Effort: Low. (G-1)
3. **Add Organization + WebSite + founder Person JSON-LD with `sameAs`**, and seed real profiles (GitHub, Reddit, YouTube). Effort: Low → Medium. (G-2)
4. **Add visible "updated" dates, `dateModified` and sitemap `lastmod`** from `lastVerified`. Effort: Low. (G-4)
5. **Add RAM-tier answer passages on hubs** and new RAM-tier pages. Effort: Medium. (G-6, sxo.md SXO-1)

## What works
- **Full SSR:** all main content, including the per-pair tables and commands, is in the raw HTML (`render_page --mode never` returned full text and `is_spa=false`), so crawlers that don't run JS get everything.
- **All AI search crawlers allowed** in robots.txt and served with HTTP 200.
- **Answer-first passages with specific, attributable numbers** and a clear provenance line ("Speeds are estimates calibrated against measured benchmarks… How we calculate"). Those are the qualities AI answers tend to quote.
- **/methodology** with 76 external source links is a strong citable primary-source page about how ratings are made.
- **FAQPage JSON-LD** answers match the visible "Short answer" text (no hidden-content mismatch). FAQ rich results no longer show in Google, but the markup is harmless.
- **RSS feed** at `/rss.xml` is valid and linked from the blog.

## Limitations
No live AI-platform citation data (no DataForSEO/SE Ranking/Profound). UA tests spoofed user-agents from a single residential IP. Brand-mention checks are WebSearch samples, not a full mention index. No Search Console or Bing Webmaster data.
