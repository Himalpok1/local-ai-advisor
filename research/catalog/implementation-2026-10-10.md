# Sourced catalog and charts — October 10, 2026

## Implemented

- Added 19 GPU families / 38 reference PC configurations: RTX 2070 SUPER, RTX 2080, RTX 2080 SUPER, RTX 3070, RTX 3080 10GB, TITAN RTX, RTX A4000/A5000/A6000, RTX 6000 Ada; Radeon RX 6600, 6700 XT, 6800, 6800 XT, 6900 XT, 7600, 7600 XT, 7700 XT, 7800 XT. Total catalog: 164 configurations / 69 chip families.
- Added field-level evidence that distinguishes physical vendor specs from compute proxies, CPU/RAM defaults and runtime assumptions. GPU bandwidth uses physical bandwidth, not cache-adjusted effective numbers. NVIDIA non-Tensor FP16 figures come from the Ampere whitepaper where available. Three workstation models retain an explicit unvalidated FP32 proxy. New entries have no invented prices, no fake benchmark rows and no claimed ROCm path.
- Hardware explorer now has text search, an evidence filter, physical memory/bandwidth charts and expandable source links, checked dates and assumptions. Existing indicative prices remain visibly qualified and are flagged in the audit.
- Context chart shows actual contextSweep predictions for generation, first-prompt latency or headroom; invalid points break lines. Hardware comparison graphs use the same recommendations as the table. Heuristic speed bands and prediction basis remain visible; charts do not establish accuracy.
- Broadened detection for named TITAN GPUs and explicit family modifiers; regression tests distinguish RTX 6000 Ada from a generic Radeon 6000 renderer.
- Added deterministic offline `audit:catalog`, attributed competitor device-name discovery and a generated maintenance queue. Name matches require review; no competitor specifications, grades or estimates were imported into the engine.
- Added permanent `docs/catalog-maintenance.md` and temporary `MUSE-HANDOFF.md` with AGENTS/README pointers. Muse must store and verify an external durable copy before deleting the temporary handoff and pointers. The technical guide/tooling/reports remain.
- Model refresh now uses America/Chicago dates consistently. The fresh report flags 22 entries for review, including parser refusals and context discrepancies. No model facts or editorial tiers were changed from these flags.

## Source checks

Primary sources checked October 10. The expansion records per-field URLs and verification dates, including announcement links for release years.

- NVIDIA Ampere GA102 architecture whitepaper v2.1, tables 2, 3, 9, 10: https://www.nvidia.com/content/PDF/nvidia-ampere-ga-102-gpu-architecture-whitepaper-v2.1.pdf
- NVIDIA workstation datasheets: https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/nvidia-rtx-a4000-datasheet.pdf ; https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/nvidia-rtx-a5000-datasheet.pdf ; https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/nvidia-rtx-a6000-datasheet.pdf
- RTX 6000 Ada datasheet: https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/rtx-6000/proviz-print-rtx6000-datasheet-web-2504660.pdf
- AMD individual product pages, GPU memory and FP16 vector fields: https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6800.html (and the individual 6000/7000-series links in the expansion). The new RDNA 3 pages distinguish FP16 vector from matrix values; the engine input uses vector peaks.
- Competitive discovery, 194 names, source data marked October 8: https://localanalysis.ai/open-data/ ; https://localanalysis.ai/open-data/files/devices.json . Local Analysis (2026), CC BY 4.0. Saved only IDs/names/families/laptop flags for discovery; preserve attribution.

## Validation

Typecheck, lint, 214 unit tests and the production build pass. The new tests evaluate every added configuration, check evidence/price/runtime restrictions and memory-pool behavior, preserve exact context-sweep output, exclude invalid chart points, verify deterministic audit output and cover GPU detection.

Browser checks at 1280×900 and 390×844: search A6000 returns its two reference builds; source disclosure shows vendor facts and compute/CPU/RAM assumptions; hardware spec chart updates with filtering; comparison metric controls update values; context chart switches metrics and displays unavailable points. Mobile SVG uses a separate compact coordinate system so axis labels remain readable. Document body does not overflow the viewport; tables retain horizontal scrolling. Desktop and mobile proof files: `comparison-desktop.png`, `context-mobile.png`.

## Still unverified / not implemented

This batch does not claim every competitor device is now covered. The generated queue has 141 names without an automatic match; some may be aliases or bins already partly represented. Legacy records have 260 evidence review items, including price provenance; do not auto-fill them. The 22 model-refresh flags require source/parser triage and human decisions before factual updates. No new empirical inference measurements, account/database integration verification or calibrated error-band coverage was performed. No production deployment was performed.
