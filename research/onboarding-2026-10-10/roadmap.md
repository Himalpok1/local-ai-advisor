# Incremental improvement roadmap

Sequence dated October 10, 2026. See [audit evidence](report.md) and [reproducible validation plan](validation-plan.md). Complexity is relative engineering effort, not a delivery commitment: S ≈ 0.5–2 days, M ≈ 3–5 days, L ≈ 1–2 weeks with access/data dependencies. Work in small reviewable branches; preserve current routes and design.

## P0 — correctness

### P0-1 — conversational model eligibility (completed in this branch)

- **Objective/reason:** prevent specialized/base/unverified models receiving misleading chat comfort and output-token speeds.
- **Modules:** `lib/hf/{eligibility,parse,fetch,og}`, new-models page/feed, HF regression tests.
- **Dependencies/complexity:** existing Hub import boundary; M including investigation and presentation verification; no new package.
- **Acceptance:** d1 and other unsupported classes rejected before registration/evaluation; explicit uncertain/unsupported reason; legitimate dense/MoE/VLM fixtures retained; supported routes/queries preserved.
- **Verification:** focused HF tests, API 422/no performance, rendered cards/RSS with no rating, fixture-backed browser checks, full four npm checks.

### P0-2 — fix direct benchmark normalization (recommended next phase)

- **Objective/reason:** preserve CPU/offload slowdown even when a measured anchor exists; audit probe currently predicts identical speed at 1/0.25/0 offload.
- **Modules:** `lib/performance/index.ts`, `lib/schemas/index.ts` benchmark fields if necessary, `tests/engine.test.ts` or focused performance tests.
- **Dependencies/complexity:** document original anchor placement/settings; M. Use explicit legacy assumptions with reduced confidence when source placement is absent.
- **Acceptance:** exact reference settings reproduce the anchor; reducing GPU residency lowers predicted decode/prefill appropriately; battery, KV format and context changes scale from the original reference rather than cancel; memory-fit behavior unchanged.
- **Verification:** deterministic direct-anchor regression across full/partial/zero offload, requested cache formats, battery and runtime wrappers; representative real anchors; full checks and compare before/after classifications. No wholesale engine replacement.

## P1 — trust and core workflow

### P1-1 — distinguish measurements, anchored predictions and calibrated predictions

- **Objective/reason:** avoid calling changed-setting extrapolations measured; exact quant variants/runtime versions affect results.
- **Modules:** benchmark schemas/data, `lib/performance`, results types, performance basis UI, methodology.
- **Dependencies/complexity:** P0-2; source review and legacy record migration policy; M–L.
- **Acceptance:** each displayed performance figure has a basis, anchor settings/date/source and extrapolation reason; Q4_0 does not silently become exact Q4_K_M; changed context/placement remains a prediction.
- **Verification:** matching/mismatch fixtures, source spot checks, UI assertions and held-out validation output.

### P1-2 — reproducible validation and honest uncertainty

- **Objective/reason:** replace unsupported precision claims with documented, tested error behavior without changing formulas blindly.
- **Modules:** `scripts/`, `tests/`, `research/`, `data/benchmarks.ts`, `lib/performance`, `lib/format.ts`, methodology.
- **Dependencies/complexity:** P0-2 and benchmark provenance; representative hardware access for new measurements; L.
- **Acceptance:** leakage-free backend/model-family held-out report, versioned measurement protocol, separate decode/prefill/TTFT errors; heuristic ranges explicitly identified until empirical coverage is available; no fabricated rows.
- **Verification:** deterministic report regeneration, fixture snapshots of report schema, manual raw-log/source checks and documented measurement runs. See validation plan.

### P1-3 — imported architecture/runtime support evidence

- **Objective/reason:** GGUF or MLX format availability alone does not prove a specific engine build supports a new architecture.
- **Modules:** runtime schemas/data, `lib/compatibility`, HF parser/conversion discovery, setup/download commands and facts UI.
- **Dependencies/complexity:** reviewed official runtime support/version sources; M–L.
- **Acceptance:** distinguish supported, experimental and unverified architecture/version support; unknown conversion equivalence cannot imply official compatibility; no confident installation command when loading is unverified.
- **Verification:** architecture/version matrix tests; representative runtime load checks on consenting local test hardware; supported conversion regression fixtures.

### P1-4 — consistent launch-price purchasing labels

- **Objective/reason:** “Lowest price” and “cheapest” currently imply stronger shopping conclusions than historical approximate prices support.
- **Modules:** hardware explorer/search, compare-hardware, can-i-run alternatives/metadata, price source schema/data.
- **Dependencies/complexity:** existing sourced launch prices; current retail collection is a separate optional decision; S–M.
- **Acceptance:** all prices state approximate launch/system basis and source/date; budget filtering/lowest-price labels explicitly use that basis; missing prices are unknown, not proven affordable; no false current offer language.
- **Verification:** representative price/budget fixtures and desktop/mobile review on comparison, buying wizard and SEO answer pages.

### P1-5 — single-choice keyboard semantics and responsive accessibility

- **Objective/reason:** radiogroup buttons lack arrow-key/roving-focus handling; single-choice cards appear as checkboxes, small controls need review.
- **Modules:** `components/ui/form.tsx`, workload/hardware pickers, progress and skip controls, tables, global focus styles.
- **Dependencies/complexity:** choose shared semantic primitives while preserving visual tokens; M.
- **Acceptance:** Arrow/Space/Enter and Tab behavior consistent with roles; labels/help linked; visible focus; measured contrast in both themes; adequate touch targets; mobile table scroll discoverable; no clipped essential labels.
- **Verification:** focused interaction/DOM tests plus manual keyboard, screen reader and 390/768/desktop walkthrough. Do not introduce a full new component framework.

### P1-6 — make the existing quick path clearer

- **Objective/reason:** Skip to results already exists after the hardware step; improve its discoverability instead of duplicating the wizard.
- **Modules:** `check-flow.tsx`, use-case picker, defaults and results assumptions summary.
- **Dependencies/complexity:** product decision on beginner default workload; S–M.
- **Acceptance:** hardware + use case can reach preliminary results without configuring app/details/priority; defaults shown and editable; advanced/repository controls remain; share-state roundtrips unchanged.
- **Verification:** beginner task walkthrough, existing URL/search tests and keyboard/mobile interactions. Decide on default workload before changing it.

### P1-7 — canonical host and programmatic indexing quality

- **Objective/reason:** www responds 200; 5,166 pair pages need useful differentiated output and crawl evidence.
- **Modules:** metadata/sitemap/robots, model-device pages, internal links; hosting redirect settings separately.
- **Dependencies/complexity:** host redirect authorization and optional read-only Search Console data; M.
- **Acceptance:** one canonical host and approved host redirect; meaningful pair-page answers/alternatives; invalid old game URLs stay true 404 unless a relevant successor exists; no parameter duplicates promoted by internal links; JSON-LD validated.
- **Verification:** stratified URL crawl, HTML canonicals/response status, sitemap route resolution, structured-data checks. Search ranking conclusions require Search Console.

### P1-8 — graceful optional auth/database availability

- **Objective/reason:** local signed-out/session calls can throw before error handling when DATABASE_URL is absent, despite core evaluation being independent of persistence.
- **Modules:** `auth.ts`, `lib/me/server.ts`, account API boundaries and providers.
- **Dependencies/complexity:** isolated local DB and auth fixture/session setup; S–M.
- **Acceptance:** core recommendations have no session-error noise when optional services are unconfigured; API unavailable states are explicit; configured sign-in, JWT handling and ownership rules remain intact.
- **Verification:** absent-env and DB-failure fixtures; signed-out/session response tests; configured local auth integration and four checks. Do not weaken production authentication.

## P2 — exploration, coverage and maintenance

### P2-1 — one useful engine-powered chart

- **Objective/reason:** improve scannability while retaining detailed explanations.
- **Modules:** evaluation context table/compare views, shared engine result adapters, accessible chart/table component.
- **Dependencies/complexity:** P1-1/P1-2 labels; M.
- **Acceptance:** context length versus latency or memory headroom chart uses actual context-sweep results, marks unsupported points, distinguishes measured anchor from prediction and includes accessible data table. Capability-vs-speed charts must label editorial capability tiers.
- **Verification:** chart data equals engine fixture output; visual desktop/mobile check, no missing uncertainty labels. Add price-performance plots only after P1-4.

### P2-2 — curated catalog expansion by unmet demand

- **Objective/reason:** competitor breadth is larger, but relevance and factual trust matter more than matching counts.
- **Modules:** `data/{models,hardware,runtimes,downloads}`, source notes, refresh reports and integrity tests.
- **Dependencies/complexity:** prioritized user demand and primary sources; M per curated batch.
- **Acceptance:** each addition has verified dimensions, formats, native context, source/license/date and reviewed capability tiers; no bulk fine-tunes; representative small/older systems and modern useful models covered.
- **Verification:** Zod/integrity tests, config fixture comparison, source review and engine smoke checks; data-change policy followed.

### P2-3 — public versioned structured exports

- **Objective/reason:** reusable data improves trust and discoverability without copying competitor implementation.
- **Modules:** read-only export routes/build script, domain schemas, provenance docs and download UI.
- **Dependencies/complexity:** license review for source-derived/editorial datasets and P1-1 basis fields; M.
- **Acceptance:** exports include version/date/units/settings/sources, measured versus predicted basis, documented schema and approved license/attribution; never export account/community personal data.
- **Verification:** schema/row-count tests, deterministic engine calculations and source/license audit. Licensing decision requires owner approval.

### P2-4 — ethical community cold start and grouping fidelity

- **Objective/reason:** empty public aggregates are honest; mixing context settings can distort calibration.
- **Modules:** community aggregation/UI/server/actions, benchmark import/display, isolated DB tests.
- **Dependencies/complexity:** consenting measurement participants or reusable published source logs; dedicated local DB; M.
- **Acceptance:** published verified measurements displayed separately from user reports; report ownership/moderation retained; context/batch/placement represented or normalized; unavailable remains distinct from empty; three-distinct-user policy not faked.
- **Verification:** aggregation fixtures and isolated DB ownership/error/moderation integration tests; raw measurement provenance review.

### P2-5 — resilient model feed and upstream validation

- **Objective/reason:** external listing casts, invalid dates, partial-source failure and background work weaken discovery reliability.
- **Modules:** HF fetch/discovery, listing schemas, feed UI/RSS and cache handling.
- **Dependencies/complexity:** P0-1 eligibility retained; M.
- **Acceptance:** malformed/future dates rejected; time budget doesn't leave unbounded work; pending vs upstream failure vs ineligible states distinct; partial org failures visible without removing usable items; no token leakage.
- **Verification:** mocked invalid JSON/date/null fields, 429/5xx/timeout/budget and partial-list tests; deterministic ordering and SSR escape checks.

### P2-6 — toolchain advisories and local integration guidance

- **Objective/reason:** dev dependency advisory chain and native-binding environment issue deserve durable setup instructions.
- **Modules:** package/lockfile only if justified, CI configuration, README and isolated database test guidance.
- **Dependencies/complexity:** compatible supported versions; S–M.
- **Acceptance:** advisory reachability documented or compatible patch applied; repeatable clean install; CI runs four checks; account tests use separate DB; no forced Next downgrade.
- **Verification:** clean install, npm audit comparison, test/lint/typecheck/build and local DB suite when available.

## P3 — optional expansion

### P3-1 — selective localization

- **Objective/reason:** broader beginner reach after trust copy stabilizes.
- **Modules:** route/i18n layer, learn/UI copy, locale metadata/sitemap.
- **Dependencies/complexity:** language priority and translation-review budget; P1 trust terminology; L.
- **Acceptance:** one validated additional locale first; identical engine results; reviewed technical translations; canonical/hreflang and original links preserved.
- **Verification:** locale routing/metadata tests and native-speaker workflow review.

### P3-2 — specialized-model evaluators

- **Objective/reason:** decision/embedding/OCR models can be useful, but their throughput and suitability require different metrics.
- **Modules:** task schemas, separate memory/performance/workload adapters, HF task facts and UI.
- **Dependencies/complexity:** explicit product scope and real task-specific measurements; L.
- **Acceptance:** task-labeled fit/latency/quality measures; no invented output tokens/s; uncertain unsupported models remain honest; general chat evaluator unchanged.
- **Verification:** task-specific fixtures, real measured latency/throughput protocol and product review. Do not implement by relaxing P0-1 guards.

## Next decision

Approve scope for P0-2 benchmark anchoring as the next bounded code phase. Follow with P1-1/P1-2 trust work. Catalog breadth, charts, localization and exports should not precede correctness. No roadmap item beyond P0-1 and the explicitly requested documentation inconsistencies was implemented in this assignment.
