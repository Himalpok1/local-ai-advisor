# Catalog and chart maintenance

Owner: Muse. Updated October 10, 2026. Use alongside AGENTS.md; daily editorial restrictions still apply.

## Repeatable review

1. Run `npm run audit:catalog -- --date=YYYY-MM-DD`. Read the Markdown and JSON under `research/catalog/`. This offline command produces review suggestions; it never edits the catalog. Discovery names are not verified specifications. The current discovery snapshot is attributed to Local Analysis under CC BY 4.0. Preserve attribution if replacing or redistributing it. Do not import competitor grades, speed estimates or intelligence scores as measurements.
2. Run `npm run refresh:models`. Review the generated report against the exact model repository/revision and official release/model card. A discrepancy is a review task, not permission to overwrite editorial capabilities or engine logic.
3. Prioritize requested/popular hardware, missing affordable devices, exact memory variants and workstation cards. Candidate families are not interchangeable with laptop models or lower/higher GPU bins. A name match does not establish coverage of every memory option.
4. Open the actual primary source and record its URL, title, checked date, units and the field it supports. Do not change `lastVerified` merely because a script ran or the page returned HTTP 200. A redirected homepage is not a specification source. Keep unresolved fields in the review queue.
5. For additions use the existing `HardwareConfigurationInput` schema. The October batch lives in `data/hardware-expansion.ts`, merged by `data/hardware.ts`. Preserve existing published IDs and chip keys. Prefer a new exact variant to changing an established chip's identity. Add `evidence` for each new factual, derived or assumed group.
6. Run typecheck, lint, tests and build. Run typecheck after build (not concurrently) because Next regenerates `.next/types`. Save a short research report with source checks, additions, caveats, graph checks and outstanding decisions.

## Fields and units

- `systemRamGB` is installed RAM; `gpu.vramGB` is dedicated GPU memory. Never sum VRAM and RAM as one fast pool. Shared RAM on Apple/Strix/DGX is not all available to a model.
- `gpu.bandwidthGBs` is physical peak memory bandwidth in decimal GB/s. Do not use PCIe bandwidth or a vendor's cache-adjusted “effective” bandwidth. Derivations must show memory data rate × bus bits / 8, with units and sources.
- `gpu.fp16Tflops` is the engine's approximate dense compute input. Document vector versus matrix, precision, sparsity and any proxy. A sparse FP8/INT8 TOPS number is not dense FP16 TFLOPS. Some added NVIDIA workstation entries explicitly use FP32 peak as a conservative unvalidated proxy; replace it only after reviewing an applicable compute source and calibration behavior.
- The expansion's complete PC configurations use example RAM capacities, a generic CPU and assumed RAM bandwidth. These are assumptions, not specifications of a named vendor PC. Do not describe an entire configuration as vendor verified because its GPU memory is sourced.
- List only reviewed runtime paths. The added AMD cards use Vulkan; do not assert official ROCm support without checking exact GPU, runtime version and OS against AMD's support matrix.
- Prices are optional. Leave them absent unless a dated source supports the exact item/configuration, currency, region and price type. GPU price is not complete PC price. The audit flags all legacy indicative prices lacking field-level evidence.
- `year` must be the release year of the named chip/device variant, checked against an official announcement. Datasheet revision year is not necessarily release year.
- Model config values, model-card statements and exact file sizes are factual inputs. Capability tiers and editorial notes remain owner-reviewed judgments. Do not label them independent intelligence benchmark scores.

## Benchmark ingestion

Check the original source/raw log, not a generated summary. Preserve exact model/revision, quant label, runtime/version, backend, format, prompt/context/output tokens, cache format, placement, batch, power/thermal conditions, repeated-run spread and measurement date when available. Add raw-log links to `referenceSettings.rawLogUrl`; missing fields remain unknown. A broad source date range must not become an invented day.

Public chip measurements and community aggregates are different evidence. Community medians with coarse quant labels remain calibration inputs, not exact anchors. Synthetic fixtures must stay in tests. Never create fake submissions to populate empty charts. Account ownership/moderation and database integration remain unverified until tested with an isolated local database.

An anchored engine output is a prediction at requested settings. Actual reference speeds are displayed separately. Current ±15%/±25% speed bands are heuristic assumptions with no validated coverage. Do not advertise an accuracy percentage until measurements withheld from calibration establish it. Retain separate generation, prompt-processing and latency errors; do not validate predictions against their own calibration anchors.

## Charts and acceptance

- Hardware spec chart: `components/explore/hardware-explorer.tsx`, computed directly from the filtered catalog, deduplicated by chip, top 12. Memory shows the largest matching option; bandwidth is a spec, not observed inference speed.
- Context chart: `components/advisor/performance-charts.tsx`, receives `contextSweep` results. No separate speed formula, no random/demo data. Unsupported or non-fitting points break lines and show ×. Generation is at 95% of the effective context window; prompt latency is the engine's resolved first-prompt workload, not necessarily a full-context ingestion.
- Hardware comparison chart: same component, receives the exact recommendations shown in the comparison table. Bar center values are predictions; labels show heuristic speed ranges. Non-fitting/unsupported setups are unavailable.
- Keep units, selected settings, prediction basis, assumptions and heuristic range caveats visible. Keep text values/tables as accessible alternatives. Check keyboard controls, wide and 390px screens, empty results and unavailable points.

## Deployment and rollback

`main` auto-deploys on push. All four local checks must pass first. Feature branch pushes save work without deploying. Do not assume a previous branch push authorized merging to main. After an authorized production deployment verify hardware search, a new-device evaluation, comparison graphs, methodology and unchanged feeds. Preserve IDs when correcting facts; describe material prediction changes in the report.

## Remaining work

The discovery queue includes many uncovered consumer/laptop/older accelerator families. The October batch adds 19 GPU families / 38 reference PC configurations, not every competitor device. Automatic matching is conservative and can flag aliases as gaps. Source-review legacy records and prioritize remaining families from the generated report. Account/database integration, independent inference measurements and empirical error-band coverage are still outstanding. Do not present them as completed.
