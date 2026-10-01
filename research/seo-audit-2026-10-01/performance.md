# Performance / Core Web Vitals: iownchatgpt.com

Audit date: 2026-10-01. Agent: seo-performance. Tools: Lighthouse **13.5.0** CLI (local Chromium 1243, headless), run as mobile default with simulated/Lantern throttling, mobile with DevTools applied throttling, and desktop preset. Also curl timings and source reads @ `e2cbad3`. Raw reports: `(audit workspace)/lh/*.json`.

## Data availability (read first)
- **Field data (CrUX, 75th percentile of real users): NOT AVAILABLE.** `crux_history.py` needs `GOOGLE_API_KEY` (not configured). `pagespeed_check.py` without a key returned "PSI rate limit exceeded", so there are no PSI field metrics either. **Pass/fail for real-user CWV cannot be stated.** Check Search Console → Core Web Vitals, or CrUX Vis, for origin data. A small new site may have no CrUX data at all.
- **INP cannot be measured in the lab.** TBT and long tasks are used as the proxy below.
- Everything below is **lab data** from a single run per configuration on one Linux machine. Treat it as directional.

## Performance Score: 50/100
Basis: Lighthouse mobile performance 43-46 on all 6 templates (all metric-weighted); desktop 87 (home) and 99 (pair page); server and network fundamentals excellent; JS and third-party cost is the bottleneck.

## Core Web Vitals status (lab)

| Metric | Mobile simulated (6 pages) | Mobile DevTools-throttled (home / pair) | Desktop (home / pair) | Unthrottled observed | Status |
|---|---|---|---|---|---|
| LCP | 9.5-10.4 s | **8.2 s** / 2.2 s | 2.4 s / 0.6 s | 1.29-2.32 s | **Poor (lab mobile)** |
| INP (proxy: TBT) | TBT 540-730 ms | TBT 1,420 / 1,190 ms | TBT 70 ms | n/a | **Likely at risk on mobile** (unverified without field data) |
| CLS | 0-0.032 | 0.001 / **0.177** | 0.001 | n/a | Mostly good; one run reached Needs Improvement on the pair template |
| FCP | 5.7-6.3 s | 2.2 s | 0.4 s | 1.29-2.32 s | Poor (lab mobile) |
| TTFB | 30-110 ms (LH) | | | curl 0.09-0.24 s warm, 0.16-0.44 s cold ISR | **Good** |

Per-page mobile (simulated) results:

| URL | Perf | FCP | LCP | TBT | CLS | Bytes |
|---|---|---|---|---|---|---|
| / | 43 | 5.7 s | 9.7 s | 730 ms | 0.001 | 996 KiB |
| /can-i-run/gemma-4-31b/mac-studio-m1-ultra-64gb | 46 | 5.7 s | 9.7 s | 580 ms | 0.001 | 1,059 KiB |
| /can-i-run/qwen3-8b | 46 | 6.0 s | 10.1 s | 540 ms | 0.001 | 1,051 KiB |
| /models | 43 | 6.2 s | 10.4 s | 680 ms | 0 | 1,218 KiB |
| /blog/welcome-to-the-local-ai-advisor-blog | 45 | 6.3 s | 9.5 s | 550 ms | 0 | 978 KiB |
| /check | 43 | 5.8 s | 10.2 s | 720 ms | 0.032 | 1,046 KiB |

The fact that a near-static 600-word blog post scores the same as the 5,000-element /models page shows the cost is **site-wide (layout and third-party), not page content**.

## Bottlenecks (prioritized)

### P1. High: third-party scripts (GA4 + AdSense) are about 53% of all JS bytes and are preloaded in `<head>`
- **Evidence (home):** third-party script 426 KiB vs first-party 374 KiB. `gtag/js` 178 KB transfer with 412-491 ms main-thread CPU; AdSense `adsbygoogle.js` + `show_ads_impl` 225 KB with 290-384 ms CPU. Both appear among the top long tasks on every page (gtag 238-334 ms, show_ads 170-225 ms). Next's `strategy="afterInteractive"` still emits `<link rel="preload" as="script">` for both in the `<head>`, so they compete with first-party chunks during initial load. AdSense also pulls in `googleads.g.doubleclick.net`, `ep1/ep2.adtrafficquality.google` and `www.google.com` (6 third-party origins), and sets a third-party `test_cookie` (Best Practices 77 on every page).
- **Recommendation:**
  1. Load AdSense with `strategy="lazyOnload"`, or inject it on first user interaction or after `requestIdleCallback`.
  2. Load GA4 via `@next/third-parties/google` (`<GoogleAnalytics gaId=…/>`) or `lazyOnload`.
  3. If AdSense earns little, consider removing it on the tool pages (/check, /evaluate, /compare). It cannot be removed per page from the root layout, so move it into a route-group layout that only content pages use.
  4. Reserve space (min-height) for any ad slot to protect CLS.
- **Expected impact:** TBT −250 to −450 ms on mobile, plus large FCP/LCP gains under simulation.
- **Responsible:** `app/layout.tsx` (lines with `<Script src=googletagmanager…>` and `<Script src=pagead2.googlesyndication…>`).

### P2. High: heavy first-party hydration (about 2-3 s of mobile CPU) and large inline RSC payloads
- **Evidence:** JS bootup 2.1-3.1 s and main-thread work 3.7-6.8 s (mobile). The top chunk `3794-*.js` is 93 KB with 650-1,017 ms script eval. Unused JS (first party + third party) is about 338-347 KiB per page. Inline React Server Components flight data (`self.__next_f.push`) makes up **45-58% of the HTML**: home 60 KB of 133 KB, `/can-i-run/qwen3-8b` 259 KB of 504 KB, `/methodology` 252 KB of 434 KB, pair page 46 KB of 89 KB. The `Providers` wrapper (`next-auth` `SessionProvider`) wraps the entire app as a client component and fires a session fetch on every page view. 17 KB of legacy polyfills (Array.prototype.at/flat/flatMap, Object.fromEntries, Object.hasOwn) ship in `3794-*.js`.
- **Recommendation:**
  - Keep large tables and lists (catalog rows, hardware lists, FAQ data) as server components so their data is not duplicated into the RSC payload. Pass only the props that interactive islands need.
  - Paginate or virtualize `/models` (5,252 DOM elements in raw HTML) and `/hardware` (3,603).
  - Scope `SessionProvider` to the components that need it (user menu, save button, report form), or lazy-load the user menu.
  - Set a modern `browserslist` to drop the legacy polyfills.
  - Analyze with `@next/bundle-analyzer` to identify the contents of `3794-*` and `3384-*`.
- **Responsible:** `components/site/providers.tsx`, `app/layout.tsx`, `app/models/page.tsx`, `app/hardware/page.tsx`, `app/methodology/page.tsx`, `app/can-i-run/[model]/page.tsx`, `package.json` (browserslist).

### P3. High (home): the LCP element is an animated "typing" chat bubble, which pushes LCP late
- **Evidence:** DevTools-throttled mobile run on `/`: LCP **8.2 s**, element `div.min-h-[8.5rem]` "Imagine your computer's b…", element render delay 8,038 ms. `HeroChat` waits 1.7 s after entering the viewport, then types the answer at 110 chars/s via `requestAnimationFrame` + `setState` on every frame. Every growth of the text node becomes a new LCP candidate. The hero H1, paragraph and CTAs also use `animate-fade-up` (start at `opacity:0`, delays 80-300 ms). The loop also restarts every ~4 s while the hero is in view, re-rendering React state at about 60 fps. That is continuous main-thread work, which increases INP risk for taps on the hero CTAs.
- **Recommendation:** render the full answer text in the SSR HTML (visually masked or revealed with a CSS clip or `ch`-width animation rather than React state). Alternatively, keep the bubble's final size fixed and animate only opacity of an overlay, so the largest text node is painted at first render. Remove `animate-fade-up` from the H1 (keep it on secondary elements). Stop the replay loop after one cycle, or when the user interacts.
- **Responsible:** `components/explainers/hero-chat.tsx`, `app/page.tsx` (lines 51-84, `animate-fade-up`), `app/globals.css` (`--animate-fade-up`).

### P4. Medium: CLS 0.177 on the model × hardware template in the applied-throttling run
- **Evidence:** `/can-i-run/gemma-4-31b/mac-studio-m1-ultra-64gb` (DevTools throttling): the "Short answer" card (`main > div > div.rounded-2xl`) shifted by 0.177. Lighthouse attributes it to the web font `636a5ac981f94f8b-s.p.woff2` (Plus Jakarta Sans) loading and re-wrapping the 3-line H1 above it. It also flags the footer logo `<img class="h-9 w-auto">` as "unsized" because CSS overrides width to auto. The header "Sign in" area also shifts slightly (0.0005) when the session resolves. Simulated runs showed only 0.001, so this is **intermittent and timing-dependent; field impact is unverified**.
- **Recommendation:** check that next/font's `adjustFontFallback` is active for Plus Jakarta Sans (the `next-size-adjust` meta is present). Consider `display: "optional"` for the heading font, or reserve H1 height on pair pages. Give the header auth slot a fixed width/skeleton.
- **Responsible:** `app/layout.tsx` (font config), `components/site/user-menu.tsx`, `components/site/footer.tsx`.

### P5. Low: 22 KB render-blocking CSS
- **Evidence:** `/_next/static/css/9ee59af84cb47d04.css` (21,975 B) is render-blocking. Lighthouse estimates 160-170 ms savings. This is normal for Next/Tailwind, and the critical chain is only 2 deep (document → CSS, 143-217 ms).
- **Recommendation:** acceptable as is. Next's `experimental.inlineCss` could be evaluated.

### P6. Low: no preconnect to third-party origins
- **Evidence:** "no origins were preconnected". Lighthouse estimates 310-350 ms LCP savings each for `pagead2.googlesyndication.com` / `adtrafficquality.google`.
- **Recommendation:** moot if P1 defers ads. Otherwise add `preconnect` only for `www.googletagmanager.com`.

## What works
- **Server/network:** TTFB 30-110 ms (Lighthouse), 0.09-0.24 s curl warm, 0.16-0.44 s cold ISR. ISR/prerender (`x-nextjs-prerender: 1`) plus Brotli and HTTP/2 + HTTP/3 (`alt-svc h3`).
- **Static asset caching:** `/_next/static/*` and fonts are `public, max-age=31536000, immutable`; `/brand/*` 1 year.
- **Fonts:** self-hosted via `next/font` with 2 preloaded woff2 files; font-display insight passes.
- **Images:** few and tiny (SVG logos), all with width/height and alt. No hero image, so there is no image-LCP problem.
- **CLS:** 0-0.03 in 7 of 8 runs.
- **Page weight:** about 1 MB total per page, with total byte weight passing.
- **Desktop:** pair page scores **99**; home 87.
- **Other:** no `document.write`, the critical request chain is short, and Lighthouse Accessibility is 93-100 and SEO 100 on every page.

## Expected outcome if P1-P3 are fixed
A mobile Lighthouse score of roughly 70-85 is plausible (TBT under 300 ms; LCP driven by text with no JS dependency). This is an estimate, not a measurement; re-run Lighthouse and confirm with CrUX/GSC after about 28 days of field data.

## Structured (audit-data.json compatible)
```json
{"category":"Performance","score":50,"field_data":"unavailable (no CrUX/PSI key; PSI keyless rate-limited)","lighthouse_version":"13.5.0",
"lab_mobile":{"perf":[43,46],"lcp_s":[9.5,10.4],"tbt_ms":[540,730],"cls":[0,0.032]},
"lab_desktop":{"home":87,"pair":99},
"findings":[
{"id":"third-party-ga-adsense","severity":"High","evidence":"426KiB 3p JS, preloaded in head, top long tasks","file":"app/layout.tsx"},
{"id":"hydration-rsc-payload","severity":"High","evidence":"bootup 2.1-3.1s; inline RSC 45-58% of HTML","file":"components/site/providers.tsx, app/models/page.tsx"},
{"id":"hero-typing-lcp","severity":"High","evidence":"home LCP 8.2s devtools-throttled; LCP=typing chat bubble","file":"components/explainers/hero-chat.tsx"},
{"id":"pair-cls-font","severity":"Medium","evidence":"CLS 0.177 one run; web font + unsized footer img","file":"app/layout.tsx"},
{"id":"render-blocking-css","severity":"Low"},{"id":"no-preconnect","severity":"Low"}]}
```
