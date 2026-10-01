# Technical SEO: iownchatgpt.com (Local AI Advisor)

Audit date: 2026-10-01. Agent: seo-technical (skill v2.4.1). Method: raw HTTP fetches (curl, browser-like headers, 1 request/s), `sitemap_discovery.py`, `agentic_check.py`, Lighthouse 13.5.0 (local Chromium), and source reads at commit `e2cbad3` (HEAD = what is deployed).
Sample: 24 template URLs (home, /check, /can-i-run, /can-i-run/qwen3-8b, 3 model x hardware pages, 2 /what-runs-on, /learn + 2 lessons, /blog + post, /new-models, /hugging-face, /hf/Qwen/Qwen3-8B, /models, /methodology, /hardware, /compare/models, /speed-test, /community, /tools), 40 random sitemap URLs, and 25 redirect/404 edge URLs. Raw data: `(audit workspace)/{pages,extract.json,fetch.log,smcheck.log,lh/}`.

> Note: the source working tree has **uncommitted** edits made in parallel during this audit (root `openGraph`/`twitter` metadata in `app/layout.tsx`, new `app/opengraph-image.tsx`, `components/seo/json-ld.tsx` with BreadcrumbList, `lib/og.ts`). None of it is deployed: `https://iownchatgpt.com/opengraph-image` returns 404, and the live pages have no og:* tags. The findings below describe production as it is now.

## Technical Score: 64/100

| Category | Status | Score | Checks behind the score |
|---|---|---|---|
| Crawlability | warn | 60 | robots.txt 200 and valid (pass); sitemap declared and valid (pass); WAF 403-challenges crawler-style requests (fail, high); /hf pages orphaned (warn); crawlable parameter URLs on /evaluate (warn) |
| Indexability | warn | 58 | canonical missing on 15 of 29 page routes including the homepage (fail); www host serves 200 duplicates (fail); unbounded /hf/<any repo> space (warn); about 17% of pair pages are "No, it doesn't fit" (warn); noindex is used correctly on /me, /community/review and 404s (pass) |
| Security | warn | 55 | HTTPS with a valid cert covering apex and www (pass); http→https 301 (pass); no HSTS, X-Content-Type-Options, frame-ancestors/X-Frame-Options or Referrer-Policy on HTML (fail); `x-powered-by: Next.js` exposed (low) |
| URL Structure | pass/warn | 75 | clean, hyphenated, lowercase slugs (pass); trailing slash 308 → no slash, consistent (pass); www not redirected (fail); http + trailing slash makes 2 hops (low); /compare uses a 307 (low); longest URL 113 chars (low) |
| Mobile | pass | 88 | viewport and `lang` present (pass); responsive layout; Lighthouse accessibility 93-100; color-contrast failures on 4 of 6 pages (low) |
| Core Web Vitals | fail (lab) | 35 | lab mobile LCP 9.5-10.4 s simulated, TBT 540-730 ms; CLS 0-0.03 simulated but 0.177 in one applied-throttling run. **Field (CrUX) data not measured**: no API key |
| Structured Data | warn | 60 | FAQPage on programmatic pages and BlogPosting on the post (valid JSON); no WebSite/Organization on home; no BreadcrumbList JSON-LD in production |
| JS Rendering | pass | 95 | SSR/SSG: 533 words without JS on a pair page (`agentic_check` server-rendered = pass); title, description, canonical and JSON-LD are all in the initial HTML |
| IndexNow | fail | 0 | no key file and no IndexNow integration found (informational; affects Bing/Yandex only) |

The weighted overall is 64. The two problems most likely to cost traffic are the WAF challenge and the missing canonicals combined with the www duplicate.

---

## Critical
None confirmed. The WAF finding below could be Critical if it applies to verified Googlebot. That part could not be verified from outside.

## High

### H1. Hostinger CDN returns a 403 "Checking your browser" challenge to crawler-style requests
- **Evidence (reproduced 3 out of 3 times):** `GET https://iownchatgpt.com/learn` returns **403** (2,482-byte challenge page with `<meta name="robots" content="noindex,nofollow">` and `meta refresh 30`) whenever the request sends `Accept-Encoding` without `Accept-Language`. That is exactly the header set used by Googlebot, Bingbot, python-requests and most crawlers. The same URL returns 200 if `Accept-Language` or `From: googlebot(at)googlebot.com` is added, or if `Accept-Encoding` is dropped.
  - Googlebot smartphone UA + `Accept` + `Accept-Encoding: gzip, deflate, br` → **403** on `/robots.txt`, `/sitemap.xml`, `/rss.xml` and `/can-i-run/qwen3-8b`.
  - Bingbot UA + `Accept-Encoding` → **403**. GPTBot UA → one **429** on /sitemap.xml.
  - Response headers: `server: hcdn`, `cache-control: private, no-store` (Hostinger CDN bot protection, not the Next.js app).
- **Unverified:** whether Hostinger exempts *verified* Googlebot/Bingbot IP ranges (spoofed UAs from this machine cannot test that). The behavior is header-fingerprint-based, so AI search crawlers (OAI-SearchBot, PerplexityBot, Claude-SearchBot), social preview bots (Facebook, LinkedIn, Slack, X) and SEO tools are very likely blocked.
- **Recommendation:** in hPanel → CDN / Security, disable or relax "bot protection / browser check" for this site (or allowlist known good bots). Then check Google Search Console → Settings → Crawl stats (host status, share of 403 responses) and run a URL Inspection live test on a /can-i-run pair page. Repeat the check in Bing Webmaster Tools URL inspection.
- **Responsible:** hosting configuration (Hostinger hcdn), not the repo.

### H2. No canonical tag on the homepage and 14 other indexable routes, and the www host serves duplicate 200s
- **Evidence:**
  - `https://www.iownchatgpt.com/` and `https://www.iownchatgpt.com/learn` return **200 with no redirect** (`http://www.` → 301 → `https://www.`, then stops). The TLS certificate covers www. Pages that do have a canonical point back to the apex (`www…/can-i-run/qwen3-8b` → canonical `https://iownchatgpt.com/can-i-run/qwen3-8b`). Pages without one become full, unconsolidated duplicates on www.
  - No `<link rel="canonical">` on: `/`, `/check`, `/learn`, `/learn/<slug>` (all 10 lessons), `/models`, `/methodology`, `/hardware`, `/compare/models`, `/compare/hardware`, `/tools`, `/runtimes`, `/stack`, `/hardware-for-model`, `/evaluate`. Confirmed live on 11 sampled URLs.
  - Query variants also get no canonical, e.g. `/learn?utm_source=x` and `/check?hw=foo` return 200 with none.
- **Recommendation:** add a 301 from `www.iownchatgpt.com/*` to the apex in Hostinger (domain/redirect settings). Add `alternates: { canonical: "/<path>" }` to each listed route's `metadata`/`generateMetadata`; `metadataBase` is already set in the layout. Do **not** put a single canonical in the root layout, because it would be inherited site-wide.
- **Responsible:** `app/page.tsx`, `app/check/page.tsx`, `app/learn/page.tsx`, `app/learn/[slug]/page.tsx`, `app/models/page.tsx`, `app/methodology/page.tsx`, `app/hardware/page.tsx`, `app/compare/models/page.tsx`, `app/compare/hardware/page.tsx`, `app/tools/page.tsx`, `app/runtimes/page.tsx`, `app/stack/page.tsx`, `app/hardware-for-model/page.tsx`, `app/evaluate/page.tsx`. The www redirect is in hosting configuration.

### H3. Mobile lab performance is poor across every template (details in performance.md)
- **Evidence:** Lighthouse 13.5.0 mobile scored 43-46 on all 6 templates tested. Simulated LCP 9.5-10.4 s, TBT 540-730 ms, JS bootup 2.1-3.1 s. GA4 (178 KB) and AdSense (225 KB) are preloaded in `<head>`.
- **Recommendation and responsible files:** see performance.md (P1-P4). Main files are `app/layout.tsx` and `components/explainers/hero-chat.tsx`.

## Medium

### M1. No Open Graph or Twitter tags on most pages, and no og:image on the homepage
- **Evidence:** `/`, `/check`, `/learn`, `/learn/quantization`, `/models` and every /can-i-run and /what-runs-on page have zero `og:*` and `twitter:*` tags. Only `/blog/<slug>`, `/hugging-face` and `/hf/<repo>` have them. `https://iownchatgpt.com/opengraph-image` → 404.
- **Recommendation:** set root `openGraph` and `twitter` defaults plus a root `opengraph-image`. Uncommitted work in the tree already does this; deploy it, then verify that og:title/og:description come from each page's own metadata.
- **Responsible:** `app/layout.tsx`, `app/opengraph-image.tsx` (untracked).

### M2. Crawlable, parameterized `/evaluate?...` URLs have no canonical or noindex
- **Evidence:** 19 unique `/evaluate?hw=…&m=…&q=…&uc=…&tool=…&repo=…&pr=…&dev=…` links in the sampled pages. `/evaluate` returns 200 with title "Detailed evaluation", no canonical and no robots tag. Combining 8 parameters can produce a very large URL space.
- **Recommendation:** add `robots: { index: false, follow: true }` to `/evaluate`, or canonicalize it to the matching `/can-i-run/<model>/<hw>` page. Optionally add `rel="nofollow"` to the links.
- **Responsible:** `app/evaluate/page.tsx`, and link builders in `lib/can-i-run` (`evaluateHref`).

### M3. /hf/<owner>/<model> pages are orphaned in production, and the template accepts any Hugging Face repo
- **Evidence:** the sitemap lists 30 `/hf/...` URLs, but none of the 24 sampled pages link to `/hf/`, including /new-models and /hugging-face. /new-models links to `/hugging-face?repo=openbmb%2FMathForm-8B` (a client-side tool page) instead. Meanwhile any valid repo resolves as an indexable 200 with a self-canonical, e.g. `/hf/microsoft/phi-2` and `/hf/TinyLlama/TinyLlama-1.1B-Chat-v1.0`. The noindex only applies when the HF fetch fails.
- **Recommendation:** link /new-models cards and the /hugging-face result to `/hf/<repo>`. For repos outside `POPULAR_HF_REPOS` (or below a quality bar), set `robots: { index: false }` so the indexable set stays deliberate.
- **Responsible:** `app/hf/[owner]/[model]/page.tsx` (`generateMetadata`), the /new-models list component, `lib/hf/popular.ts`.

### M4. Weak or templated titles and descriptions on some programmatic templates
- **Evidence:**
  - `/hf/Qwen/Qwen3-8B` title: "Qwen3-8B: 8.19B — Acceptable · Local AI Advisor". Every /hf description says "Estimated <verdict> for repository coding on a MacBook Pro M4 Pro 48GB…", which is near-identical across all /hf pages.
  - Pair titles reach 87-89 characters ("Can Desktop PC · GeForce RTX 5060 Ti 16GB · 32 GB RAM run Gemma 4 12B? · Local AI Advisor") and will be truncated. Pair descriptions run 211-226 characters.
  - "No" pair pages (about 17% of 30 sampled) say "…with download commands for Ollama, llama.cpp and LM Studio" even though they render no commands, e.g. `/can-i-run/llama-3.3-70b/macbook-air-m1-8gb`.
- **Duplication check:** all 24 sampled titles and descriptions are unique; there are no cross-template exact duplicates.
- **Recommendation:** shorten hardware names in titles (drop "Desktop PC · "), and keep descriptions at or under 160 characters. Use "Can I run Qwen3-8B locally? Hardware fit and speed" style titles for /hf. Drop the download-commands clause when the result is blocked.
- **Responsible:** `app/can-i-run/[model]/[hardware]/page.tsx` (`generateMetadata`), `app/hf/[owner]/[model]/page.tsx`, `app/what-runs-on/[hardware]/page.tsx`.

### M5. Missing security headers on HTML responses
- **Evidence (home, `pages/1.h`):** no `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, or `Referrer-Policy`. Only `content-security-policy: upgrade-insecure-requests`. `x-powered-by: Next.js` is exposed. (The CDN's own 403 page sends these headers, but the app does not.)
- **Recommendation:** add `headers()` in `next.config.mjs` with HSTS (`max-age=31536000; includeSubDomains`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `frame-ancestors 'self'`. Set `poweredByHeader: false`. This is a lightweight ranking factor but good hygiene.
- **Responsible:** `next.config.mjs` (currently an empty config).

## Low

- **L1. `/compare` uses a 307 (temporary) redirect.** Evidence: `https://iownchatgpt.com/compare` → 307. Fix: use `permanentRedirect()` or a 308. Source: `app/compare/page.tsx`.
- **L2. `http://…/path/` takes 2 hops** (301 to https, then 308 to strip the slash). Evidence: `http://iownchatgpt.com/learn/`. Low impact; fixing the hosting redirect to target the final URL would remove one hop.
- **L3. No WebSite/Organization JSON-LD on the homepage, and no BreadcrumbList in production.** The pair, model and hardware pages show visual breadcrumbs but emit no BreadcrumbList. Uncommitted `components/seo/json-ld.tsx` adds this. Source: `app/page.tsx`, `components/can-i-run/parts.tsx`.
- **L4. FAQPage markup on about 4.7K programmatic pages.** It is valid, but Google restricts FAQ rich results to authoritative government and health sites, so it gives no SERP feature. It is harmless to keep. Source: `components/can-i-run/parts.tsx` (`FaqJsonLd`).
- **L5. No IndexNow.** No key file was found. Consider adding a key file plus a post-deploy ping (Bing/Copilot index). Script available: `indexnow_submit.py`.
- **L6. No AI-crawler groups or llms.txt.** robots.txt is `User-Agent: * / Allow: /` only, and `/llms.txt` returns 404. This is fine as a policy; see the seo-agentic skill for details. Note that H1 likely blocks these crawlers in practice anyway.
- **L7. The 404 page reuses the default site title.** It correctly returns 404 + noindex. Low impact.
- **L8. Data-quality oddity in programmatic slugs:** `/what-runs-on/mac-mini-m6-16gb` etc. exist (an "M6" Mac mini) while there is no base M5 Mac mini entry. Verify against the data source in `data/`. *Unverified whether this is intentional.*

## What works
- robots.txt: 200, valid, allows everything, declares the sitemap. `sitemap_discovery.py` validates it as `urlset`.
- Full SSR/SSG. Primary content, title, description, canonical and JSON-LD are all in the initial HTML; `is_spa=false`.
- Correct status codes: unknown model, hardware, blog, lesson and /hf repo slugs return real **404** with noindex. `/me` and `/community/review` are noindex.
- Pages that do have canonicals (all /can-i-run, /what-runs-on, /hf, /blog, /new-models, /speed-test, /community, /hugging-face) self-reference the apex. That held on all 40 random sitemap URLs.
- HTTPS: http→https 301, valid Let's Encrypt-style cert (expires 2026-11-26) covering apex and www, HTTP/2 + HTTP/3.
- Trailing-slash policy is consistent: a 308 strips the slash.
- Fast origin: TTFB 0.09-0.24 s warm, 0.16-0.44 s for cold ISR pages (`x-nextjs-cache: MISS`).
- Clean, descriptive, lowercase, hyphenated URLs, mostly under 100 characters.
- Viewport, `lang="en"`, theme-color, and all sampled images have width/height and alt.
- RSS feeds (`/rss.xml`, `/new-models/feed.xml` with 40 items) are valid and advertised via `<link rel="alternate">`.
- `history.replaceState` is used only to sync URL state (hf-lookup, use-url-state), so there is no back-button hijacking.

## Structured (audit-data.json compatible)
```json
{"category":"Technical SEO","score":64,"findings":[
{"id":"waf-crawler-403","severity":"High","url":"https://iownchatgpt.com/*","evidence":"403 hcdn browser challenge when Accept-Encoding sent without Accept-Language (Googlebot/Bingbot header sets)","file":"hosting: Hostinger CDN"},
{"id":"missing-canonical-www-dup","severity":"High","url":"https://iownchatgpt.com/ , https://www.iownchatgpt.com/","evidence":"15 routes no canonical; www serves 200","file":"app/page.tsx et al.; hosting redirect"},
{"id":"mobile-lab-perf","severity":"High","evidence":"LH mobile 43-46, LCP 9.5-10.4s sim, TBT 540-730ms","file":"app/layout.tsx"},
{"id":"no-og-tags","severity":"Medium","evidence":"no og:* on home/most templates; /opengraph-image 404","file":"app/layout.tsx"},
{"id":"evaluate-param-urls","severity":"Medium","evidence":"/evaluate?8 params, indexable, no canonical","file":"app/evaluate/page.tsx"},
{"id":"hf-orphans-unbounded","severity":"Medium","evidence":"30 sitemap /hf URLs not linked; any repo indexable","file":"app/hf/[owner]/[model]/page.tsx"},
{"id":"templated-meta","severity":"Medium","evidence":"titles 87-89 chars, descs 211-226, /hf desc fixed hardware","file":"app/can-i-run/[model]/[hardware]/page.tsx"},
{"id":"security-headers","severity":"Medium","evidence":"no HSTS/XCTO/XFO/Referrer-Policy; x-powered-by","file":"next.config.mjs"},
{"id":"compare-307","severity":"Low"},{"id":"http-slash-2hops","severity":"Low"},{"id":"no-website-org-breadcrumb-ld","severity":"Low"},{"id":"faqpage-no-rich-result","severity":"Low"},{"id":"no-indexnow","severity":"Low"}]}
```
