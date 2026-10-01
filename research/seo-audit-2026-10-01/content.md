# Content Quality & On-Page Findings: iownchatgpt.com (Local AI Advisor)

Agent: seo-content (plus seo-programmatic for the /can-i-run/<model>/<hw> set). Audit date: 2026-10-01.
Method: 29 representative URLs fetched with `render_page.py --mode never` (site is SSR, `is_spa=false`) and parsed with `parse_html.py`. Another 36 random sitemap URLs were fetched for title/description only, at a 1.5–2 s delay. The verdict distribution across all 4,500 model×hardware pairs was computed offline by running the site's own engine (`lib/can-i-run.ts` → `rate()` / `shortAnswer()`) from a script in /tmp, without changing the repo. Working files: `(audit workspace)/cw/`.
Scores are claude-seo heuristics, not Google-internal signals.

## Scores

| Score | Value |
|---|---|
| **Content Quality** | **56 / 100** |
| **On-Page SEO** (titles/meta/headings/internal links) | **62 / 100** |
| AI citation readiness (content view; full GEO in geo.md) | 64 / 100 |
| Programmatic SEO (seo-programmatic) | 54 / 100 |

### E-E-A-T breakdown (internal model; Google publishes no weights)

| Factor | Score | Key signals |
|---|---|---|
| Experience | 8 / 20 | Measured and calibrated benchmarks, plus community speed reports (/community, /speed-test). No first-hand test narrative, screenshots or "we ran this" evidence on answer pages. |
| Expertise | 14 / 25 | /methodology is excellent: 17-step pipeline, ~4.5K words, 76 external source links. No named human expert anywhere. The blog author is an AI ("Ray, Himal's AI assistant"). |
| Authoritativeness | 6 / 25 | No external mentions found for the brand. The domain is still indexed under its previous identity ("I own CHAT GPT" games/blog, see geo.md). "Local AI Advisor" collides with several other tools of almost the same name. |
| Trustworthiness | 12 / 30 | HTTPS, "Never sponsored" footer, open methodology and an honest AI-authorship disclosure. However, the site has no About, Contact, Privacy or Terms page even though it runs AdSense, GA4 and Google sign-in. No visible dates. Engine output contradicts the site's own lessons (see C-3). |
| **Total** | **40 / 100** | "Weak" band. The main gap is Trust and Authority, not writing quality. |

### Readability (approximate Flesch Reading Ease, computed on trafilatura `extracted_text`)

| Page | FRE | Avg sentence length |
|---|---|---|
| / | 82 | 8.1 |
| /learn/what-is-local-ai | 83 | 10.7 |
| /learn/quantization | 78 | 9.3 |
| /learn/first-model | 84 | 8.3 |
| /blog/welcome-to-the-local-ai-advisor-blog | 75 | 12.6 |

`content_quality.py`: filler_score 0 and ai_pattern_score 0 on every page tested. overall_quality ranged from 68 (/learn/what-is-local-ai) to 97 (/methodology).

---

## Findings

### C-1. No About, Contact, Privacy Policy or Terms page while running AdSense, GA4 and Google login (High)
- **Evidence:** `/about`, `/contact`, `/privacy`, `/privacy-policy`, `/terms` and `/authors` all return 404. `/privacy-policy/` 308-redirects to `/privacy-policy`, which is also 404. The footer links only to tools, data pages and `/methodology`. Every sampled page loads `pagead2.googlesyndication.com/...adsbygoogle.js?client=ca-pub-9781380082063087` and `googletagmanager.com/gtag/js?id=G-00RR0835VF`. No route in `app/` mentions "privacy".
- **Why it matters:** Trust carries the most weight in E-E-A-T. The QRG "Who/How/Why" test fails on "Who": the only named person is "Himal", with no link and no bio. A privacy policy is also a requirement for AdSense and for Google sign-in, so this is a compliance issue as well as a ranking one.
- **Recommendation:** Add `/about` covering who runs the site, why it exists, how ratings are made and the funding model (ads, "never sponsored"). Add `/contact` with a real email or form, `/privacy` covering GA4, AdSense, cookies and Google OAuth data, and `/terms`. Link all of them from the footer. Give Himal a short human bio and use it as the reviewer/editor on blog posts.
- **Source:** `app/` (new routes needed); footer in `app/layout.tsx` or its footer component.

### C-2. About a quarter of the 4,500 pair pages are near-duplicate "doesn't fit" pages (High, programmatic)
- **Evidence:** Running the site's engine over all 36 models × 125 machines gives these chat verdicts: excellent 2,426; **does-not-fit 1,101 (24.5%)**; borderline 445; comfortable 327; acceptable 200; technically-runs 1.
  - Two "No" pages share **79% of their 5-word shingles** (Jaccard): `/can-i-run/llama-3.1-8b/macbook-air-m1-8gb` vs `/can-i-run/llama-3.3-70b/macbook-air-m1-8gb`. Only **4–5%** of each page's 5-grams are unique within the sample, and each has about 237 extracted words.
  - Their table is five rows of "Does Not Fit — — — —". The Get-it-running section is suppressed, and "Other models" reads "No catalog model is usable for chat on this machine."
  - On 4 machines (`macbook-air-m1-8gb`, `macbook-air-m2-8gb`, `macbook-air-m3-8gb`, `mac-mini-m2-8gb`) **every one of the 36 models is "doesn't fit"**. That is 144 indexable pages with the same answer, plus 4 `/what-runs-on/` pages titled "0 open models run well…".
  - "Yes" pages fare better: mean Jaccard across all 8 sampled pair pages was 0.31, and per-page uniqueness was 20–36%. That is still at or below the 30–40% differentiation gate.
- **Recommendation:** Consolidate or noindex chat-blocked pairs and drop them from `app/sitemap.ts`. Alternatively, rewrite blocked pages so they add real value: the smallest machine that runs this model, the biggest model this machine runs, and the exact memory gap ("needs 75 GB, you have 8"). For 8 GB machines, fix the engine first (C-3), then decide. Keep "Yes" pages indexable, but add per-pair content such as measured-vs-estimated source, benchmark link and quant trade-off notes.
- **Source:** `app/can-i-run/[model]/[hardware]/page.tsx`, `app/sitemap.ts` (line that emits every `models × HARDWARE` pair), `lib/can-i-run.ts`.

### C-3. Engine verdicts contradict the site's own lessons (High, accuracy and trust)
- **Evidence:**
  - `/learn/first-model` says: *"A 9B model like Qwen3.5 9B (about 6 GB) is a great first try on most computers with 16 GB of memory or more. On 8 GB, start with a 4B model."*
  - The engine disagrees on both points. On `/what-runs-on/macbook-air-m2-16gb`, Qwen3.5 9B sits under "Loads, but not recommended… Expect a frustrating experience". On every 8 GB Mac, Qwen3.5 4B and even Llama 3.2 3B are "Does Not Fit". The blocker text reads: *"Needs ≈5.0 GB but only ≈0.0 GB is available after the OS, other apps and Open WebUI."*
  - `/learn/quantization` says *"Q3 and below: … quality drops, especially for coding and small models"*. Yet `/can-i-run/llama-3.1-8b/macbook-pro-m4-32gb` says *"Best quantization for chat: 3-bit (3.4 GB of weights)… leaving about 16 GB free"*. That page rates the 8B model Excellent at 3-bit on a 32 GB machine. Other 3-bit "best" picks: Gemma 4 E4B on MacBook Air M2 16 GB, GLM-4.6V-Flash on MacBook Air M5 32 GB.
  - Third-party results for "best local llm for macbook" recommend Gemma 4 E4B/E2B for 8 GB MacBook Airs (llmcheck.net, modelfit.io). The site says nothing runs on those machines.
- **Why it matters:** Visible self-contradiction and verdicts that clash with common knowledge are low-quality signals under the QRG. They also cost beginner trust. Many of the target queries are about 8 GB and 16 GB machines.
- **Recommendation:** Review the OS/app memory reserve for 8 GB Apple Silicon (an apparent 0.0 GB available is implausible for 1–4B models). Make lessons and engine agree, either by generating lesson advice from the engine or by recalibrating. Penalize ≤3-bit for small models when headroom allows 4–6-bit.
- **Source:** `lib/can-i-run.ts` / the engine's memory reservation logic; `components/learn/lesson-content.ts` (lesson copy); `data/hardware.ts`.

### C-4. "Too slow" label shown when the real limit is model capability, not speed (Medium)
- **Evidence:** `/can-i-run/llama-3.2-3b/mac-studio-m3-ultra-256gb` gives the short answer *"Yes, excellent for chat; too slow for coding in a repository."* Its table shows "Coding in a repository… Technically Runs… **70–100 tok/s**". The same "too slow" wording appears in meta descriptions sitewide, for example `/can-i-run/llama-3.2-3b/geforce-rtx-3090-32gb-ram` ("too slow for coding… About 170–230 tok/s").
- **Recommendation:** Map `technically-runs` to wording that reflects the actual bottleneck (for example "not capable enough for", or use the engine's blocker reason) instead of always "too slow".
- **Source:** `lib/can-i-run.ts` lines ~103–111: `COMFORT_LABEL_LOWER["technically-runs"] = "too slow"`.

### C-5. Lesson navigation shows "Up next · lesson 0" on every lesson (Medium)
- **Evidence:** Raw HTML of `/learn/what-is-local-ai` contains `Up next · lesson <!-- -->0` followed by "Memory: where the model lives". `/learn/quantization` shows the same "lesson 0".
- **Cause (likely):** `LESSONS.indexOf(next) + 1`. The `next` object is passed across the server→client boundary, so object identity is lost, `indexOf` returns −1, and the result is 0.
- **Recommendation:** Use `LESSONS.findIndex(l => l.slug === next.slug) + 1`.
- **Source:** `components/learn/course-ui.tsx:198`.

### C-6. No visible dates or freshness signals on data pages in a fast-moving topic (Medium)
- **Evidence:** No "updated", "as of" or "last checked" text was found on /methodology, /models, /new-models, /hf/Qwen/Qwen3-8B, any /can-i-run page or the /learn pages. Only the blog post shows a date. The sitemap has `<lastmod>` on 1 of 4,720 URLs. The hardware data does carry `lastVerified: "2026-09-30"` internally (`data/hardware.ts`), so the information exists.
- **Recommendation:** Show "Ratings updated <date> · catalog v<x>" on pair, hub and catalog pages from data `lastVerified`. Emit `dateModified` in JSON-LD and `lastModified` in the sitemap.
- **Source:** `app/can-i-run/[model]/[hardware]/page.tsx`, `app/sitemap.ts`, `data/*.ts`.

### C-7. AI-written blog promises "one or two posts most days" (Medium, scaled-content risk)
- **Evidence:** `/blog/welcome-to-the-local-ai-advisor-blog` (452 words) says: *"One or two short posts most days… Posts are researched and drafted by Ray, an AI assistant working for Himal."* Its JSON-LD gives `"author":{"@type":"Person","name":"Ray, Himal's AI assistant"}`. There is no human reviewer and no link to a person.
- **What works:** The disclosure is honest, there is a "Sources" section, and the hype-free rules are useful. The QRG accepts AI content that shows E-E-A-T.
- **Risk:** Daily AI-drafted posts with no named human editor, on a domain with weak authority, fits the pattern the scaled-content-abuse policy targets.
- **Recommendation:** Name a human editor or reviewer on every post with a bio page, and use them as `author` or `editor` in the schema. Lead posts with something only this site can add, such as engine ratings for each new model on popular machines. Prefer fewer posts with original data over daily volume. Do not label an AI as `Person` in schema; use `Organization` or keep the human as author with an AI-assistance note.
- **Source:** `content/blog/*.mdx`, `lib/blog.ts`, `app/blog/[slug]/page.tsx`.

### C-8. Meta descriptions are too long and share a 110-character boilerplate tail that is false on "No" pages (Medium, on-page)
- **Evidence:** Pair-page descriptions in the 65-URL sample were 142–229 characters, most of them 193–229, so they get truncated. Every pair description ends with *"Engine-rated for chat, coding and agentic workloads, with download commands for Ollama, llama.cpp and LM Studio."* On "doesn't fit" pages (9 of 36 in the random sample) the page has no download commands, because `commands = blocked(...) ? []`. `metadata_template.py` over 65 pairs returned `site_risk: low`, `templated_ratio 0.0`: the descriptions vary, but the tail repeats.
- **Recommendation:** Keep descriptions to about 155 characters: verdict + speed + quant. Drop the stock tail, or only include "download commands" when commands exist. For "No" pages, state the memory gap and the cheapest machine that works.
- **Source:** `app/can-i-run/[model]/[hardware]/page.tsx` → `generateMetadata`.

### C-9. Pair and hardware titles are often too long, and machine names are written in a non-search form (Medium, on-page)
- **Evidence:** 42 of 65 sampled titles were over 60 characters. Examples: *"Can Desktop PC · GeForce RTX 5070 · 32 GB RAM run Qwen3 30B-A3B Instruct 2507? · Local AI Advisor"* (97 characters) and *"Can Ryzen AI Max+ 395 mini PC / Framework Desktop · 64 GB run Gemma 4 E4B?"*. The H1 repeats the same middot string. Users search "RTX 5070", not "Desktop PC · GeForce RTX 5070 · 32 GB RAM".
- **Recommendation:** Use a short search name such as "Can an RTX 5070 (12 GB) run Qwen3 30B-A3B?" and keep the full spec line under the H1. Put the model name first when space is tight. The " · Local AI Advisor" suffix can go on long titles.
- **Source:** `app/can-i-run/[model]/[hardware]/page.tsx` (`title`), `hardware.name` in `data/hardware.ts`; `app/what-runs-on/[hardware]/page.tsx`.

### C-10. No canonical tag on core pages and no Open Graph tags on most pages (Medium, on-page)
- **Evidence:** No `<link rel="canonical">` on `/`, `/check`, `/learn`, every `/learn/*` lesson, `/methodology`, `/models`, `/hardware`, `/compare/models`, `/runtimes` or `/tools`. Pair, hub, `/blog` and `/new-models` pages do have one. `og:*` tags appear only on `/blog/<slug>`, `/hf/...` and `/hugging-face`. Home, lessons, pair pages and methodology have none. The root layout sets `metadataBase` and a title template, but no `openGraph` and no `alternates`.
- **Recommendation:** Add default `openGraph` (siteName, type, image) and `alternates: { canonical: "./" }` to the root metadata, and per-page canonicals in `generateMetadata` for lessons and catalog pages.
- **Source:** `app/layout.tsx` (lines 17–19), `app/learn/[slug]/page.tsx:15-19`, `app/methodology/page.tsx:15`, and other static pages.

### C-11. Short lesson meta descriptions (Low, on-page)
- **Evidence:** `/learn/quantization` has a 64-character description ("How a model gets 3–4× smaller with only a small loss in quality."). `/learn/what-is-local-ai` and `/learn/first-model` are 76 characters each. These are the lesson summary reused.
- **Recommendation:** Write 120–155-character descriptions that include the query wording ("What is quantization (Q4, Q8)? How 4-bit models shrink…").
- **Source:** `components/learn/lessons.ts` (`summary`) → `app/learn/[slug]/page.tsx`.

### C-12. Thin quiz and hub pages are in the sitemap (Low)
- **Evidence:** `/check` has 168 words, an H1 of "What computer do you have?" and no H2. `/hugging-face` has 89 words. `/can-i-run` has 44 extracted words of prose; the rest is links. These are tool pages, so the low counts are acceptable, but `/check` is the primary conversion page and has nothing for a searcher to read before the quiz.
- **Recommendation:** Add a short static explainer below the fold on `/check`: what it asks, how ratings work, 3 example results, and a link to /methodology.
- **Source:** `app/check/page.tsx`.

### C-13. Visual "$$0" stat on the homepage (Low)
- **Evidence:** The home HTML renders `<span>$</span>$0` with the label "Per month", so text extractors read "$$0".
- **Source:** `components/explainers/hero-chat.tsx:99`. Use a non-text icon or `aria-hidden`.

---

## What works
- **Original data asset.** A real engine (memory, KV cache, bandwidth, prefill) produces per-pair numbers such as tok/s, first-reply time, context and quant, with copy-paste `ollama run hf.co/...` commands. This is the "data-driven pages (unique statistics per record)" pattern that seo-programmatic lists as safe.
- **/methodology** is the strongest page on the site: about 5K words, a 17-step pipeline, confidence rules and 76 external citations (llama.cpp scoreboards, vendor specs). Pair pages link to it ("How we calculate") and say whether speeds are "measured", "calibrated" or "bandwidth-based estimates". That transparency is a good trust signal.
- **Answer-first pair pages.** The H1 is the question and the "Short answer" block comes immediately after it, followed by the workload table.
- **Very readable beginner copy:** FRE 75–84, short sentences, analogies ("model is a record, runtime is the record player"), and no filler or AI-cliché phrasing detected.
- **Strong internal linking:** breadcrumbs; pair → model hub / hardware hub / sibling memory configs / cheaper machines; footer hubs; the 10-lesson course is cross-linked.
- **Clean URL design:** `/can-i-run/<model>/<hardware>`, lowercase and hyphenated, with self-canonicals on all programmatic pages.
- **Honest AI-authorship disclosure** and source lists on the blog.

## Programmatic SEO assessment (seo-programmatic)

| Category | Status | Score |
|---|---|---|
| Data quality | Good: sourced specs with `lastVerified`, but 8 GB reserve logic looks wrong (C-3) | 70 |
| Template uniqueness | Warning: "Yes" pages 20–36% unique; "No" pages 4–5% | 40 |
| URL structure | Good | 90 |
| Internal linking | Good: hubs, siblings, breadcrumbs (no BreadcrumbList schema) | 80 |
| Thin content risk | Fail: 1,101 blocked pairs; 144 pages where everything is blocked | 35 |
| Index management | Fail: all 4,500 pairs in the sitemap, no lastmod, no noindex gating; most pairs "render on first visit" (sitemap.ts comment) | 30 |
| **Overall** | | **54** |

Quality gate: 4,500 pages exceeds the 500-page hard-stop threshold for publishing without justification. The engine-derived data is that justification for "Yes" pairs, but not for blocked pairs.

## Limitations
- Readability is approximate (custom syllable heuristic, not textstat).
- Uniqueness was measured on 8 pair pages plus metadata for 36 more, not all 4,500. The verdict distribution covers all 4,500 (computed from source).
- No Search Console data, so indexed versus submitted counts are unknown.
- Hardware/model accuracy was not independently benchmarked. C-3 is based on internal contradictions plus third-party guidance, not on our own measurements.
