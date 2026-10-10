# Benchmark anchoring follow-up — October 10, 2026

Implemented the bounded anchoring correction and initial provenance/uncertainty reporting.

## Calculation changes

Direct normalization now uses a separate benchmark reference context, rather than the requested GPU placement/cache. Explicit reference format, KV cache, offload fraction and power multiplier are supported. Existing records remain untouched: missing reference settings are explicitly assumed to be GGUF, F16 KV, full GPU placement and mains power. Runtime version and batch remain unverified. These assumptions reduce recommendation confidence.

Direct matching requires the model ID, chip, backend, engine family, format and exact quant label. Q4_0 and Q4_K_M do not directly match. Community aggregates with coarse quant labels remain calibration inputs. This does not establish their configuration equivalence or validate the database integration.

All performance outputs are predictions: the former `measured` output basis is now `anchored`. Results separately expose reference speeds, source link/date/caveats, token counts, available settings and normalization assumptions. Latency, concurrency and load-time outputs remain modeled rather than measured. Display bands are explicitly heuristic (±15% for anchored/calibrated, ±25% for estimates); they are not empirically validated confidence intervals or observed measurement spread.

## Verification and limits

Synthetic unit fixtures reproduce reference decode and average prefill, retain full/partial/zero GPU placement penalties, and exercise battery, KV cache, context, wrappers, explicit reference settings, mismatched quant/format and legacy provenance. Synthetic rows exist only in tests and never enter the published dataset.

Typecheck, lint, the full unit suite and production build pass. The six dedicated anchoring regressions also pass explicitly. The app's default Node runtime rejects the native test binding due to its macOS signing policy; the bundled workspace Node runtime successfully runs tests and builds. No dependency manifest/lockfile changes were made.

No new real inference measurements, held-out accuracy study, source re-verification, live account/database integration test, or deployment was performed. The measurement protocol and empirical validation work in `validation-plan.md` remain outstanding. Public benchmark dates retain their original precision, including broad ranges; this change does not invent exact dates, runtime versions, batch settings or raw logs.
