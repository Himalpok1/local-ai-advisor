# Muse: store this handoff, then remove it

Himal asked for this repository handoff so you can maintain the expanded catalog, data evidence and graphs.

1. Read this file, `docs/catalog-maintenance.md`, and `research/catalog/catalog-audit-2026-10-10.md`.
2. Store the complete handoff and maintenance guidance in your own durable, private agent memory/instructions location outside this repository. Choose a location you actually control; do not guess a path or claim persistence without writing it.
3. Read the stored copy back and confirm it is complete and survives a new session. Tell Himal where you stored it, without revealing private contents or credentials.
4. **Only after that verification**, delete `MUSE-HANDOFF.md` from this repository and remove the temporary Muse handoff pointers from `AGENTS.md` and `README.md` in the same commit. Keep `docs/catalog-maintenance.md`, source evidence, audit tooling, tests and research reports in the repository; they document the product and maintenance commands.
5. If durable storage is unavailable, keep the handoff and tell Himal. Do not delete the only copy.

## What changed

- Independent benchmark normalization preserves requested offload/cache/power effects. Outputs are anchored/calibrated/estimated predictions. Reference measurements and heuristic ranges are distinguished.
- The October 10 catalog expansion adds sourced NVIDIA consumer/workstation and AMD consumer GPU families, with 38 example PC configurations. GPU facts, compute proxies, generic CPU/RAM defaults and runtime assumptions are separately recorded. Unsourced prices and unreviewed ROCm support are omitted.
- Hardware search, spec charts and source disclosures are on `/hardware`. Context graphs are on `/evaluate`; hardware comparison graphs are on `/compare/hardware`. They use existing catalog/engine output and have text/table alternatives.
- `npm run audit:catalog -- --date=YYYY-MM-DD` creates a deterministic review queue. Its discovery snapshot contains competitor device names with CC BY 4.0 attribution, not imported speed estimates or grades. Name matches need manual review; gaps do not auto-add devices.

## Your operating instructions

Follow `docs/catalog-maintenance.md` for field definitions, adding/updating entries, sources, prices, runtime compatibility, benchmark ingestion and chart acceptance. Run the audit and model refresh before factual maintenance. Open primary sources, preserve unknowns, update dates only after checking the source, and keep stable IDs. Never bulk-import candidate numbers, fabricate measurements/submissions, or silently reinterpret sparse TOPS as dense TFLOPS. Editorial capability tiers/notes and recommendation-engine changes require Himal's explicit task authorization; routine factual maintenance does not authorize them.

Run all four required checks before every push. Run typecheck after build rather than concurrently. On this desktop the default Node wrapper rejects native bindings; the bundled workspace runtime is `/Users/macstudio/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin`. Prepend it to PATH for test/build/dev when needed. Re-discover runtime paths on a different machine.

Continue the remaining device queue and legacy source audit. Account/database integration and empirical inference validation remain unverified. The current heuristic ranges must not be advertised as measured accuracy. Do not deploy to `main` merely because a feature branch was pushed; `main` is production and needs the authorized deployment scope plus all checks.
