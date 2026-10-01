# Visual / Above-the-fold / Mobile Rendering: iownchatgpt.com

Audit date: 2026-10-01. Agent: seo-visual.
Method: `capture_screenshot.py` at desktop 1920x1080 and mobile 375x812 (2x DPR). Playwright DOM measurements: scrollWidth vs viewport, H1/CTA position, fixed/sticky elements, interactive targets in the first viewport, and CLS via PerformanceObserver over 3 s, all with real mobile emulation (`is_mobile`, `has_touch`). Overflow root-cause traced to source (read-only).

## Screenshots (`(audit workspace)/screenshots/`)

| Page | Desktop | Mobile |
|---|---|---|
| Home `/` | `home/iownchatgpt_com_desktop.png` (also `desktop.png`) | `home/iownchatgpt_com_mobile.png` (also `mobile.png`) |
| Quiz `/check` | `check/iownchatgpt_com_desktop.png` | `check/iownchatgpt_com_mobile.png` |
| Pair `/can-i-run/qwen3.5-4b/macbook-air-m4-16gb` | `pair/iownchatgpt_com_desktop.png` | `pair/iownchatgpt_com_mobile.png` |
| Pair overflow evidence `/can-i-run/qwen3.6-27b/macbook-air-m1-16gb` | n/a | `pair/mobile-device-emulation-initial.png`, `pair/mobile-overflow-section.png` |
| Blog post `/blog/welcome-to-the-local-ai-advisor-blog` | `blogpost/iownchatgpt_com_desktop.png` | `blogpost/iownchatgpt_com_mobile.png` |

## Measured above-the-fold summary

| Page / viewport | H1 bottom (px) | H1 in view | Primary CTA (top–bottom, size) | CTA in view | Horizontal scroll | CLS |
|---|---|---|---|---|---|---|
| Home desktop | 409 | ✅ | "Check my computer" 549–605, 259x56 | ✅ | No | 0.0004 |
| Home mobile | 307 | ✅ | "Check my computer" 505–561, 343x56 | ✅ | No | 0.0006 |
| /check desktop | 253 | ✅ | "Next" 655–703, 144x48 | ✅ | No | 0.0101 |
| /check mobile | 199 | ✅ | "Next" 692–736 (fixed bar), 144x44 | ✅ | No | 0 |
| Pair desktop | 181 | ✅ | Short-answer card fully visible (no CTA button) | ✅ | No | 0.0003 |
| Pair mobile | 229 | ✅ | Short-answer card visible | ✅ | **Yes: 463 px doc on 375 px** | 0 |
| Blog post desktop | 197 | ✅ | Body text starts in first view. CTA "Check my computer" at 2051 px (end of post) | n/a | No | 0.0003 |
| Blog post mobile | 205 | ✅ | First paragraph in view. CTA at 3102 px | n/a | No | 0 |

Base font size is 16 px everywhere. Body copy is 16–18 px on pair and blog pages. The homepage `main p` sampled at 12 px is the small hero badge ("Free · no sign-up · 36 models rated"), not body copy.

---

## Findings

### V1. Horizontal overflow on mobile across the `/can-i-run/<model>/<hardware>` template (about 4,500 URLs)
- **Severity:** High
- **Evidence (Playwright, 375 px viewport, mobile emulation):**
  - `/can-i-run/qwen3.5-4b/macbook-air-m4-16gb`: `scrollWidth` 463 px
  - `/can-i-run/qwen3.6-27b/macbook-air-m1-16gb`: `scrollWidth` 607 px
  - `/can-i-run/qwen3.8-27b/macbook-air-m2-8gb`: `scrollWidth` 607 px
  - Controls without the issue: `/can-i-run/qwen3.6-27b`, `/what-runs-on/macbook-air-m1-16gb`, `/hf/Qwen/Qwen3-0.6B`, `/learn/what-is-local-ai`, home, `/check` and blog post all have `scrollWidth` 375 px.
  - Overflowing nodes: the `SECTION.space-y-4` blocks "Other models for <hw>" and "Cheapest machines for <model>", plus their `UL`/`LI`/`A` rows and comfort badges. `screenshots/pair/mobile-overflow-section.png` shows the page panned sideways: the comfort badges are pushed off-screen, hardware names are cut ("Desktop PC · Intel Arc Pro B60 24GB · 32 GB RA…"), and the fixed bottom tab bar is offset (the "Learn" and "More" tabs are clipped).
- **Root cause:** `app/can-i-run/[model]/[hardware]/page.tsx:177`: `<div className="grid gap-8 md:grid-cols-2">`. Below `md` there is no explicit column template. The implicit grid track is `auto`, and grid items default to `min-width: auto`, so the column grows to the max-content width of the `block truncate` (white-space: nowrap) names at lines 185 and 208. `truncate` never gets a constrained width to truncate against.
- **Impact:** Google evaluates the mobile rendering. Content wider than the viewport is a classic mobile-usability defect, and on real phones the page either zooms out (tiny text) or pans sideways. This template is about 95% of the sitemap and the main programmatic landing page.
- **Recommendation:** Change line 177 to `grid grid-cols-1 gap-8 md:grid-cols-2` (`grid-cols-1` = `minmax(0,1fr)`), or add `min-w-0` to both `<Section>` children. Then re-check that `scrollWidth === 375` on a long-hardware-name pair such as `/can-i-run/qwen3.6-27b/macbook-air-m1-16gb`. Add a Playwright regression test asserting no horizontal overflow at 375 px for one pair URL.
- **Responsible file:** `app/can-i-run/[model]/[hardware]/page.tsx` (lines 177–220).

### V2. Small touch targets in the first mobile viewport
- **Severity:** Medium
- **Evidence (375 px, in first viewport):**
  - Pair page: breadcrumb links "Can I run it?" 73x20 and "Qwen3.5 4B" 82x20. Workload-table "Details" links 63x20 (x3).
  - `/check`: step indicators "Step 1: Computer" through "Step 5: Priority" 64x18 each. Inline "Sign in" link 38x16. "Detect my computer" 168x32.
  - Global header: "Sign in" 84x36. Logo link 159x32.
- **Recommendation:** Aim for 44–48 px tap height (WCAG 2.2 AA minimum is 24x24 with spacing). Add vertical padding (`py-3` / `min-h-11`) to breadcrumb links and the "Details" links, or make the whole workload row the link target on mobile. If the `/check` step indicators are interactive, raise them to at least 44 px. If they are not, render them as non-interactive.
- **Responsible files:** `components/can-i-run/parts.tsx` (`Breadcrumbs`), `app/can-i-run/[model]/[hardware]/page.tsx` (workload table), `components/advisor/check-flow.tsx` (stepper and inline sign-in), `components/site/header.tsx`.

### V3. `/check` mobile: about 24% of the viewport is fixed chrome, and the Memory field starts hidden
- **Severity:** Low
- **Evidence:** At 375x812 there are three fixed or sticky layers: the sticky header (57 px), the fixed Back/Next bar `components/advisor/check-flow.tsx:133` (69 px, top 679), and the fixed bottom tab bar (65 px, top 747). Together that is 191 px (23.5%) of the viewport. In `screenshots/check/iownchatgpt_com_mobile.png` the "Memory" label is cut by the Next bar and the summary line ("24 GB unified memory · 273 GB/s") shows through behind the translucent tab bar.
- **Recommendation:** Hide the global tab bar during the 5-step quiz (or merge Back/Next into it) to give the form roughly 65 px more room. Make sure the form's bottom padding equals the combined height of both bars so the last field can always scroll fully clear.
- **Responsible files:** `components/advisor/check-flow.tsx` (line 133), `components/site/mobile-tab-bar.tsx`.

### V4. Translucent bottom tab bar lets body text show through
- **Severity:** Low
- **Evidence:** `components/site/mobile-tab-bar.tsx:28` uses `bg-background/90 backdrop-blur-lg`. Text is legible through the bar in all three mobile screenshots: "24 GB unified memory" on /check, "Chat" on the pair page, and "change what I can do with AI on my…" on the blog post. This competes with the tab labels.
- **Recommendation:** Raise opacity to `bg-background/95`–`/100`, or increase blur. This is cosmetic, not an SEO blocker.
- **Responsible file:** `components/site/mobile-tab-bar.tsx`.

### V5. Blog post has no in-article visual and its only CTA is at the end
- **Severity:** Low
- **Evidence:** Blog post desktop and mobile first viewports are text-only: H1, excerpt, byline and tags, then paragraphs. The only conversion link ("Check my computer") sits at 2051 px on desktop and 3102 px on mobile. The header "Start here" button is hidden below `lg`, so mobile visitors see no CTA until the end (apart from the "Check" tab).
- **Recommendation:** Add a hero image (see images.md I4) and a compact inline CTA after the first section ("Check what your computer can run →").
- **Responsible files:** `app/blog/[slug]/page.tsx`, `components/blog/mdx-content*`.

---

## Mobile responsiveness assessment
- **Navigation:** ✅ The mobile header collapses to logo + Sign in. A fixed 5-tab bottom bar (Home, Check, Can I run, Learn, More) is always reachable, and its tabs are large (about 110x65 px).
- **Text:** ✅ 16 px base, and H1s scale well (home H1 wraps over 4 lines, pair H1 over 2 lines with no clipping).
- **Horizontal scroll:** ❌ The pair template overflows (V1). All other sampled templates are clean. The wide workload table on the pair page scrolls correctly inside its own container, so it is not the culprit.
- **Layout stability:** ✅ CLS ≤ 0.0101 on every run. The homepage hero chat mock-up animates text inside a fixed-height box without shifting layout.

## What works
- **Home above the fold is excellent on both viewports:** clear value proposition H1 ("Your own ChatGPT, running on your computer."), one-line benefit copy, a dominant primary CTA (56 px tall, full-width on mobile), a secondary "Start learning" path for beginners, a time-cost reassurance ("The check takes about a minute"), and a trust badge ("Free · no sign-up · 36 models rated").
- **The pair page answers the query instantly:** breadcrumb, a question H1 that matches the title, and a colour-coded "Short answer" card with verdict, quant, speed and headroom, all within the first 385 px on desktop and the first viewport on mobile. This is exactly the content that should rank for "can <hw> run <model>".
- **/check is focused:** a clear "Step 1 of 5" progress bar, one question per screen, and an always-visible Next button on mobile.
- **Blog post typography** is comfortable (18 px body, about 70-character measure on desktop).
- There are no overlapping elements, no text overflow outside V1, and no broken layouts at 1920 px.
