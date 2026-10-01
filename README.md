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
- **Shareable URLs**: every configuration is encoded in the query string and validated with Zod on the way in.

## Architecture

```
app/                     Next.js App Router pages (server pages read searchParams → client views)
components/ui/           Small shadcn-style primitives
components/advisor/      Wizards, result cards, gauges, memory bar, explanation, what-if, compare
components/explore/      Database explorers        components/learn/   Educational widgets
data/                    Hardware, models, runtimes, tools, providers, quantizations, benchmarks
lib/schemas/             Zod domain schemas + engine output types
lib/workloads/           Use-case profiles (weights, thresholds), dev environments, workload resolver
lib/memory/              Weights, KV cache, overhead, unified vs discrete memory pools
lib/performance/         Bandwidth-bound decode, compute-bound prefill, benchmark calibration
lib/compatibility/       Tool → API → runtime → format → backend validation
lib/recommendations/     Evaluation pipeline, scoring, search, what-if, context sweep, stack
tests/                   Vitest unit tests
research/                Source notes behind the seed data (URLs for every figure)
```

The engine (`lib/`) has no UI dependencies. The pipeline in `lib/recommendations/evaluate.ts` runs these steps:

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
```
