# Agent Readiness (seo-agentic) — https://iownchatgpt.com

Checked: 2026-10-01 (UTC). Vendor/standards facts from the skill's vendor matrix, last checked 2026-09-23 (within 60 days).
Raw evidence: `(audit workspace)/raw/agentic/` (`ac_home.json`, `ux_home.json`, `ux_check.json`, `lhl_home_mobile.json`, `lhl_home_desktop.json`, `lhl_check_mobile.json`).

## Summary

| Measure | Result |
|---|---|
| Lighthouse Agentic Browsing, home, mobile | **2/2** (Lighthouse 13.5.0, local run, HeadlessChrome 153) |
| Lighthouse Agentic Browsing, home, desktop | **2/2** (Lighthouse 13.5.0) |
| Lighthouse Agentic Browsing, /check, mobile | **2/2** (Lighthouse 13.5.0) |
| Agent-UX heuristic (separate local 0-100 heuristic) | home 100 (complete), /check 100 (complete) |
| P0 failures | 1 partial (Hostinger CDN 429s for the GPTBot user agent, unverified traffic) |
| **AI Search Readiness, agentic part** | **72/100** |

PageSpeed Insights could not be used (HTTP 429, the shared anonymous daily quota was used up), so the fraction comes from a local `npx lighthouse@latest --only-categories=agentic-browsing` run that `lighthouse_agentic.py --from-json` parsed.

What limits agents most today: there is no discovery layer (no llms.txt, Markdown, or Content-Signal), and Hostinger's edge throttled requests sent with the GPTBot user agent while it let every other agent through.

## Lighthouse Agentic Browsing (13.5.0)

| Audit | Home mobile | Home desktop | /check mobile |
|---|---|---|---|
| agent-accessibility-tree | pass (0 failed axe rules) | pass | pass |
| cumulative-layout-shift | pass (0) | pass (0.001) | pass (0.032) |
| llms-txt | N/A (404) | N/A | N/A |
| ard-schema | N/A (no ai-catalog.json) | N/A | N/A |
| webmcp-form-coverage | N/A (no forms) | N/A | N/A |
| webmcp-schema-validity | N/A (no tools) | N/A | N/A |
| webmcp-registered-tools | informative (0 tools) | informative | informative |

You can add a counted audit in two ways. Both are optional, not goals.
- `llms-txt`: serve a valid `/llms.txt`. This adds one counted audit; a valid file makes the result 3/3.
- `ard-schema`: publish `/.well-known/ai-catalog.json` only if you have agent resources to list. You don't have any today, so this does not apply.

## What works (verified)

- **Server-rendered content.** The home page has 1,019 words without JS, and nothing marks it as a JS shell (`server-rendered` pass).
- **The /check quiz is deep-linkable and server-rendered.** For example, `/check?hw=mbp-m4-pro-20c-24&uc=coding-repo` returns about 1,950 words of results in raw HTML, including "Our pick for interactive coding: Qwen3.5 9B … 9 will run well enough…". That makes it reachable by agents that don't click. The response is `cache-control: private, no-store`.
- **Accessibility tree is clean.** Home has 74 interactive nodes and 0 unnamed; /check has 43 interactive nodes and 0 unnamed. Neither page uses div-onclick widgets or unlabelled inputs. The quiz uses real `<button>`s (21 on /check).
- **Layout is stable.** CLS is 0 to 0.032 on every run.
- **robots.txt is reachable** (200, `text/plain`), allows everything, and lists the sitemap (4,720 URLs).
- **Unknown URLs return a real 404** (no catch-all 200, `http-404` pass). llms-txt and ard-schema therefore report N/A instead of failing.
- **Private data is protected by authentication, not robots.txt.** Without a session, `/api/me/rigs` returns `{"rigs":[]}`, `/api/me/alerts` returns `{"unread":0}`, and `/api/auth/session` returns `null`. `/me` is `noindex` (`app/me/page.tsx:22`).
- **RSS is advertised** with `<link rel="alternate" type="application/rss+xml">` on `/blog`.
- The WAF matrix from `agentic_check.py --ua-matrix` (one request per UA): browser, GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot and Perplexity-User all got 200 with identical bytes (137,199) and no challenge. Follow-up tests are below.

## Findings by priority

### P0-partial — Hostinger CDN (hcdn) returns 429 to the GPTBot user agent while other agents get 200
- **Severity:** High (P0 item "WAF lets verified bots through"). It is only partly verified because the test traffic was unverified.
- **Evidence:** After the first matrix pass returned 200, a later spot-check with the GPTBot UA got `HTTP/2 429` with an empty body (`server: hcdn`, `platform: hostinger`, `content-length: 0`) on `/check`, `/can-i-run/qwen3.8-27b/macbook-air-m1-16gb`, `/robots.txt` and `/sitemap.xml`. In a later 15-request burst on `/learn/speed`, the browser UA got 15×200, ClaudeBot got 15×200 and GPTBot got 15×429. In a 2-minute interleaved test (6 rounds, 20 s apart, `/models`), GPTBot got 429 every time while OAI-SearchBot and the browser got 200 every time (18:52–18:54 UTC). The blocking came and went: a run before that gave GPTBot 8×200.
- **Caveat:** These requests came from a residential IP, not OpenAI's published GPTBot ranges. This shows how the edge treats *unverified* GPTBot-UA traffic, not proof that real GPTBot is blocked. It does show the edge applies a separate, stricter rate limit to the GPTBot token. If the same limit applies to real GPTBot bursts, `/robots.txt` and `/sitemap.xml` also return 429. Crawlers often treat an unreachable robots.txt as "temporarily disallow all".
- **Recommendation:** In hPanel, check the CDN / security settings for bot or AI-crawler protection and rate limiting. Either allow verified OpenAI crawlers (OpenAI publishes GPTBot IP ranges) or remove the per-UA limit. Decide whether you want GPTBot (training) at all. If you don't, say so in robots.txt (below) instead of using an edge 429. Confirm the fix in Hostinger access logs: look for 429s on requests whose UA contains `GPTBot` and whose IPs are in OpenAI's ranges. Then rerun `agentic_check.py https://iownchatgpt.com/ --ua-matrix --json` a few times.
- **Responsible:** Hostinger hPanel CDN settings (outside the repo).

### P0-info — robots.txt has no deliberate per-purpose AI policy
- **Severity:** Medium. The check reports it as info, not a failure, because everything is allowed.
- **Evidence:** `robots.txt` is `User-Agent: * / Allow: /` with a single group (`robots-ai-groups`: `named_groups: []`). All 13 tracked AI tokens fall through to `*`.
- **Recommendation:** If a single policy for all agents is intentional, keep one group and add a Content-Signal line (next finding). Add named groups only if your policy differs by purpose.
- **Responsible:** `/mnt/ssd/Projects/Folderbyiphone/app/robots.ts`

### P1 — No Content-Signal preference
- **Severity:** Low–Medium.
- **Evidence:** The `content-signal` check found no lines.
- **Recommendation:** Next.js 16.3 supports non-standard per-rule directives through `other` (see `node_modules/next/dist/docs/.../01-metadata/robots.md`, "Non-standard directives", v16.3.0). Draft below. **You need to choose `ai-train`; this audit doesn't choose for you.**
  ```ts
  // app/robots.ts
  import type { MetadataRoute } from "next";

  export default function robots(): MetadataRoute.Robots {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        other: { "Content-Signal": "search=yes, ai-input=yes, ai-train=no" }, // or ai-train=yes — owner's decision
      },
      sitemap: "https://iownchatgpt.com/sitemap.xml",
    };
  }
  ```
  Status: Content-Signal is a Cloudflare CC0 policy. Its IETF individual draft expired on 2026-04-04, and Google has made no statement on it (checked 2026-09-23). It states a preference and enforces nothing. It does not affect Google Search.
- **Responsible:** `app/robots.ts`

### P1 — No /llms.txt (and no /llms-full.txt)
- **Severity:** Medium (it is the only change that adds a counted Lighthouse audit).
- **Evidence:** `/llms.txt` returns 404 `text/html`, and so does `/llms-full.txt`. Lighthouse marks it N/A. The `(temp file)` artifact in the audit folder is the site's HTML 404 page, not a real file.
- **Recommendation:** Add `public/llms.txt`, or `app/llms.txt/route.ts` if you want to generate it from `data/` and `content/blog`. Lighthouse requires an H1, at least one Markdown link and 50+ characters. Draft (every URL below returned 200 during this audit):
  ```markdown
  # Local AI Advisor

  > Free, beginner-friendly advisor that tells you which open-weight AI models (Qwen, Llama, Gemma, Mistral, DeepSeek, gpt-oss and more) will run comfortably on your own Mac, PC, GPU or AI mini PC — for chat, coding and agent workloads — not just which ones technically fit.

  Estimates come from a documented evaluation pipeline (memory, bandwidth, context, comfort levels) calibrated with verified benchmarks and community speed reports. See the methodology before quoting numbers.

  ## Tools
  - [Check my computer](https://iownchatgpt.com/check): 5-step quiz → models rated for your hardware and workload. Results are deep-linkable: `/check?hw=<hardware-id>&uc=<use-case>` (e.g. `/check?hw=mbp-m4-pro-20c-24&uc=coding-repo`). Use-case ids: casual-chat, general-assistant, coding-questions, coding-repo, agentic-coding, reasoning, research, document-analysis, long-doc-qa, writing, vision, data-analysis, rag, api-server, multi-agent, background-automation. Hardware ids appear in the "Check" links on /what-runs-on/<hardware> pages.
  - [Can I run it?](https://iownchatgpt.com/can-i-run): answer pages for every model × hardware pair, at /can-i-run/<model>/<hardware> (e.g. https://iownchatgpt.com/can-i-run/qwen3.8-27b/macbook-air-m1-16gb)
  - [What runs on my computer](https://iownchatgpt.com/what-runs-on/macbook-air-m1-16gb): per-hardware model lists
  - [What hardware do I need?](https://iownchatgpt.com/hardware-for-model): pick a model and workload, see which computers are comfortable
  - [Compare models](https://iownchatgpt.com/compare/models) and [compare hardware](https://iownchatgpt.com/compare/hardware)
  - [Check any Hugging Face model](https://iownchatgpt.com/hugging-face)
  - [Build my local AI stack](https://iownchatgpt.com/stack): hardware → runtime → model → API → tool
  - [Browser speed test](https://iownchatgpt.com/speed-test): measures GPU memory bandwidth in the browser

  ## Catalogs
  - [Models](https://iownchatgpt.com/models): parameters, MoE vs dense, context, vision, tool calling, 4-bit size, license
  - [Hardware](https://iownchatgpt.com/hardware): usable memory, bandwidth, compute, OS support
  - [Runtimes](https://iownchatgpt.com/runtimes): Ollama, llama.cpp, LM Studio, MLX-LM, vLLM
  - [AI tools](https://iownchatgpt.com/tools): Claude Code, Codex CLI, OpenCode, Cline, Continue, Open WebUI
  - [New models](https://iownchatgpt.com/new-models): latest open releases rated for common machines (RSS: https://iownchatgpt.com/rss.xml)
  - [Community speed reports](https://iownchatgpt.com/community): measured tokens/second

  ## Learn
  - [What is local AI?](https://iownchatgpt.com/learn/what-is-local-ai)
  - [Memory](https://iownchatgpt.com/learn/memory)
  - [Model size](https://iownchatgpt.com/learn/model-size)
  - [Quantization](https://iownchatgpt.com/learn/quantization)
  - [Why "it fits" isn't enough](https://iownchatgpt.com/learn/fits-vs-fast)
  - [Context](https://iownchatgpt.com/learn/context)
  - [Speed: tokens per second](https://iownchatgpt.com/learn/speed)
  - [Chat vs. coding agents](https://iownchatgpt.com/learn/chat-vs-agents)
  - [File formats & GPU software](https://iownchatgpt.com/learn/formats)
  - [Run your first model](https://iownchatgpt.com/learn/first-model)

  ## About
  - [Methodology](https://iownchatgpt.com/methodology): the 17-step evaluation pipeline, comfort levels and confidence rules

  ## Optional
  - [Blog](https://iownchatgpt.com/blog)
  - [Sitemap](https://iownchatgpt.com/sitemap.xml)
  ```
  llms.txt is a community spec (llmstxt.org). Lighthouse checks it; Google Search ignores it. No primary source confirms that any named consumer agent reads it.
- **Confirm:** rerun Lighthouse. The `llms-txt` audit should pass and the fraction should be 3/3.
- **Responsible:** `public/llms.txt` (new), or `app/llms.txt/route.ts`

### P1 — No Markdown delivery
- **Severity:** Low (an opportunity, not a defect).
- **Evidence:** `Accept: text/markdown` on `/` returns `text/html`. `/index.md` and `/blog.md` return 404. The page has no `rel="alternate" type="text/markdown"`. Correction to the script output: `agentic_check.py` reported `vary_accept: true`, but the real headers are `vary: Accept-Encoding` plus `vary: rsc, next-router-state-tree, …`. There is no `Vary: Accept`, so that flag is a substring false positive.
- **Recommendation:** Optional. Blog posts are MDX in `content/blog/`, so start there: add a `app/blog/[slug].md/route.ts`-style handler (or `/blog/<slug>/index.md`) that returns the MDX source as `text/markdown; charset=utf-8`, plus `alternates.types["text/markdown"]` in the post metadata. Next 16 renamed `middleware` to `proxy` (`proxy.ts`), so any `Accept` negotiation must go in `proxy.ts` and set `Vary: Accept`. No consumer agent is confirmed to request Markdown (checked 2026-09-23).
- **Responsible:** `app/blog/[slug]/page.tsx`, a new route handler, an optional `proxy.ts`

### P2 — WebMCP: none (opportunity for /check)
- **Severity:** Low (informational).
- **Evidence:** 0 `registerTool` call sites across 8 same-origin scripts, no `document.modelContext` or `navigator.modelContext`, 0 `<form>` elements. Lighthouse `webmcp-registered-tools` lists 0 tools.
- **Recommendation:** Optional. /check is a read-only recommender with no purchases, sends or deletes, so it is a low-risk candidate. One imperative tool on `document.modelContext` (for example `recommend_models({hw, uc})`) that calls the same `decodeState` and recommendation code the UI uses, or that just navigates to `/check?hw=…&uc=…`. The deep-link URL already covers most of the agent value. Status: W3C Community Group draft, not a standard. WebKit opposes it, Mozilla is neutral, and the Chrome origin trial runs M149–M156. Only ChatGPT desktop calls tools by default (checked 2026-09-23).
- **Responsible:** `components/advisor/check-flow.tsx`

### P3 — Hardware ids in /check differ from public hardware slugs
- **Severity:** Low.
- **Evidence:** Answer pages use slugs like `macbook-air-m1-16gb`, but `/check` needs internal ids like `mbp-m4-pro-20c-24` (`lib/share.ts` `decodeState`: `HARDWARE_MAP.has(hw)`). `/check?hw=macbook-air-m1-16gb&uc=casual-chat` silently drops the hardware and renders Step 1 with the MacBook Pro M4 Pro 24 GB default (`check-flow.tsx:39`). It returns 611 words, the same as an empty /check. An agent that builds the URL from a visible slug gets the wrong machine with no error.
- **Recommendation:** Accept the public slug as an alias in `decodeState` (map with `hardwareSlug`), or document the ids in llms.txt (the draft above does).
- **Responsible:** `lib/share.ts`

### Not applicable (no action)
`/.well-known/ai-catalog.json`, `api-catalog`, `oauth-protected-resource`, `oauth-authorization-server`, `agent-card.json` and `ucp` all return 404. That is correct for a site with no public API, MCP server, A2A agent or commerce. `/.well-known/security.txt` also returns 404 (optional hygiene).

### Not checked
Manual review of confirmation states, hover-only menus and focus traps was not done; no script covers it. Real-agent IP-verified access was not tested.

## Access policy (each purpose separately)

- **Training (GPTBot, ClaudeBot, CCBot, Google-Extended, Applebot-Extended):** robots.txt allows them through `*`, and there is no Content-Signal. At the edge, the GPTBot UA was rate-limited with 429s that came and went (unverified traffic); ClaudeBot and CCBot got 200.
- **Search (OAI-SearchBot, Claude-SearchBot, PerplexityBot):** allowed through `*` and got 200 in every test.
- **User-triggered (ChatGPT-User, Claude-User, Perplexity-User, Google-Agent):** allowed through `*` and got 200 in every test. Private data is behind auth, so robots.txt is not relied on.

## Standards status (checked 2026-09-23)

| Item | Status |
|---|---|
| WebMCP | W3C CG draft; Chrome origin trial M149–M156; WebKit opposes, Mozilla neutral |
| Content-Signal | Cloudflare CC0 policy; IETF individual draft expired 2026-04-04; no Google statement |
| llms.txt | Community spec; Lighthouse 13.5 audits it; Google Search ignores it |
| ai-catalog.json (ARD) | ARD spec 1.0; Lighthouse `ard-schema` checks it |
| Web Bot Auth | `draft-ietf-webbotauth-httpsig-protocol-00` (2026-09-01) |

## Score rationale: 72/100 (agentic part)

The strong foundation (Lighthouse 2/2 on every run, Agent-UX 100/100 on both pages, SSR, correct 404, deep-linkable server-rendered results, auth-protected private data) earns about 75 of 80 foundation points. Deductions: the GPTBot edge throttling (-8), and the missing llms.txt, Content-Signal, Markdown and per-purpose policy (about 15 of 20 discovery points lost, with about 5 credited for sitemap and RSS). WebMCP, ai-catalog and Markdown are opportunities, so their absence costs little. None of these items promises ranking, citation or traffic gains.

## Structured findings (audit-data.json, category "AI Search Readiness")

```json
[
  {"title":"Hostinger CDN returns 429 to GPTBot user agent (other agents 200)","severity":"high","description":"Unverified GPTBot-UA requests got persistent/intermittent HTTP 429 (server: hcdn) incl. /robots.txt and /sitemap.xml while OAI-SearchBot, ClaudeBot and browser got 200.","recommendation":"Review hPanel CDN bot/AI-crawler rate limiting; allow verified OpenAI IPs or state policy in robots.txt; confirm in access logs."},
  {"title":"No /llms.txt","severity":"medium","description":"/llms.txt and /llms-full.txt return 404; Lighthouse llms-txt N/A.","recommendation":"Add public/llms.txt (draft in agentic.md); fraction becomes 3/3."},
  {"title":"No Content-Signal / per-purpose AI policy in robots.txt","severity":"low","description":"Single '*' group, no Content-Signal line.","recommendation":"Add other: {'Content-Signal': 'search=yes, ai-input=yes, ai-train=<owner choice>'} in app/robots.ts."},
  {"title":"No Markdown delivery","severity":"low","description":"Accept: text/markdown returns HTML; no .md siblings or alternates.","recommendation":"Optional: serve blog MDX source as text/markdown with alternates link."},
  {"title":"/check ignores public hardware slugs","severity":"low","description":"/check?hw=macbook-air-m1-16gb silently falls back to default hardware at step 1.","recommendation":"Accept hardware slugs as aliases in lib/share.ts decodeState or document ids."},
  {"title":"No WebMCP tools","severity":"info","description":"0 registered tools, 0 forms.","recommendation":"Optional read-only recommend_models tool on /check."}
]
```
