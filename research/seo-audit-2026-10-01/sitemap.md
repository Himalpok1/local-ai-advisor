# Sitemap: iownchatgpt.com

Audit date: 2026-10-01. Agent: seo-sitemap (skill v2.4.1). Tools: `sitemap_discovery.py --json`, curl, Python XML parse, link diff against the 24 crawled template pages. Source: `app/sitemap.ts`, `app/robots.ts` @ `e2cbad3`.

## Sitemap Score: 72/100 (structure valid; the main gaps are lastmod, segmentation, crawler access and a 4.5K programmatic block)

## Validation report

| Check | Result | Evidence |
|---|---|---|
| Discovery | PASS | `sitemap_discovery.py`: declared in robots.txt → `https://iownchatgpt.com/sitemap.xml`, status 200, kind `urlset`, valid=true. The common fallbacks (`/sitemap_index.xml`, `/sitemap-index.xml`, `/wp-sitemap.xml`) are 404, which is expected |
| Valid XML | PASS | Parses cleanly (Python ElementTree); namespace `http://www.sitemaps.org/schemas/sitemap/0.9`; `content-type: application/xml` |
| URL count ≤ 50,000 | PASS | **4,720 URLs** (9.4% of the limit) |
| Size ≤ 50 MB uncompressed | PASS | **724,042 bytes** (0.69 MB) |
| HTTPS only, single host | PASS | All 4,720 `<loc>` are `https://iownchatgpt.com/...` (no www, no http) |
| Duplicates | PASS | 0 duplicate `<loc>` |
| URL length | PASS (minor) | Longest is 113 characters (a pair page with the "framework-desktop" hardware slug) |
| Trailing-slash consistency | PASS | 0 `<loc>` end in `/`, matching the site's 308 → no-slash policy. Home is `https://iownchatgpt.com` (equivalent to `/`) |
| Sampled URLs return 200 | PASS | 40 of 40 random sitemap URLs (15 non-pair, 25 pair) → 200, no redirects |
| Noindexed URLs in sitemap | PASS | 0 of 40 sampled carry `meta robots` |
| Canonical matches `<loc>` | PASS (where present) | 34 of 40 had a self-referencing canonical that equals `<loc>`. **6 had no canonical** (`/learn`, `/learn/memory`, `/learn/context`, `/learn/quantization`, `/models`, `/runtimes`); see technical.md H2 |
| `<lastmod>` | FAIL (Low-Medium) | Only **1 of 4,720** URLs has lastmod (`/blog/welcome-to-the-local-ai-advisor-blog` → `2026-10-01`) |
| `<changefreq>` / `<priority>` | INFO | Present on all 4,720 URLs (`weekly` everywhere; priority 1/0.8/0.7/0.6/0.5). Google ignores both |
| Referenced in robots.txt | PASS | `Sitemap: https://iownchatgpt.com/sitemap.xml` |
| Crawler can fetch sitemap | **FAIL (High, see S1)** | 403 CDN challenge for Googlebot-style request headers |
| Extension sitemaps (image/video/news) | N/A | None used; none needed |
| Hreflang | N/A | Single-language (en) site |

### URL composition
| Section | URLs | Notes |
|---|---|---|
| `/can-i-run/<model>/<hardware>` | 4,500 | 36 models × 125 hardware. `generateStaticParams` prebuilds only featured hardware; the rest render on first hit via ISR (cold TTFB measured 0.16-0.44 s, fine) |
| `/what-runs-on/<hardware>` | 125 | |
| `/can-i-run/<model>` + hub | 37 | |
| `/hf/<owner>/<model>` | 30 | `POPULAR_HF_REPOS` |
| `/learn` + lessons | 11 | |
| `/blog` + posts | 2 | |
| Static pages | 15 | home, /check, /new-models, /speed-test, /community, /hardware-for-model, /stack, /hugging-face, /compare/models, /compare/hardware, /models, /hardware, /runtimes, /tools, /methodology |

### Coverage: crawl vs sitemap
- **Linked but missing from the sitemap:** `https://iownchatgpt.com/community/submit` only (indexable, self-canonical). Add it or noindex it, since it is a form page. That makes 322 of 323 unique internal links found in the crawl sample present in the sitemap.
- **In the sitemap but not linked from any crawled page:** all **30 `/hf/...` URLs**. Nothing in the 24-page sample links to `/hf/`, and /new-models links to `/hugging-face?repo=…` instead. They are discoverable only through the sitemap (orphans); see technical.md M3.
- **Correctly excluded:** `/me` (noindex), `/community/review` (noindex/404), `/evaluate` (parameter page), `/compare` (307 redirect), `/api/*`, and the RSS feeds.

## Findings

### S1. High: the CDN challenges crawler-style fetches of robots.txt and sitemap.xml
- **Evidence:** `GET /sitemap.xml` with a Googlebot UA + `Accept` + `Accept-Encoding: gzip, deflate, br` → **403** (`server: hcdn`, "Checking your browser…" page). The very first fetch in this audit (curl `--compressed`) also got 403. The same request with `Accept-Language` added → 200. `/robots.txt` behaves the same way. With a GPTBot UA, one **429** was returned on /sitemap.xml.
- **Unverified:** whether verified Googlebot IPs are exempt.
- **Recommendation:** in Google Search Console → Sitemaps, confirm status "Success" and a recent "Last read" date. In Crawl stats, look for 403s. Relax Hostinger CDN bot protection for `/robots.txt`, `/sitemap.xml`, `/rss.xml` at minimum, and ideally site-wide for verified bots.
- **Responsible:** Hostinger hPanel CDN/security settings.

### S2. Medium: lastmod is missing on 4,719 of 4,720 URLs
- **Evidence:** `grep -c "<lastmod>"` = 1. `app/sitemap.ts` only sets `lastModified` for blog posts (`p.date`).
- **Recommendation:** emit accurate, per-URL lastmod. Do **not** use build time, because Google ignores lastmod that is not consistently accurate. Practical sources:
  - pair, model and what-runs-on pages: the max of the model's `updatedAt`/release date, the hardware record's update date, and the engine/methodology version date (add a `DATA_UPDATED` constant that changes only when ratings change);
  - /hf pages: the HF `lastModified`;
  - lessons: a frontmatter or `updated` field.
- **Responsible:** `app/sitemap.ts`, `data/` (model and hardware records), `components/learn/lessons`.

### S3. Medium: a single flat file mixes about 4.5K programmatic URLs with core pages
- **Evidence:** one `urlset` with 4,720 URLs, 95% of them `/can-i-run/<m>/<hw>`. It is within limits, but Search Console can only report indexing per submitted sitemap. That makes it hard to see whether Google is indexing the core pages versus the long tail, a common "Discovered/Crawled – currently not indexed" pattern for large programmatic sets.
- **Recommendation:** use `generateSitemaps()` (Next.js metadata API) to split by type: `core`, `learn-blog`, `models`, `hardware`, `pairs` (optionally pairs per model family). Submit each in GSC and watch indexed-vs-submitted per segment. This also adds headroom: at 36×125, every new model adds 126 URLs.
- **Responsible:** `app/sitemap.ts`.

### S4. Medium: programmatic quality gate (the analogue of the location-page gate)
- 4,500 pair pages far exceed the 50-page HARD-STOP threshold the skill uses for location pages. These are **not** city-swap doorway pages: each carries computed, pair-specific data (fit verdict, quantization, tok/s, headroom, run commands, alternatives), so they fall in the "Safe at scale: unique specs" class. The pages are still templated, though (456-586 words, shared boilerplate), and **about 17% of pairs (5 of 30 sampled) are "No. It doesn't fit in memory"** answers, e.g. `/can-i-run/llama-3.3-70b/macbook-air-m1-8gb`. Their description still promises "download commands".
- **Justification on record:** the source comment in `app/sitemap.ts` shows the design intent ("Every model × machine answer page"). This needs **explicit owner sign-off** per the quality gate.
- **Recommendation:** keep "runs" pairs in the sitemap. For "doesn't fit" pairs, either drop them from the sitemap (keep the pages live and linked, and optionally `noindex`), or enrich them with "what to run instead on this machine / cheapest machine that runs it" content above the fold (some of this already exists in the page body). Re-assess using GSC indexing coverage per pair segment (S3).
- **Responsible:** `app/sitemap.ts` (filter on `rate(model, hw, CHAT).level`), `app/can-i-run/[model]/[hardware]/page.tsx`.

### S5. Info: `<changefreq>` and `<priority>` on every URL
- Ignored by Google; harmless. Can be removed from the `entry()` helper in `app/sitemap.ts` to shrink the file by about 30%.

### S6. Low: orphaned /hf URLs listed only in the sitemap
- See coverage above and technical.md M3. A sitemap listing does not replace internal links. Link them from /new-models and /hugging-face results.

## What works
- Native Next.js `MetadataRoute.Sitemap` and `MetadataRoute.Robots`, generated from the same data the pages use, so it cannot drift from routes.
- Valid XML, well under the limits, HTTPS apex only, no duplicates, no trailing-slash or www variants, no redirected, 404 or noindexed URLs in the sample.
- Noindex and private routes are correctly excluded.
- The blog post carries a real lastmod. RSS feeds exist for the blog and new models.

## Recommended structure (proposed, not generated into the repo)
```
/sitemap.xml            -> sitemapindex
  /sitemap/core.xml     (~20: home, hubs, tools, methodology, catalogs)
  /sitemap/learn.xml    (lessons + blog posts, lastmod from frontmatter)
  /sitemap/models.xml   (/can-i-run/<model>, /hf/<repo>)
  /sitemap/hardware.xml (/what-runs-on/<hw>)
  /sitemap/pairs.xml    (/can-i-run/<m>/<hw>, usable pairs only, lastmod = data version date)
```

## Structured (audit-data.json compatible)
```json
{"category":"Sitemap","score":72,"url_count":4720,"bytes":724042,"lastmod_coverage":"1/4720","sample_status":"40/40 200","findings":[
{"id":"sitemap-waf-403","severity":"High","evidence":"403 hcdn challenge for Googlebot-style headers on /sitemap.xml and /robots.txt","file":"hosting"},
{"id":"lastmod-missing","severity":"Medium","evidence":"1/4720 lastmod","file":"app/sitemap.ts"},
{"id":"no-segmentation","severity":"Medium","evidence":"single urlset, 95% pair pages","file":"app/sitemap.ts"},
{"id":"programmatic-quality-gate","severity":"Medium","evidence":"4500 pair pages, ~17% 'No' verdicts","file":"app/sitemap.ts"},
{"id":"changefreq-priority","severity":"Info"},
{"id":"hf-orphans","severity":"Low","evidence":"30 /hf URLs only in sitemap"},
{"id":"community-submit-missing","severity":"Low","url":"https://iownchatgpt.com/community/submit"}]}
```
