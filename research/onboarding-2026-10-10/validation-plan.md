# Performance and compatibility validation protocol

Proposed, not a claim that the app has been empirically validated on all hardware. October 10, 2026.

## Reproducible measurement records

Capture source URL/raw log hash, measurement date, operator/source type, runtime commit/version, OS/driver, hardware/chip/memory, exact model revision/architecture, quant variant and actual file bytes, model format, KV type, GPU layer placement, batch/ubatch, flash attention, prefix cache policy, prompt/context/output lengths, concurrency, power/thermal mode and repeated-run spread. Separate public published measurements from consented user submissions and newly performed engineering tests. Retain source licenses/attribution; synthetic tests must never enter the measured dataset.

Use pinned model revisions and runtime builds. llama-bench raw JSON provides a compute baseline; an API request harness separately measures user-visible cold TTFT, warm TTFT and end-to-end completion latency. A cold model load, cold prompt and warm prefix-cache turn are different measurements. Warm up, perform at least five repetitions, record medians and min/max or percentiles, record sustained thermal behavior separately. Do not silently discard slow runs.

## Representative matrix

| Regime | Example catalog setup | Models / settings | Purpose |
|---|---|---|---|
| Entry unified memory | MacBook Air M4 16 GB | Small supported dense instruct; Q4/Q8; 4K/8K/32K where native | Headroom, fanless sustained use and background reserves |
| Mid unified memory | M4 Pro 48 GB | Qwen3-8B and Qwen3-Coder-30B-A3B; Q4/Q8; 8K/32K | Dense versus MoE, Metal/MLX where conversions/support verified |
| Large unified memory | M2 Ultra / Strix Halo 128 GB | Medium dense and MoE; 32K/64K/native long context | Multi-die/backend sensitivity and attention overhead |
| Discrete GPU | RTX 4090 24 GB + 64 GB RAM | Small dense all-GPU; model exceeding VRAM; Q4/Q8 | CUDA; explicitly full/25%/zero GPU placement; split-memory latency |
| AMD GPU | Catalog ROCm/Vulkan configuration | Same dense control; supported MoE | Backend calibration and driver differences |
| CPU-only | Catalog/custom CPU with measured bandwidth | Small dense Q4; 4K/8K | CPU roofline and latency floor |
| Multi-stream | One supported mid/high-memory rig | Same model; 1/2/4 requests; warm/cold prompts | Per-stream speed, aggregate throughput, TTFT contention |
| Vision-language | Supported Gemma/Qwen VLM on a feasible rig | Text-only and fixed image inputs | Vision memory overhead and token accounting |

Choose exact catalog IDs and models that currently load on each runtime. Native contexts only for core accuracy comparisons; RoPE extrapolation is a separately labeled experiment. No need to run the full Cartesian product: start with a dozen useful cells and expand where errors are greatest.

## Deterministic checks before physical runs

1. Memory increases with context/streams where architecture requires it; overhead/reserves remain accounted for; discrete VRAM and host RAM stay separate.
2. Unsupported combinations have no performance payload. Ineligible HF tasks never enter the chat engine.
3. Direct reference settings reproduce a known anchor within rounding; changing placement cannot normalize away the penalty (P0-2 regression).
4. Battery mode, runtime wrappers, quant/file format and KV changes preserve expected direction unless a documented real measurement explains an exception.
5. No direct match across incompatible quant variants, architectures or unverified runtime settings. Requests at changed context are predictions even if an anchor exists.
6. Confidence and printed ranges expose extrapolation and source limitations; capabilities are editorial/inferred rather than measured intelligence.

## Held-out evaluation without leakage

Freeze a dataset/version before computing errors. Remove the target row from both direct matching and calibration. Also hold out whole model families and chips in separate runs: row-level holdout alone can leak nearly identical configurations. Do not tune vendor factors on the same rows reported as held out. Preserve a final untouched sample before revising coefficients.

Report decode and prefill separately: signed bias, median absolute percentage error, p90 relative error, and absolute latency error for cold/warm TTFT. Stratify by backend, dense/MoE, short/long context, offload and runtime family. Mark strata with insufficient samples rather than drawing confident intervals. Fit or empirically validate uncertainty bands only after enough independent observations exist; until then call ±15/25% display bands heuristic assumptions. Show measurement spread separately from model prediction error.

Publish a versioned report with raw record references, exclusions/reasons and reproducible commands. Initial acceptance is reproducibility, honest labels and identified failure regimes, not a guessed universal error target. Agree accuracy targets after measuring the baseline; do not force estimates to pass by widening bands arbitrarily.

## Access required later

Dedicated inference hardware or consented local runs; isolated local MySQL for persistence/community integration; optional read-only Search Console for indexing evidence. Production DB credentials, migrations, analytics edits, host redirects and deployment are outside this protocol and this assignment.
