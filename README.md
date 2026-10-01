# Local AI Advisor

**Will local AI actually run well on your computer?**

Local AI Advisor answers *"Will this model + runtime + tool + hardware combination be comfortable for what I actually want to do?"*, not just *"does it fit in memory?"*. The same model on the same machine can be **Comfortable for casual chat** and **Borderline for agentic coding**, and the app explains why.

## Features

- **What can my computer comfortably run?** (`/check`): a 6-step wizard with Simple and Advanced modes. It returns a best fit, a fast option, a quality option and a "technically possible but not recommended" list, plus a sortable table of every model.
- **What hardware do I need?** (`/hardware-for-model`): pick a model, tool, workload and target experience, plus an optional budget. Hardware is grouped into *meets target / meets acceptable / below target / cannot run*.
- **Detailed evaluation** (`/evaluate`): headline verdict, the four capability tiers (load / run / usable / comfortable), separate gauges for each dimension, the explainability panel, a memory breakdown, the performance basis, a context table from 4K to 128K, cross-workload fit, the stack, and live what-if controls with change banners.
- **Build my local AI stack** (`/stack`): hardware → runtime → model → local API → AI tool, with generated setup steps.
- **Compare** models on your hardware (`/compare/models`), or hardware for your workload (`/compare/hardware`), with tradeoffs rather than an opaque winner.
- **Explore** the models, hardware, runtimes and AI tools databases, including a tool × runtime compatibility matrix.
- **Learn** (`/learn`): the core concepts, with live engine-powered widgets.
- **Methodology** (`/methodology`): how the engine works, plus the full table of benchmarks used.
- **Check any Hugging Face model** (`/hugging-face`): search or paste any Hub model, including GGUF and MLX repos. The server reads its real config.json and file sizes (parameters, experts, attention layout, KV cache, context) and rates it with the same engine. Gated models are read through public mirrors. Capability tiers for imported models are estimated and labelled as such.
- **Honest live-import facts**: native and RoPE-extended context are shown separately; ratings use native context. Embeddings/rerankers receive a helpful error. Commercial-use badges summarize declared licenses, and tool/thinking/vision signals show their provenance and uncertainty.
- **Verified conversion availability**: live imports discover GGUF conversions and measured quant file sizes, with an explicit fallback when none are found. FP8 is a separate quantization. FP16/BF16 safetensors sizes use actual weight files; Hub `safetensors.total` is a parameter count, not bytes.
- **Accessible, remembered lookups**: search rows identify GGUF/MLX/safetensors and gated repos; ArrowUp/Down, Enter and Escape operate the combobox. Hardware, custom specs, OS and workload are validated and remembered locally under `laa:hf-state` (shared hardware links take precedence).
- **Model share pages** (`/hf/<owner>/<model>`): 30 seeded pages render facts and default M4 Pro 48GB repository-coding recommendations on the server, with canonical URLs, model-specific OG cards and sitemap entries. The seed uses the report's text-model trending entries plus its most-downloaded catalog rows; it excludes ASR.
- **Weekly catalog review**: a six-worker, retrying refresh script writes a review-only report; GitHub Actions commits the report and opens/updates a dated issue when models need review. Curated entries are never edited automatically.
- **Shareable URLs**: every configuration is encoded in the query string and validated with Zod on the way in.

## Architecture

```
app/                     Next.js App Router pages (server pages read searchParams → client views)
components/ui/           Small shadcn-style primitives
components/advisor/      Wizards, result cards, gauges, memory bar, explanation, what-if, compare
components/explore/      Database explorers        components/learn/   Educational widgets
data/                    Hardware, models, runtimes, tools, providers, quantizations, benchmarks
lib/schemas/             Zod domain schemas + engine output types
lib/hf/                  Server Hub cache/import/discovery, parser, license signals, saved-state validation
components/advisor/hf-model-facts.tsx  Shared server/client facts presentation
app/hf/[owner]/[model]/   Static/ISR model pages and model-specific OG images
.github/workflows/       Weekly review-only model refresh
lib/workloads/           Use-case profiles (weights, thresholds), dev environments, workload resolver
lib/memory/              Weights, KV cache, overhead, unified vs discrete memory pools
lib/performance/         Bandwidth-bound decode, compute-bound prefill, benchmark calibration
lib/compatibility/       Tool → API → runtime → format → backend validation
lib/recommendations/     Evaluation pipeline, scoring, search, what-if, context sweep, stack
tests/                   Vitest unit tests
research/                Source notes behind the seed data (URLs for every figure)
```

The calculation engine has no UI dependencies. HF presentation helpers live in `lib/hf/og.tsx`; `lib/hf/fetch.ts`, `summary.ts` and `og.tsx` are server-only. Imports share in-flight requests, cache model/search results for six hours and conversion/file discovery for 24 hours. Templates are limited to 200KB; recursive file trees follow Hub pagination. Measured weights carry format provenance so a safetensors size is never used as a GGUF measurement.

The pipeline in `lib/recommendations/evaluate.ts` runs these steps:

1. Validate hardware, runtime and tool → API → runtime.
2. Compute usable memory after the OS, the dev environment and the tool.
3. Size weights, overhead and KV cache.
4. Estimate headroom.
5. Estimate prefill and generation (calibrated by benchmarks).
6. Apply the workload's thresholds and the concurrency.
7. Score model suitability.
8. Assign confidence and a comfort classification.
9. Generate the explanation.

Workload-specific weights decide how much each dimension counts. Critical dimensions cap the rating, and explicit gating rules decide the top levels (for example, *Excellent* requires every critical dimension to be strong). Internal scores are never shown; users see comfort levels, qualitative gauges, and ranges for any estimated speed.

## Data and honesty

- **Benchmarks:** the 76 benchmark rows are transcribed from public llama.cpp scoreboards and repository bench files, and each one cites its source.
- **How benchmarks are used:** when a chip has benchmarks they calibrate the estimates for it, and a direct model + quant + engine match counts as *measured*. Otherwise performance is labelled *estimated* and shown as a range.
- **Freshness:** every entity carries `sourceURL`, `lastVerified` and `confidence`. Data was verified on 2026-09-30, and the hardware and model lineups change quickly.
- **Capability tiers:** model capability tiers are editorial assessments, not benchmark scores. Recommendation status is never stored on data entries; the engine derives it.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # vitest — engine, search, what-if, share-URL and data-integrity tests
npm run typecheck
npm run lint
npm run build
npm run refresh:models   # compare curated models with Hugging Face; writes research/model-refresh-<date>.md
```

### Environment

- `HF_TOKEN`: a read-only Hugging Face token, used only on the server by `/api/hf/*` for higher rate limits. The app also works without it. Locally, put it in `.env.local` (git-ignored); in production, set it in the host's environment variables.
