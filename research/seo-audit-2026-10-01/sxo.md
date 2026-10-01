# SXO Findings: iownchatgpt.com (Local AI Advisor)

Agent: seo-sxo. Audit date: 2026-10-01.
**SXO Gap Scores are separate from the SEO Health Score.**

**Data limitations (read first):** No DataForSEO or Google credentials were available. SERP data comes from the WebSearch tool, which returns about 9–10 result titles/URLs per query in its own order. It is **not** a verified Google top-10 and provides **no** PAA, ads, related searches, AI Overview or featured-snippet data. No search volume data was available. User stories and personas below come only from the result titles/URLs and the result summaries. Page types were classified with `seo-sxo/references/page-type-taxonomy.md`. Target pages were fetched with `render_page.py` (raw mode, because the site is SSR and `is_spa=false`).

## Summary

| Query | Best target URL | SERP dominant type (sample) | Verdict | SXO Gap Score |
|---|---|---|---|---|
| can I run llama on 16gb ram | `/can-i-run/llama-3.1-8b` (model hub) | Blog guide / listicle (~7/10) + calculator (1–2) | **MISMATCH: HIGH** | 48 / 100 |
| best local llm for macbook | `/what-runs-on/<mac>` (no Mac-wide page exists) | Listicle by RAM tier, with programmatic per-device competitor pages (llmcheck.net, modelfit.io) | **MISMATCH: HIGH** (no hub, wrong framing) | 45 / 100 |
| run chatgpt locally | `/` or `/learn/first-model` | How-to guide (~8/9), "you can't, but…" framing | **MISMATCH: MEDIUM** | 50 / 100 |

---

## Q1. "can I run llama on 16gb ram"

**SERP sample (WebSearch):** localllm.in VRAM guide (blog), hardware-corner.net Llama hardware requirements (guide), localaimaster.com "AI RAM requirements 2026: 7B, 13B, 70B" (guide), software.reibuys.com "run an LLM on a 16GB RAM laptop" (how-to), visionvix.com "7 best LLMs you can run on 16GB RAM" (listicle), mayhemcode "best models for 12/16 GB VRAM" (listicle), willitrunai.com "What LLM can I run… (calculator + guide)" (tool + guide), a GitHub repo and an NVIDIA forum thread.
**Consensus:** Informational blog guide or listicle about 70% (mixed-to-strong), with tool+guide hybrids at about 10–20%. Results are framed around a **RAM tier** ("16GB"), not a specific device.

**Target page type:** `/can-i-run/llama-3.1-8b` is a data/tool hub (a table of 125 machines). The site has no RAM-tier page. Its 16 GB entries are device-specific (`/what-runs-on/macbook-air-m2-16gb`, `.../geforce-rtx-*-32gb-ram`). No page targets "16 GB RAM" for Windows or Linux PCs. PC entries are named "Desktop PC · GPU · 32/64 GB RAM".

### SXO-1. No RAM-tier pages ("what runs on 16 GB / 8 GB / 32 GB") (High)
- **Evidence:** The sitemap's 125 `/what-runs-on/` slugs are all specific machines (`macbook-air-m1-16gb`, `geforce-rtx-4090-32gb-ram`, …). None is a generic memory tier. The SERP sample is dominated by "<N> GB RAM" guides.
- **Recommendation:** Create about 6 tier pages (`/what-runs-on/8gb`, `16gb`, `24gb`, `32gb`, `64gb`, `128gb`). Each should open with a direct answer ("Yes: Llama 3.1 8B at 4-bit runs on 16 GB; expect ~X tok/s on a Mac, ~Y on a CPU-only PC"), then show an engine table for Mac versus PC GPU versus CPU-only, then link to device pages. This is the guide+tool hybrid the SERP rewards.
- **Source:** new route under `app/what-runs-on/`; data from `data/hardware.ts`.

### SXO-2. The Llama hub buries the 16 GB answer (Medium)
- **Evidence:** `/can-i-run/llama-3.1-8b` opens with "108 of 125 machines… run it acceptably or better" and a 4.92 GB download size, then a per-machine table. A 16 GB user has to scan rows, and the 16 GB Airs show "Borderline" (9–18 tok/s). There is no summary sentence by memory size.
- **Recommendation:** Add a "By memory" summary right after the intro: 8 GB / 16 GB / 24 GB+ → verdict + typical speed. Answer "16 GB" explicitly in the H2 or FAQ.

**Gap analysis (Q1):** Page type 6/15 · Content depth 9/15 · UX 8/15 · Schema 6/15 (FAQPage only, no Dataset or Article) · Media 5/15 (no images or charts on hubs) · Authority 6/15 · Freshness 2/10 (no visible dates) → **48/100**.

---

## Q2. "best local llm for macbook"

**SERP sample:** dev.to "ways to run LLM locally on Mac" (blog), insiderllm.com "Best local LLMs for Mac 2026 — M1 through M5 tested" (listicle), modelfit.io/macbook-pro "9B–70B picks" (programmatic listicle), localchat.app "7 best local LLMs for your Mac" (listicle), llmcheck.net/best-llm/macbook-air-m1-16gb (**programmatic per-device page, direct competitor**), llmcheck.net MacBook Air guide (listicle), llmcheck.net home (tool), llmcheck.net/best-llm/ (hub), modelfit.io "Best LLM for MacBook: 7 ranked by RAM tier" (listicle).
**Consensus:** "Best X" listicle / ranked hub about 75%. Competitors with the **same programmatic model** as this site (llmcheck.net, modelfit.io) rank with **"Best local LLMs for <device> — ranked"** framing and RAM-tier sections.

### SXO-3. /what-runs-on pages answer the right question with the wrong framing, and there is no Mac hub (High)
- **Evidence:** The title is "What LLMs can MacBook Air M2 16 GB run? · Local AI Advisor" and the H1 is "What LLMs can MacBook Air M2 16 GB run?". The page leads with "Best for agentic coding — Nothing in our catalog is usable for this." There is no `/mac` or `/best-local-llm/macbook` hub, and no page mentions "MacBook" at the family level (Air vs Pro by RAM).
- **Recommendation:**
  - Retitle device pages to the ranked-pick framing, e.g. "Best local LLMs for MacBook Air M2 16 GB (ranked, with speeds)", and lead with the top chat pick, not the empty agentic-coding block.
  - Add a family hub such as "Best local LLMs for MacBook (by RAM tier)" that links to device pages. This page type matches the SERP and the competitors.
- **Source:** `app/what-runs-on/[hardware]/page.tsx` (title, section order).

### SXO-4. The 8 GB MacBook verdict ("0 models") contradicts SERP consensus (High)
- **Evidence:** The `/what-runs-on/macbook-air-m1-8gb` meta reads "0 open models run well for chat on the MacBook Air M1 8 GB". The SERP summary for this query recommends Gemma 4 E4B/E2B for 8 GB MacBook Airs, and llmcheck.net ranks a dedicated page for it. A searcher with an 8 GB Air gets a dead end and no next step. See content.md C-3.
- **Recommendation:** Fix the engine reserve (C-3). Until then, show "What you *can* do" content: smallest models, cloud/hybrid options, and what an upgrade would unlock.

**Gap analysis (Q2):** Page type 7/15 · Depth 10/15 · UX 7/15 · Schema 5/15 · Media 4/15 · Authority 6/15 · Freshness 6/10 (the site has 2026 M5/M6 hardware but shows no date) → **45/100**.

---

## Q3. "run chatgpt locally"

**SERP sample:** sunpeak.ai (dev-app guide, different intent), itdaily.com how-to, pcguide.com "You can't run ChatGPT locally, but…", overchat.ai how-to, localalternative.io "Complete beginner's guide 2026", pineido.com setup guide, saaslucid.com step-by-step, lmsa.app "Can you run ChatGPT locally? What's possible", dev.to Docker how-to.
**Consensus:** How-to / beginner guide about 89% (strong). The common answer pattern: "You can't run ChatGPT itself, but you can run open models (and OpenAI's own open-weight gpt-oss) with Ollama/LM Studio in ~3 steps."

### SXO-5. Brand promise matches the query, but no page is the guide the SERP expects (Medium)
- **Evidence:** The domain is *iownchatgpt.com*, and the home H1 is "Your own ChatGPT, running on your computer." The home page is a tool landing page (950 words incl. UI; 439 extracted words), with no step list and no "can you run ChatGPT?" answer. `/learn/first-model` is the closest how-to (421 words, LM Studio/Ollama steps), but its title is "Run your first model · Learn" and the word "ChatGPT" appears nowhere in it. The site rates `gpt-oss-120b` (homepage links `/can-i-run/gpt-oss-120b/mac-studio-m4-max-128gb`) but never says "OpenAI's open-weight gpt-oss is the closest you can get to running ChatGPT locally".
- **Recommendation:** Publish a dedicated guide (e.g. `/learn/run-chatgpt-locally` or a blog cornerstone). It should give the honest answer in the first 50 words, cover gpt-oss-20b/120b with engine ratings by RAM tier, the 3-step LM Studio/Ollama setup, a hardware table, and link `/check`. Add Article/HowTo-style structure (numbered steps; HowTo rich results are deprecated, so use plain lists).
- **Source:** `components/learn/lessons.ts` / `content/blog/`.

**Gap analysis (Q3):** Page type 7/15 · Depth 8/15 · UX 10/15 (clear CTA, 1-minute check) · Schema 4/15 (none on home) · Media 8/15 (animated explainers) · Authority 5/15 · Freshness 8/10 → **50/100**.

---

## User stories (from observed SERP titles/summaries only)
1. As a **16 GB laptop owner**, I want to know if Llama runs on my RAM, because I don't want to download 5–40 GB for nothing, but I'm blocked by guides that talk in VRAM and model sizes I don't understand. *(Signal: "AI RAM Requirements 2026: 7B, 13B, 70B", "How to run an LLM on a 16GB RAM laptop".)*
2. As a **MacBook owner**, I want a ranked shortlist for my exact chip and RAM, because generic lists don't say what's fast on M1 vs M4, but I'm blocked by lists that ignore my RAM tier. *(Signal: "M1 through M5 Tested", "7 ranked by RAM tier", per-device llmcheck pages.)*
3. As an **8 GB MacBook Air owner**, I want to know if anything works at all, but I'm blocked by conflicting answers. *(Signal: "MacBook Air (2026) — M1 to M5, 8–24 GB".)*
4. As a **ChatGPT user worried about privacy or cost**, I want "ChatGPT on my computer", but I'm blocked by learning that ChatGPT itself can't be downloaded. *(Signal: "You can't run ChatGPT locally, but you're not completely out of options", "What's actually possible".)*
5. As a **calculator-seeker**, I want a tool that checks my GPU or Mac instantly. *(Signal: willitrunai.com "Calculator + Guide", llmcheck.net "Compatibility Checker".)*

## Persona scores (Relevance / Clarity / Trust / Action, 25 each), weakest first

| Persona | Page | R | C | T | A | Total | Top fix |
|---|---|---|---|---|---|---|---|
| 8 GB Mac owner | /what-runs-on/macbook-air-m1-8gb | 12 | 10 | 6 | 5 | **33** | Fix the "0 models" verdict; show viable small models and an upgrade path |
| "Run ChatGPT locally" newcomer | / | 15 | 14 | 10 | 20 | **59** | Dedicated guide + gpt-oss answer; About page for trust |
| 16 GB RAM PC user | /can-i-run/llama-3.1-8b | 16 | 12 | 13 | 18 | **59** | RAM-tier summary and pages; plain GPU names |
| MacBook "best LLM" shopper | /what-runs-on/macbook-air-m2-16gb | 19 | 14 | 13 | 18 | **64** | "Best…ranked" framing; lead with the top chat pick |
| Calculator-seeker | /check | 22 | 18 | 14 | 23 | **77** | Add a short explainer and example results; show freshness date |

## Priority actions
1. Fix the 8 GB/16 GB verdict logic (content C-3) because it affects every small-RAM query. **High.**
2. Build RAM-tier pages and a "best local LLMs for MacBook" family hub. **High.**
3. Reframe `/what-runs-on/*` titles and H1s to "Best local LLMs for <device> (ranked)", with the top chat pick first. **High.**
4. Publish a "Can you run ChatGPT locally?" cornerstone guide (gpt-oss angle). **Medium.**
5. Add visible "updated" dates and an About/trust layer (content C-1, C-6). **Medium.**

## What works
- The interactive `/check` quiz and the per-pair "Short answer" are exactly the tool-plus-answer hybrid that calculator competitors (willitrunai, llmcheck) use.
- Copy-paste `ollama run hf.co/...` commands satisfy the "how do I actually run it" follow-up intent on the same page.
- Workload-specific verdicts (chat vs repo coding vs agents vs 64K docs) go deeper than the SERP listicles.

## Limitations
No real Google SERP, PAA, AIO, ads or volume data (no DataForSEO/GSC). WebSearch order is not Google rank. Mobile layout was not rendered for this pass (`--mode never`). No wireframe was requested.
