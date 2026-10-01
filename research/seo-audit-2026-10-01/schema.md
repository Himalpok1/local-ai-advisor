# Schema / Structured Data: iownchatgpt.com (Local AI Advisor)

Audit date: 2026-10-01. Agent: seo-schema (skill seo-schema v2.4.1, schema-types reference updated 2026-09-23).
Method: raw server HTML fetched for 20 representative URLs across every template (1 req/s), JSON-LD extracted and parsed. Googlebot UA spot-check on `/` gave the same `<head>` output, so all structured data is server-rendered (no client-side injection). Source read at `/mnt/ssd/Projects/Folderbyiphone` (read-only).

## Schema Score: 38 / 100

| Component | Weight | Score | Notes |
|---|---|---|---|
| Validity of existing blocks | 25 | 23 | All 5 blocks found parse as JSON, use `https://schema.org`, absolute URLs, ISO dates. No microdata or RDFa. |
| Coverage of key entities (Organization / WebSite) | 20 | 0 | No Organization or WebSite markup anywhere. |
| Template coverage (Breadcrumb, Article, tool types) | 30 | 8 | Only `/blog/<slug>` has a rich-result-eligible type. 4,500+ pages show visible breadcrumbs but have no BreadcrumbList. |
| Rich-result eligibility | 15 | 4 | FAQPage on about 4,660 URLs gets no Google rich result (retired 2026-05-07). BlogPosting is eligible but has a weak `author`. |
| Entity linking (@id graph, publisher reuse) | 10 | 3 | No `@id` graph. The publisher Organization is inlined on the blog post only. |

## Detection results (per template)

| Template (sample URL) | JSON-LD | Types | Valid JSON | Status |
|---|---|---|---|---|
| Home `/` | none | (none) | n/a | ❌ Missing Organization, WebSite, WebApplication |
| Quiz `/check` | none | (none) | n/a | ❌ Missing WebApplication, BreadcrumbList |
| Hub `/can-i-run` | none | (none) | n/a | ⚠️ Missing BreadcrumbList / CollectionPage |
| Model `/can-i-run/qwen3.6-27b` | 1 | FAQPage > Question > Answer (1 Q) | ✅ | ⚠️ No rich result. Visible breadcrumbs but no BreadcrumbList |
| Pair `/can-i-run/qwen3.6-27b/macbook-air-m1-16gb`, `/can-i-run/qwen3.5-4b/macbook-air-m4-16gb` | 1 | FAQPage (1 Q) | ✅ | ⚠️ Same as above (about 4,500 URLs) |
| Hardware `/what-runs-on/macbook-air-m1-16gb` | 1 | FAQPage (1 Q) | ✅ | ⚠️ Same as above (125 URLs) |
| `/learn` | none | (none) | n/a | ❌ Missing Course |
| Lesson `/learn/what-is-local-ai` | none | (none) | n/a | ❌ Missing Article/LearningResource and BreadcrumbList |
| `/blog` | none | (none) | n/a | ⚠️ Missing Blog |
| Post `/blog/welcome-to-the-local-ai-advisor-blog` | 1 | BlogPosting, Person, Organization, ImageObject, WebPage | ✅ | ⚠️ Valid. Author and date recommendations below |
| `/new-models`, `/models`, `/hardware`, `/methodology`, `/tools`, `/compare/models`, `/speed-test`, `/hugging-face`, `/hf/Qwen/Qwen3-0.6B` | none | (none) | n/a | ⚠️ Missing BreadcrumbList / WebApplication where relevant |

Microdata (`itemscope`): 0 on all samples. RDFa (`typeof`): 0 on all samples.

## Validation of existing blocks

| Block | Template | @context | Required props | URLs absolute | Dates ISO 8601 | Result |
|---|---|---|---|---|---|---|
| BlogPosting | /blog/<slug> | ✅ https | ✅ headline, image, datePublished, author.name | ✅ | ✅ (date only, `2026-10-01`) | ✅ Pass, with warnings |
| FAQPage | /can-i-run/<m>, /can-i-run/<m>/<hw>, /what-runs-on/<hw> | ✅ https | ✅ mainEntity > Question.name > acceptedAnswer.text | n/a | n/a | ✅ Valid syntax. ℹ️ No Google rich result |

The FAQ answer text matches the visible "Short answer" card and the H1 question (checked on the pair page). This is good practice and does not count as hidden content.

---

## Findings

### S1. No Organization or WebSite entity anywhere (homepage has zero JSON-LD)
- **Severity:** High
- **Evidence:** `https://iownchatgpt.com/` has 0 `application/ld+json` blocks (raw HTML and Googlebot UA). The publisher Organization is only inlined inside the BlogPosting on `/blog/welcome-to-the-local-ai-advisor-blog`.
- **Impact:** Google has no explicit site-name or entity signal for "Local AI Advisor" on iownchatgpt.com. WebSite `name` and `alternateName` feed Google's site-name system, which matters here because the domain ("iownchatgpt") differs from the brand ("Local AI Advisor"). There is also no logo entity to reuse.
- **Recommendation:** Add an `@graph` with WebSite + Organization on the homepage. Reference the Organization `@id` from every other block (for example BlogPosting.publisher). Do not add `SearchAction`: it has no sitelinks search box benefit, and the site has no `/search` endpoint. Only add `sameAs` once real social or GitHub profiles exist. None are linked from the footer today, so no values are invented below.
- **Responsible file:** `app/page.tsx` (render the `<script>` there; the homepage has no `metadata` export and relies on `app/layout.tsx`). Better: a shared `components/seo/json-ld.tsx` helper that reuses the existing `.replace(/</g, "\\u003c")` escaping pattern from `components/can-i-run/parts.tsx`.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://iownchatgpt.com/#organization",
      "name": "Local AI Advisor",
      "url": "https://iownchatgpt.com/",
      "logo": {
        "@type": "ImageObject",
        "@id": "https://iownchatgpt.com/#logo",
        "url": "https://iownchatgpt.com/brand/logo-mark-512.png",
        "width": 512,
        "height": 512
      },
      "description": "Free tool that tells beginners which local AI models will run comfortably on their own computer, not just which ones technically fit."
    },
    {
      "@type": "WebSite",
      "@id": "https://iownchatgpt.com/#website",
      "name": "Local AI Advisor",
      "alternateName": "iownchatgpt.com",
      "url": "https://iownchatgpt.com/",
      "inLanguage": "en",
      "publisher": { "@id": "https://iownchatgpt.com/#organization" }
    },
    {
      "@type": "WebApplication",
      "@id": "https://iownchatgpt.com/#app",
      "name": "Local AI Advisor",
      "url": "https://iownchatgpt.com/check",
      "applicationCategory": "UtilitiesApplication",
      "operatingSystem": "Any (web browser)",
      "browserRequirements": "Requires JavaScript",
      "isAccessibleForFree": true,
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "featureList": [
        "Rates 36 open-weight LLMs on 125 computers",
        "Comfort rating for chat, coding and agentic workloads",
        "Estimated tokens per second and memory headroom",
        "Copy-paste run commands for Ollama, llama.cpp and LM Studio"
      ],
      "publisher": { "@id": "https://iownchatgpt.com/#organization" }
    }
  ]
}
```
Note: the "36 models / 125 computers" figures come from the live footer text ("36 models, 125 computers"). Generate them from `MODELS.length` / `HARDWARE.length` rather than hard-coding. WebApplication is not eligible for the Software App rich result without `aggregateRating` or `review`. Do not fabricate ratings. The markup is still valid entity data.

### S2. Visible breadcrumbs on about 4,660 programmatic pages have no BreadcrumbList
- **Severity:** High (largest single structured-data gain by URL count)
- **Evidence:** `/can-i-run/qwen3.5-4b/macbook-air-m4-16gb` renders `<nav aria-label="Breadcrumb">` with "Can I run it? > Qwen3.5 4B > MacBook Air M4 16 GB" (seen in the desktop screenshot). The only JSON-LD on the page is FAQPage. Same on `/can-i-run/<model>` and `/what-runs-on/<hw>`. The sitemap lists 4,537 `/can-i-run*` URLs and 125 `/what-runs-on/*` URLs.
- **Recommendation:** Emit BreadcrumbList from the same `items` array that the `Breadcrumbs` component already receives, so it can never drift from the visible trail. Prepend Home. The last item may omit `item` (the current page).
- **Responsible file:** `components/can-i-run/parts.tsx` (`Breadcrumbs`). Add JSON-LD output there or as a sibling `BreadcrumbJsonLd`. Callers: `app/can-i-run/[model]/[hardware]/page.tsx` (line ~92), `app/can-i-run/[model]/page.tsx`, `app/what-runs-on/[hardware]/page.tsx`.

```tsx
// components/can-i-run/parts.tsx: alongside Breadcrumbs
const SITE = "https://iownchatgpt.com";
export function BreadcrumbJsonLd({ items }: { items: { href?: string; label: string }[] }) {
  const all = [{ href: "/", label: "Home" }, ...items];
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.label,
      ...(it.href ? { item: `${SITE}${it.href}` } : {}),
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
```
Rendered output for the sampled pair page:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://iownchatgpt.com/" },
    { "@type": "ListItem", "position": 2, "name": "Can I run it?", "item": "https://iownchatgpt.com/can-i-run" },
    { "@type": "ListItem", "position": 3, "name": "Qwen3.5 4B", "item": "https://iownchatgpt.com/can-i-run/qwen3.5-4b" },
    { "@type": "ListItem", "position": 4, "name": "MacBook Air M4 16 GB" }
  ]
}
```
Also add BreadcrumbList to `/learn/<slug>` (Home > Learn > lesson), `/blog/<slug>` (Home > Blog > post) and `/hf/<owner>/<model>` (Home > Hugging Face > repo).

### S3. FAQPage on about 4,660 programmatic URLs produces no Google rich result
- **Severity:** Info (per skill rules: flag, do not recommend removal)
- **Evidence:** `FaqJsonLd` emits a one-question FAQPage on every `/can-i-run/<model>`, `/can-i-run/<model>/<hw>` and `/what-runs-on/<hw>` page. The code comment in `components/can-i-run/parts.tsx:55` reads "Structured data so search engines can show the answer directly". Google retired FAQ rich results for all sites on 2026-05-07, so that outcome no longer happens.
- **Recommendation:** Keeping the blocks is harmless: they are valid, short (258–357 bytes) and match visible content. Do not expect SERP features from them, and any AI/answer-engine benefit is unconfirmed. Do not convert to QAPage, because these are not user-submitted Q&A. Put effort into BreadcrumbList (S2) and the entity graph (S1). Update the code comment so future work is not planned around a retired feature.
- **Responsible file:** `components/can-i-run/parts.tsx` (`FaqJsonLd`, lines 55–63).

### S4. BlogPosting `author` is a Person named "Ray, Himal's AI assistant" with no URL
- **Severity:** Medium
- **Evidence:** `/blog/welcome-to-the-local-ai-advisor-blog` JSON-LD: `"author": {"@type": "Person", "name": "Ray, Himal's AI assistant"}`. There is no `url` and no author page. The visible byline matches ("By Ray, Himal's AI assistant").
- **Impact:** Google's Article guidance recommends `author.url` (or `sameAs`) pointing to a page that identifies the author. Typing an AI assistant as `Person` misstates the entity. Leaving the human accountable for the content unidentified weakens E-E-A-T for a YMYL-adjacent "will this run on my hardware" advice site.
- **Recommendation:** Do one of the following. (a) Credit the accountable human as `Person` with `url` to an about/author page, and disclose AI assistance in visible text. (b) Use the Organization as author. Keep the visible byline consistent with whichever you choose. Do not use `schema_generate.py profile` (ProfilePage) until a real author page exists. Example for option (b):
- **Responsible file:** `app/blog/[slug]/page.tsx` (lines 41–56, `jsonLd`). Author string comes from MDX front matter `author:` in `content/blog/*.mdx`, validated in `lib/blog.ts:38`.

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "@id": "https://iownchatgpt.com/blog/welcome-to-the-local-ai-advisor-blog#article",
  "headline": "Welcome to the Local AI Advisor blog",
  "description": "What this blog covers, who writes it, and how we keep posts honest about what AI on your own computer can and can't do.",
  "datePublished": "2026-10-01T09:00:00+00:00",
  "dateModified": "2026-10-01T09:00:00+00:00",
  "author": { "@type": "Organization", "@id": "https://iownchatgpt.com/#organization", "name": "Local AI Advisor", "url": "https://iownchatgpt.com/" },
  "publisher": { "@id": "https://iownchatgpt.com/#organization" },
  "isPartOf": { "@type": "Blog", "@id": "https://iownchatgpt.com/blog#blog", "name": "Local AI Advisor blog", "url": "https://iownchatgpt.com/blog" },
  "mainEntityOfPage": { "@type": "WebPage", "@id": "https://iownchatgpt.com/blog/welcome-to-the-local-ai-advisor-blog" },
  "url": "https://iownchatgpt.com/blog/welcome-to-the-local-ai-advisor-blog",
  "image": {
    "@type": "ImageObject",
    "url": "https://iownchatgpt.com/blog/welcome-to-the-local-ai-advisor-blog/opengraph-image",
    "width": 1200,
    "height": 630
  },
  "inLanguage": "en",
  "keywords": "local-llm, announcements, beginners",
  "wordCount": 427
}
```
(The publish time above is illustrative; use the real time from front matter.)

### S5. BlogPosting `dateModified` is hard-wired to `datePublished`; dates have no time or zone
- **Severity:** Low
- **Evidence:** `app/blog/[slug]/page.tsx:46-47`: `datePublished: post.date, dateModified: post.date`. Live value: `"2026-10-01"`.
- **Recommendation:** Add an optional `updated:` front-matter field and use it for `dateModified`. Emit full ISO 8601 with a timezone (`2026-10-01T09:00:00+00:00`), as Google recommends for Article dates.
- **Responsible file:** `app/blog/[slug]/page.tsx`, `lib/blog.ts` (front-matter schema).

### S6. `/learn` course has no Course markup; lessons have no Article/LearningResource
- **Severity:** Medium
- **Evidence:** `/learn` and `/learn/what-is-local-ai` have 0 JSON-LD blocks. The course is 10 lessons, 37 minutes in total (`components/learn/lessons.ts`, `TOTAL_MINUTES`), and is free. The blog post also links to it as "our free course".
- **Recommendation:** Add `Course` on `/learn` (an active type; CourseInfo was retired June 2025, so do not use CourseInfo properties as a rich-result play). A single course is unlikely to trigger Google's Course list carousel, which needs a list of several courses. The value is entity clarity and machine readability. On each lesson, add `["Article","LearningResource"]` with `isPartOf` the Course, plus BreadcrumbList. Do not use HowTo for "Run your first model": it is deprecated.
- **Responsible file:** `app/learn/page.tsx`, `app/learn/[slug]/page.tsx` (build from `LESSONS` in `components/learn/lessons.ts`).

`/learn`:
```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "@id": "https://iownchatgpt.com/learn#course",
  "name": "Learn local AI, step by step",
  "description": "10 short, visual lessons on running AI models on your own computer: memory, model size, quantization, context, speed, and your first model.",
  "url": "https://iownchatgpt.com/learn",
  "provider": { "@type": "Organization", "@id": "https://iownchatgpt.com/#organization", "name": "Local AI Advisor", "sameAs": "https://iownchatgpt.com/" },
  "inLanguage": "en",
  "isAccessibleForFree": true,
  "educationalLevel": "Beginner",
  "teaches": ["What local AI is", "How much memory a model needs", "Quantization", "Context windows", "Tokens per second", "Running your first local model"],
  "timeRequired": "PT37M",
  "offers": { "@type": "Offer", "category": "Free", "price": "0", "priceCurrency": "USD" },
  "hasCourseInstance": {
    "@type": "CourseInstance",
    "courseMode": "Online",
    "courseWorkload": "PT37M"
  },
  "hasPart": [
    { "@type": "LearningResource", "name": "What is local AI?", "url": "https://iownchatgpt.com/learn/what-is-local-ai", "timeRequired": "PT3M" },
    { "@type": "LearningResource", "name": "Memory: where the model lives", "url": "https://iownchatgpt.com/learn/memory", "timeRequired": "PT4M" }
  ]
}
```
(Generate `hasPart` for all 10 lessons from `LESSONS`; two shown here.)

Lesson (`/learn/what-is-local-ai`):
```json
{
  "@context": "https://schema.org",
  "@type": ["Article", "LearningResource"],
  "headline": "What is local AI?",
  "description": "<lesson.summary>",
  "url": "https://iownchatgpt.com/learn/what-is-local-ai",
  "learningResourceType": "Lesson",
  "educationalLevel": "Beginner",
  "timeRequired": "PT3M",
  "position": 1,
  "isPartOf": { "@id": "https://iownchatgpt.com/learn#course" },
  "author": { "@id": "https://iownchatgpt.com/#organization" },
  "publisher": { "@id": "https://iownchatgpt.com/#organization" },
  "inLanguage": "en"
}
```

### S7. Tool pages (`/check`, `/speed-test`, `/hugging-face`, `/compare/models`) lack WebApplication markup
- **Severity:** Low
- **Evidence:** 0 JSON-LD on `/check`, `/speed-test`, `/hugging-face`, `/compare/models`, `/tools`.
- **Recommendation:** Add the S1 WebApplication on `/check` and reference it by `@id` from the homepage. Add a small WebApplication block on `/speed-test` ("Browser speed test for local AI") and `/hugging-face`. Same caveat as S1: there is no rich result without genuine ratings, and none should be invented.
- **Responsible file:** `app/check/page.tsx`, `app/speed-test/page.tsx`, `app/hugging-face/page.tsx`.

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Check any Hugging Face model",
  "url": "https://iownchatgpt.com/hugging-face",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Any (web browser)",
  "isAccessibleForFree": true,
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "description": "Paste any Hugging Face model and get an estimate of whether it will run comfortably on your hardware.",
  "publisher": { "@id": "https://iownchatgpt.com/#organization" }
}
```

### S8. `/blog` index has no Blog markup
- **Severity:** Low
- **Evidence:** `/blog`: 0 JSON-LD blocks.
- **Recommendation:** Add a `Blog` node (same `@id` used in S4 `isPartOf`) with `blogPost` stubs generated from `getAllPosts()`.
- **Responsible file:** `app/blog/page.tsx`.

```json
{
  "@context": "https://schema.org",
  "@type": "Blog",
  "@id": "https://iownchatgpt.com/blog#blog",
  "name": "Local AI Advisor blog",
  "url": "https://iownchatgpt.com/blog",
  "publisher": { "@id": "https://iownchatgpt.com/#organization" },
  "blogPost": [
    { "@type": "BlogPosting", "headline": "Welcome to the Local AI Advisor blog", "url": "https://iownchatgpt.com/blog/welcome-to-the-local-ai-advisor-blog", "datePublished": "2026-10-01" }
  ]
}
```

### S9. Dataset markup: optional, only if you publish the ratings data
- **Severity:** Info
- **Evidence:** `/models`, `/hardware` and `/methodology` describe a rating dataset (36 models x 125 machines) but have no download or license. Dataset markup is consumed only by Google Dataset Search, not by Search rich results.
- **Recommendation:** Only worth adding if a downloadable JSON/CSV with a stated license is published. Without a `distribution` and `license` it adds little. Do not mark hardware as `Product`: the "about $1,500" prices are estimates, not Offers, and would violate merchant/product snippet policies.
- **Responsible file:** `app/methodology/page.tsx` (if pursued).

### Tooling note
`schema_generate.py` only supports `reservation`, `order`, `discussion` and `profile` generators, none of which fit this site's templates. The snippets above were written by hand against the skill's templates and validated as JSON.

---

## What works
- All JSON-LD is **server-rendered** in the initial HTML, which is ideal for programmatic pages.
- All existing blocks use `https://schema.org`, absolute URLs and valid JSON, and escape `<` (`<`) to prevent script injection.
- The FAQ answer text **matches visible content** (H1 question plus "Short answer" card). Nothing is hidden or spammy.
- BlogPosting has every required property plus `publisher.logo` (512x512 PNG, 200 OK), `mainEntityOfPage`, `wordCount` and an `image` that resolves (1200x630 PNG, 200 OK).
- No deprecated types (HowTo, SpecialAnnouncement, CourseInfo and so on) are used anywhere. There is no microdata/RDFa duplication.

## Priority order
1. S2 BreadcrumbList on programmatic templates (one component change covers about 4,660 URLs).
2. S1 Organization + WebSite (+ WebApplication) `@graph` on the homepage.
3. S4/S5 BlogPosting author, `@id` links and dates.
4. S6 Course + lessons.
5. S7/S8 tool and blog-index types. S3 and S9 are Info only.
