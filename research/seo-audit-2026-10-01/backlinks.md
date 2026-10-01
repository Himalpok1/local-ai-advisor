# Backlink / Authority Check (seo-backlinks, Tier 0) — iownchatgpt.com

Checked: 2026-10-01. Raw data: `(audit workspace)/raw/agentic/cc.json`, `bauth.json`, `report_data.json`.

## Data limits (read first)

- **Tier 0 only.** `backlinks_auth.py --check` found no keys for Moz, Bing Webmaster, Keywords Everywhere or DataForSEO. That leaves only the Common Crawl web graph and the verification crawler.
- No list of known backlinks was provided, so `verify_backlinks.py` had nothing to verify.
- So this audit has **no data** on referring-domain count, domain quality distribution, anchor text, toxic ratio, link velocity, follow/nofollow or geography. That is 0 of the 7 scoring factors.
- **Backlink Health Score: INSUFFICIENT DATA.** No numeric score is given, because a number would mislead.
- `validate_backlink_report.py` returned PASS, with one info note: absence from Common Crawl must not be read as "low authority".

## Metrics

| Metric | Value | Source (confidence) |
|---|---|---|
| In Common Crawl host/domain web graph | No (`in_crawl: false`, `in_rankings: false`) | Common Crawl graph release `cc-main-2026-jan-feb-mar` (0.50, domain-level; graphs are quarterly, so freshness is approximate) |
| PageRank / harmonic centrality | null (not in graph) | Common Crawl (0.50) |
| Pages in the CC URL index | 0 captures for `iownchatgpt.com/*` in CC-MAIN-2026-39, -34 and -30 | Common Crawl CDX index (0.95 for "not captured") |
| Domain registered | 2023-02-01; last changed 2026-02-18 | Verisign RDAP (0.95) |
| Homepage outbound `<a>` links to other domains | 0 (only script/preload hrefs for Google Ads and GA) | Parsed raw HTML (0.95) |

## Findings

### No measurable third-party authority footprint (free sources)
- **Severity:** High (data gap), not a confirmed defect.
- **Evidence:** The domain is not in the Q1 2026 Common Crawl web graph, and none of the three most recent CC crawls (2026-30, -34, -39) captured any URL. The site has 4,720 sitemap URLs (per the audit's sitemap.xml). CommonCrawl's crawler (CCBot UA) got 200 in this audit's tests, so robots.txt and the WAF are not blocking it (robots.txt allows all).
- **Interpretation (inference, flagged as such):** The domain likely has few or no inbound links that Common Crawl discovers. CC prioritises crawling by link graph, so a site that few others link to is often skipped. This is consistent with a young site. It does not prove there are zero backlinks.
- **Recommendation:**
  1. Get real data for free: verify the site in **Bing Webmaster Tools** (gives an inbound-links report and an API key for `bing_webmaster.py`) and **Google Search Console** (Links report). A free **Moz API** key (2,500 rows/month) would add DA/PA, spam score and referring domains. Then rerun `/seo backlinks iownchatgpt.com`.
  2. Earn first links with assets that are naturally linkable: the per-model × per-hardware answer pages, `/methodology`, `/community` speed reports and the `/speed-test` tool. Places to share them include r/LocalLLaMA, the Hugging Face model-card community tabs, Ollama/LM Studio/llama.cpp discussion boards, and Hacker News "Show HN".
  3. After links exist, check that CCBot can reach the site in a future crawl (CC index lookup: `https://index.commoncrawl.org/CC-MAIN-<latest>-index?url=iownchatgpt.com/*&output=json`).
- **Responsible:** off-site / Search Console / Bing Webmaster (no repo file).

## What works
- CCBot and other crawlers are not blocked: robots.txt allows everything, and the CCBot UA got 200 on `/check`, `/can-i-run/...`, `/robots.txt`, `/sitemap.xml` and `/blog`.
- No toxic or spam signals could be detected, but with no link data this is "no evidence", not a clean bill of health.

## Structured findings (audit-data.json, category "Backlink Profile")

```json
[
  {"title":"Backlink profile not measurable with free sources","severity":"high","description":"Tier 0 only (no Moz/Bing/DataForSEO keys). Domain absent from Common Crawl web graph (cc-main-2026-jan-feb-mar) and from CC-MAIN-2026-30/34/39 URL indexes. Backlink Health Score: INSUFFICIENT DATA.","recommendation":"Verify Bing Webmaster Tools + Google Search Console, add free Moz API key, rerun backlinks audit; build first links from answer pages, methodology and speed-test via LocalLLaMA/HF/HN communities."}
]
```
