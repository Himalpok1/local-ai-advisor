# Images & Social Preview (OG/Twitter): iownchatgpt.com

Audit date: 2026-10-01. Skill: seo-images v2.4.1.
Method: raw HTML from 20 template samples (`<img>`, `<picture>`, inline `<svg>`, `og:*`, `twitter:*`), HTTP checks on every referenced image and OG endpoint, Playwright `document.images` checks (loading state, natural vs rendered size) on 4 pages at desktop and mobile. Source read (read-only) at `/mnt/ssd/Projects/Folderbyiphone`.

## Images Score: 46 / 100

| Component | Weight | Score | Notes |
|---|---|---|---|
| Alt text | 20 | 19 | Every `<img>` has an `alt`. The decorative mark uses `alt=""` next to a text label (correct). |
| Dimensions / CLS | 15 | 15 | `width`/`height` on all `<img>`. Measured CLS 0–0.0101 on all 8 page/viewport runs. |
| Format / weight | 15 | 12 | All on-page images are tiny SVGs (507–817 B). Unused 1.2 MB PNGs are publicly served. |
| Loading strategy | 10 | 7 | Below-fold lazy-loading works. The above-fold header logo is also lazy. |
| Social preview (OG/Twitter) coverage | 30 | 3 | og:image on only 3 of 20 sampled templates (about 32 of 4,720 sitemap URLs). No og:title/og:description on the rest. |
| Image search / content imagery | 10 | 0 | Zero content images on any template. All visuals are `aria-hidden` inline SVG. |

## Inventory (all 20 sampled templates)

| Metric | Status | Count |
|---|---|---|
| `<img>` per page | (identical on every page) | 3: header mark, footer light logo, footer dark logo |
| Missing alt | ✅ | 0 |
| Oversized (>200 KB) referenced on pages | ✅ | 0 (largest is 817 B SVG) |
| Wrong format | ✅ | 0 (SVG for logos is correct) |
| No dimensions | ✅ | 0 |
| `<picture>` / `srcset` | n/a | 0 (not needed for SVG) |
| Inline `<svg>` | ✅ all `aria-hidden` | 9–262 per page (lucide icons and diagrams) |
| Above-fold image lazy-loaded | ⚠️ | 1 (header logo-mark) |
| Pages with `og:image` | ❌ | 3 of 20 templates |

### OG / Twitter tag matrix (raw HTML)

| Template | og:title | og:description | og:url | og:type | og:site_name | og:image | og:image:alt | twitter:card |
|---|---|---|---|---|---|---|---|---|
| `/` home | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/check` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/can-i-run`, `/can-i-run/<m>`, `/can-i-run/<m>/<hw>` (4,537 URLs) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/what-runs-on/<hw>` (125 URLs) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/learn`, `/learn/<slug>` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/blog` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/blog/<slug>` | ✅ | ✅ | ✅ | ✅ article | ❌ | ✅ 1200x630 PNG (78 KB) | ⚠️ generic | ✅ summary_large_image |
| `/hugging-face` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ 1200x630 PNG (49 KB) | ✅ | ✅ |
| `/hf/<owner>/<model>` (30 URLs) | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ 1200x630 PNG (45 KB) | ❌ | ✅ |
| `/new-models`, `/models`, `/hardware`, `/methodology`, `/tools`, `/compare/models`, `/speed-test` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

Confirmed with a Googlebot UA on `/`: the `<head>` contains only charset, viewport, 2x theme-color, description and next-size-adjust. This is not a streaming-metadata artifact.

---

## Findings

### I1. No Open Graph or Twitter Card tags on 17 of 20 templates (about 99% of URLs)
- **Severity:** High
- **Evidence:** `https://iownchatgpt.com/`, `/check`, `/can-i-run/qwen3.5-4b/macbook-air-m4-16gb`, `/what-runs-on/macbook-air-m1-16gb`, `/learn`, `/learn/what-is-local-ai`, `/blog`, `/new-models`, `/models` and the rest have no `og:*` or `twitter:*` meta. `https://iownchatgpt.com/opengraph-image` returns 404.
- **Impact:** Links shared on X, LinkedIn, Slack, Discord, iMessage and Reddit show a bare URL or a scraped guess with no image. For a site whose core content is shareable answers ("Can MacBook Air M4 16 GB run Qwen3.5 4B? Yes, excellent for chat"), this loses the main referral and link-earning channel. Some AI and answer surfaces also read OG title, description and image.
- **Root cause:** `app/layout.tsx` `metadata` defines only `metadataBase`, `title`, `description` and `icons`: no `openGraph`, no `twitter`. There is no root `app/opengraph-image.*`. Next.js does not derive `og:title` from `title`. Metadata merges shallowly, so any page that sets `openGraph` replaces the parent's object entirely (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`, "shallowly merged").
- **Recommendation:**
  1. Add `app/opengraph-image.tsx` as a site-wide brand card, reusing the pattern in `app/blog/[slug]/opengraph-image.tsx`. Segments without their own image inherit it.
  2. Add site defaults in the root layout:
     ```ts
     // app/layout.tsx: inside `metadata`
     openGraph: { type: "website", siteName: "Local AI Advisor", locale: "en_US" },
     twitter: { card: "summary_large_image" },
     ```
  3. Because pages replace `openGraph` wholesale, add a helper and use it in every `generateMetadata`/`metadata` so title, description, url and siteName stay in sync with the canonical:
     ```ts
     // lib/seo/metadata.ts
     import type { Metadata } from "next";
     export function pageMeta({ title, description, path, type = "website" }:
       { title: string; description: string; path: string; type?: "website" | "article" }): Metadata {
       return {
         title, description,
         alternates: { canonical: path },
         openGraph: { type, siteName: "Local AI Advisor", locale: "en_US", title, description, url: path },
         twitter: { card: "summary_large_image", title, description },
       };
     }
     ```
  4. Highest-value per-template images: add `app/can-i-run/[model]/[hardware]/opengraph-image.tsx` and `app/what-runs-on/[hardware]/opengraph-image.tsx`. Render the verdict ("Yes, excellent for chat · 25–35 tok/s") with the brand gradient, as `app/hf/[owner]/[model]/opengraph-image.tsx` already does. Export a page-specific `alt`.
- **Responsible files:** `app/layout.tsx`; new `app/opengraph-image.tsx`; `generateMetadata` in `app/can-i-run/[model]/[hardware]/page.tsx`, `app/can-i-run/[model]/page.tsx`, `app/what-runs-on/[hardware]/page.tsx`, `app/learn/[slug]/page.tsx`; static `metadata` in `app/check/page.tsx`, `app/learn/page.tsx`, `app/blog/page.tsx`, `app/new-models/page.tsx`, `app/models/page.tsx`, `app/hardware/page.tsx`, `app/methodology/page.tsx`, `app/tools/page.tsx`, `app/compare/models/page.tsx`, `app/speed-test/page.tsx`. The homepage `app/page.tsx` has no metadata export.

### I2. `/hf/<owner>/<model>` loses its image alt and og:url/og:type because `openGraph.images` is set manually
- **Severity:** Medium
- **Evidence:** `/hf/Qwen/Qwen3-0.6B` emits `og:image` without `og:image:alt` or `twitter:image:alt`, and has no `og:url`, `og:type` or `og:site_name`. Meanwhile `app/hf/[owner]/[model]/opengraph-image.tsx:2` exports `alt = "Local AI Advisor — estimated comfort on M4 Pro 48GB"`. `generateMetadata` (`app/hf/[owner]/[model]/page.tsx:35`) sets `openGraph: { images: [{ url, width, height }] }`, which overrides the file-convention image and drops its alt. `/hugging-face` shows `og:image:alt` (via file convention) but also lacks og:url and og:type.
- **Recommendation:** Remove the explicit `openGraph.images` (the colocated `opengraph-image.tsx` already supplies URL, size and alt). Use the `pageMeta()` helper from I1 for title, description, url and type. For `/hugging-face?repo=` keep the override but add `alt`.
- **Responsible files:** `app/hf/[owner]/[model]/page.tsx` (line 35), `app/hugging-face/page.tsx` (line 14).

### I3. Blog post OG: generic alt and no `og:site_name`
- **Severity:** Low
- **Evidence:** `/blog/welcome-to-the-local-ai-advisor-blog`: `og:image:alt = "Local AI Advisor blog post"` (the same for every post), and `og:site_name` is absent.
- **Recommendation:** In `app/blog/[slug]/opengraph-image.tsx`, export `generateImageMetadata` (or set `openGraph.images[0].alt`) so alt is `` `${post.title} · Local AI Advisor blog` ``. Add `siteName` via the helper.
- **Responsible files:** `app/blog/[slug]/opengraph-image.tsx` (line 6), `app/blog/[slug]/page.tsx` (`generateMetadata`).

### I4. No content imagery anywhere, so no Google Images or Discover surface
- **Severity:** Medium
- **Evidence:** On all 20 templates the only `<img>` elements are the 3 logos. The "short, visual lessons" (`/learn` description) render diagrams as inline SVG with `aria-hidden` (28/28 SVGs on `/learn/what-is-local-ai`, 58/58 on `/`). The blog post has no hero image in the body. Meanwhile `public/brand/` contains ready-made editorial art that is never referenced: `editorial-model-choice.webp` (42 KB), `editorial-capability-layers.webp` (50 KB), `illustration-four-tiers.svg`, `fit-check.gif`/`fit-check-poster.png` (grep of `app/`, `components/`, `lib/` finds only `illustration-local-stack.svg` in use, in `components/advisor/stack-builder.tsx`).
- **Impact:** No eligibility for image results. Weaker Discover eligibility, because Discover favours large (≥1200 px wide) images. Lessons and blog posts with no visual anchor are less engaging for the beginner audience.
- **Recommendation:** Add a hero image to each blog post (front-matter `image:` and `<Image>` with descriptive alt, also used as the BlogPosting `image`). Use the existing editorial WebP assets in the relevant lessons with descriptive alt (e.g. "Diagram of the layers that decide whether a model runs well: memory, bandwidth, model size, context"). Where an inline SVG diagram carries meaning, give it `role="img"` and `aria-label` instead of `aria-hidden`. Serve hero images with `next/image` (automatic AVIF/WebP + `srcset`), and set `preload` / `fetchPriority="high"` on the LCP hero only.
- **Responsible files:** `app/blog/[slug]/page.tsx`, `lib/blog.ts` (front-matter schema), `components/learn/lesson-content*`, `public/brand/`.

### I5. Unreferenced 1.2 MB PNGs are publicly served from `/brand/`
- **Severity:** Low
- **Evidence:** `https://iownchatgpt.com/brand/editorial-model-choice.png` → 200, 1,241,032 B. `/brand/editorial-capability-layers.png` → 200, 1,242,781 B. `/brand/asset-preview.png` → 200, 391,521 B. None are referenced by any page (source grep). WebP versions exist at about 3.5% of the size.
- **Recommendation:** Delete the PNG originals from `public/` (keep them in a non-public design folder) or use only the WebP versions. Remove `asset-preview.png` (an internal brand sheet). This avoids orphaned assets being indexed in Google Images without page context.
- **Responsible file:** `public/brand/` (see `public/brand/README.md`).

### I6. Above-the-fold header logo is lazy-loaded
- **Severity:** Low
- **Evidence:** Every page: `<img src="/brand/logo-mark.svg" alt="" width="32" height="32" loading="lazy" decoding="async">` at top=12–16 px (Playwright). The impact is tiny (507 B SVG, not the LCP element), but it is the wrong pattern.
- **Recommendation:** Set `loading="eager"` on the header logo. In Next 16, `priority` is deprecated in favour of `preload`, but `loading="eager"` is enough here. Keep the footer logos lazy: the hidden dark/light variant correctly never downloads (`complete:false, naturalWidth:0` observed).
- **Responsible file:** `components/site/header.tsx:21`.

### I7. Logo SVG text depends on locally installed Arial
- **Severity:** Low
- **Evidence:** `public/brand/logo-horizontal.svg` draws "Local AI" and "Advisor" as `<text>` with `font-family="Arial,Helvetica,sans-serif"` at fixed x positions (80 and 180). SVGs loaded via `<img>` cannot use the page's web fonts. In headless Chromium on Linux (no Arial), the footer logo rendered with a visible gap between "Local AI" and "Advisor" (see `screenshots/check/iownchatgpt_com_desktop.png`, footer). It will look correct on most Mac and Windows machines, but not reliably on Linux or Android.
- **Recommendation:** Convert the text to outlined paths in both `logo-horizontal.svg` and `logo-horizontal-dark.svg`.
- **Responsible file:** `public/brand/logo-horizontal.svg`, `public/brand/logo-horizontal-dark.svg`.

### I8. OG image endpoints are served with `max-age=0, must-revalidate`
- **Severity:** Info
- **Evidence:** `/blog/<slug>/opengraph-image`, `/hugging-face/opengraph-image?…` and `/hf/Qwen/Qwen3-0.6B/opengraph-image` → `cache-control: public, max-age=0, must-revalidate`. By contrast, `/brand/logo-mark-512.png` gets `max-age=31536000`.
- **Recommendation:** When adding OG images for the 4,500 pair pages (I1.4), make them statically generated or set a revalidate window so each social-crawler hit doesn't re-render an `ImageResponse` on Hostinger.
- **Responsible file:** future `app/**/opengraph-image.tsx` (route segment config `revalidate`).

---

## What works
- **Alt text is right everywhere:** a meaningful alt on the footer logo ("Local AI Advisor"), an empty alt on the header mark that sits next to visible brand text, and an empty alt on the decorative Google avatar (`components/site/user-menu.tsx`).
- **No CLS from images:** explicit `width`/`height` on every `<img>`. Measured CLS was 0.0000–0.0101 across home, /check, pair page and blog post at desktop and mobile.
- **Vector-first:** logos are 507–817 B SVGs. 9–262 lucide icons per page are inline SVG with `aria-hidden`, so they add no requests and cause no screen-reader noise.
- **Smart lazy-loading in the footer:** the CSS-hidden dark/light logo variant never downloads.
- **Existing OG images are correctly specified:** 1200x630 PNGs at 45–78 KB with `summary_large_image`, a branded design, and width/height meta (blog post, /hugging-face, /hf/*).
- **Icons:** `/favicon.ico` (200), `/brand/logo-mark-128.png` icon, and a 512 px `apple-touch-icon` with a one-year cache.
