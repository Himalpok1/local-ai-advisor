# Local AI Advisor — Source Research Findings

Compiled 2026-09-30. Only numbers that were actually read in the cited source are recorded. Anything I could not confirm is marked **UNVERIFIED**.
Caveat: pages were read through a summarizing fetch tool, so before shipping, spot-check the quoted values against the live page.

---

## 1. VERIFIED BENCHMARKS

### 1a. Apple Silicon, llama.cpp Metal: LLaMA 7B v2, pp512 / tg128 (t/s)
Source: https://github.com/ggml-org/llama.cpp/discussions/4167. Reference build 8e672ef (2023-11-21). The table has been updated by the community since then: rows were added over time, and newer chips were measured on newer builds.
PP = prompt processing (pp512, prefill). TG = text generation (tg128, batch size 1).

| Chip | GPU cores | BW GB/s | F16 PP | F16 TG | Q8_0 PP | Q8_0 TG | Q4_0 PP | Q4_0 TG |
|---|---|---|---|---|---|---|---|---|
| M1 | 7 | 68 | – | – | 108.21 | 7.92 | 107.81 | 14.19 |
| M1 | 8 | 68 | – | – | 117.25 | 7.91 | 117.96 | 14.15 |
| M1 Pro | 14 | 200 | 262.65 | 12.75 | 235.16 | 21.95 | 232.55 | 35.52 |
| M1 Pro | 16 | 200 | 302.14 | 12.75 | 270.37 | 22.34 | 266.25 | 36.41 |
| M1 Max | 24 | 400 | 453.03 | 22.55 | 405.87 | 37.81 | 400.26 | 54.61 |
| M1 Max | 32 | 400 | 599.53 | 23.03 | 537.37 | 40.20 | 530.06 | 61.19 |
| M1 Ultra | 48 | 800 | 875.81 | 33.92 | 783.45 | 55.69 | 772.24 | 74.93 |
| M1 Ultra | 64 | 800 | 1168.89 | 37.01 | 1042.95 | 59.87 | 1030.04 | 83.73 |
| M2 | 8 | 100 | – | – | 147.27 | 12.18 | 145.91 | 21.70 |
| M2 | 10 | 100 | 201.34 | 6.72 | 181.40 | 12.21 | 179.57 | 21.91 |
| M2 Pro | 16 | 200 | 312.65 | 12.47 | 288.46 | 22.70 | 294.24 | 37.87 |
| M2 Pro | 19 | 200 | 384.38 | 13.06 | 344.50 | 23.01 | 341.19 | 38.86 |
| M2 Max | 30 | 400 | 600.46 | 24.16 | 540.15 | 39.97 | 537.60 | 60.99 |
| M2 Max | 38 | 400 | 755.67 | 24.65 | 677.91 | 41.83 | 671.31 | 65.95 |
| M2 Ultra | 60 | 800 | 1128.59 | 39.86 | 1003.16 | 62.14 | 1013.81 | 88.64 |
| M2 Ultra | 76 | 800 | 1401.85 | 41.02 | 1248.59 | 66.64 | 1238.48 | 94.27 |
| M3 | 10 | 100 | – | – | 187.52 | 12.27 | 186.75 | 21.34 |
| M3 Pro | 14 | 150 | – | – | 272.11 | 17.44 | 269.49 | 30.65 |
| M3 Pro | 18 | 150 | 357.45 | 9.89 | 344.66 | 17.53 | 341.67 | 30.74 |
| M3 Max | 30 | 300 | 589.41 | 19.54 | 566.40 | 34.30 | 567.59 | 56.58 |
| M3 Max | 40 | 400 | 779.17 | 25.09 | 757.64 | 42.75 | 759.70 | 66.31 |
| M3 Ultra | 60 | 800 | 1121.80 | 42.24 | 1085.76 | 63.55 | 1073.09 | 88.40 |
| M3 Ultra | 80 | 800 | 1538.34 | 39.78 | 1487.51 | 63.93 | 1471.24 | 92.14 |
| M4 | 10 | 120 | 230.18 | 7.43 | 223.64 | 13.54 | 221.29 | 24.11 |
| M4 Pro | 16 | 273 | 381.14 | 17.19 | 367.13 | 30.54 | 364.06 | 49.64 |
| M4 Pro | 20 | 273 | 464.48 | 17.18 | 449.62 | 30.69 | 439.78 | 50.74 |
| M4 Max | 32 | 410 | 736.25 | 24.29 | 718.56 | 43.87 | 713.93 | 69.95 |
| M4 Max | 40 | 546 | 922.83 | 31.64 | 891.94 | 54.05 | 885.68 | 83.06 |

- M5 / M5 Pro / M5 Max / M5 Ultra / M6 rows: **not present** in the extracted table, so **UNVERIFIED**.
- The table lists M3 Ultra at 800 GB/s. Apple's figure is "over 800GB/s"; the commonly quoted 819 GB/s is **UNVERIFIED** (I did not read it on an Apple page this session).

### 1b. NVIDIA CUDA scoreboard: Llama 2 7B Q4_0, pp512 / tg128
Source: https://github.com/ggml-org/llama.cpp/discussions/15013 (opened 2025-08-01, ongoing; per-row build hashes shown).

| GPU | pp512 t/s | tg128 t/s | build |
|---|---|---|---|
| RTX PRO 6000 Blackwell | 14854.63 | 274.20 | 79c1160 |
| RTX 5090 | 14073.41 | 290.02 | 8cf6b42 |
| RTX 4090 | 11992.70 | 186.21 | 2241453 |
| H100 80GB | 9918.34 | 267.81 | 5143fa8 |
| RTX 5080 | 8297.36 | 181.99 | 8a4280c |
| RTX 5070 Ti | 6952.38 | 176.85 | 933414c |
| RTX 3090 | 5174.69 | 158.16 | c76b420 |
| A100 80GB | 4849.53 | 190.88 | 5143fa8 |
| RTX 5060 Ti | 3737.25 | 90.94 | 89d1029 |
| DGX Spark (GB10) | 3062.31 | 57.21 | 5acd455 |

### 1c. Vulkan scoreboard: Llama 2 7B Q4_0, pp512 / tg128
Source: https://github.com/ggml-org/llama.cpp/discussions/10879 (per-row build hashes; dates not extracted)

| GPU | pp512 | tg128 | build |
|---|---|---|---|
| RTX 5090 (Vulkan) | 10381.64 | 263.63 | ca71fb9 |
| RTX 4090 (Vulkan) | 9452.03 | 187.97 | 4ae88d0 |
| Radeon AI PRO R9700 | 5609.82 | 145.67 | dd1ea52 |
| RX 9070 XT | 5036.04 | 137.11 | e9fd8dc |
| RTX 3090 (Vulkan) | 4666.15 | 164.05 | d05fe1d |
| RX 7900 XTX | 3726.99 | 182.63 | 304665f |
| RX 9070 | 3164.10 | 119.71 | 21c17b5 |
| Arc A770 | 1073.85 | 52.56 | a69d54f |
| Arc B580 | 620.94 | 70.14 | 7f76692 |

### 1d. gpt-oss (MXFP4), llama.cpp
Source A: the gpt-oss guide at https://github.com/ggml-org/llama.cpp/discussions/15396 (Aug 2025). Tests: pp2048 / tg128 (the tg values came from a second extraction pass).

| Hardware | Model | Backend | pp2048 t/s | tg128 t/s |
|---|---|---|---|---|
| RTX 5090 32GB | gpt-oss-20b | CUDA | 9848.38 | 282.51 |
| RTX 4090 24GB | gpt-oss-20b | CUDA | 8022.33 | 225.22 |
| RTX 4080 SUPER 16GB | gpt-oss-20b | CUDA | 8170.95 | 186.51 |
| RTX 5080 16GB | gpt-oss-20b | CUDA | 7476.55 | 204.85 |
| RTX 5070 Ti 16GB | gpt-oss-20b | CUDA | 6339.76 | 189.45 |
| RTX 3090 24GB | gpt-oss-20b | CUDA | 5170.56 | 161.77 |
| RTX 5060 Ti 16GB | gpt-oss-20b | CUDA | (not extracted) | 111.51 |
| RTX 3060 12GB | gpt-oss-20b | CUDA | 2229.95 | 30.64 (community) |
| RX 7900 XT 20GB | gpt-oss-20b (listed as BF16) | ROCm | 4251.56 | 101.92 |
| M3 Ultra 80c 512GB | gpt-oss-20b | Metal | 2816.47 | 115.52 |
| M2 Ultra 76c 192GB | gpt-oss-20b | Metal | 2191.13 | 116.08 |
| M4 Max 36GB | gpt-oss-20b | Metal | 1277.42 | 92.36 |
| M1 Max 64GB | gpt-oss-20b | Metal | 994.75 | 75.15 |
| M1 Pro 32GB | gpt-oss-20b | Metal | 515.76 | 45.68 |
| RTX PRO 6000 96GB | gpt-oss-120b | CUDA | 5518.07 | 196.31 |
| RTX PRO 6000 Max-Q 96GB | gpt-oss-120b | CUDA | – | 170.62 |
| M2 Ultra 192GB | gpt-oss-120b | Metal | – | 79.68 |

Source B: DGX Spark, discussion https://github.com/ggml-org/llama.cpp/discussions/16578 (2025-10-14, build b6761). Tests: pp2048 / tg32.
- gpt-oss-20b: pp2048 2130.79, tg32 62.68 (@d4096: 1846.66 / 56.86)
- gpt-oss-120b: pp2048 1344.28, tg32 35.40 (@d4096: 1272.62 / 31.58)

Source C: official repo bench files, newer builds (2026), pp2048 / tg32, flash attention on.
| Model | DGX Spark pp2048 / tg32 (build 7941) | M2 Ultra pp2048 / tg32 (build 7948) |
|---|---|---|
| gpt-oss-20b MXFP4 | 4505.82 / 83.43 | 2713.40 / 129.97 |
| gpt-oss-120b MXFP4 | 2443.91 / 58.72 | 1648.69 / 85.60 |
| Qwen3-Coder-30B-A3B Q8_0 | 2986.97 / 61.06 | 2453.11 / 78.97 |
| Qwen2.5-Coder-7B Q8_0 | 2250.28 / 29.43 | 1565.91 / 79.68 |
| gemma-3-4b Q4_0 | 5948.74 / 81.05 | 2923.59 / 134.28 |
| GLM-4.7-Flash Q8_0 | 2364.18 / 48.68 | 1629.33 / 59.58 |
URLs: https://github.com/ggml-org/llama.cpp/blob/master/benches/dgx-spark/dgx-spark.md and https://github.com/ggml-org/llama.cpp/blob/master/benches/mac-m2-ultra/mac-m2-ultra.md
Note: DGX Spark nearly doubled between b6761 and b7941, so the app should treat benchmark numbers as build-dependent.

### 1e. AMD Strix Halo (Ryzen AI Max+ 395, Radeon 8060S, 40 CU)
- https://llm-tracker.info/AMD-Strix-Halo-(Ryzen-AI-Max+-395)-GPU-Performance (2025-05-17). Results are pp512 / tg128:
  - Llama 2 7B Q4_0: Vulkan 881.71 / 52.22; Vulkan+FA 884.20 / 52.73; HIP+WMMA+FA 343.91 / 50.88; CPU 294.64 / 28.94
  - Llama 4 Scout 109B (Vulkan): 102.61 / 20.23
  - Memory: 256 GB/s theoretical (DDR5-8000, 256-bit); about 212 GB/s measured
- https://strixhalo.wiki/AI/llamacpp-performance/: Qwen3-30B-A3B UD-Q4_K_XL, pp512 / tg128: Vulkan RADV 755.14 / 85.11; Vulkan AMDVLK 741.60 / 81.79; ROCm 650.59 / 64.17
- gpt-oss-120b on Strix Halo: no number extracted, so **UNVERIFIED**.

### 1f. MLX benchmarks
None were collected this session (**UNVERIFIED**). Apple's own claims are marketing ratios, not tok/s values (see section 2).

---

## 2. APPLE LINEUP (as of 2026-09-30)

| Chip | Machines | CPU | GPU cores | Max mem | BW GB/s | Released | Source |
|---|---|---|---|---|---|---|---|
| M5 | MacBook Pro 14 (2025), MacBook Air 13/15 (avail. 2026-03-11) | 10 (4S+6E) | 10 | 16/24/32GB | 153 | 2025 (MBP) | https://support.apple.com/en-us/125405 , https://www.apple.com/newsroom/2026/03/apple-introduces-the-new-macbook-air-with-m5/ |
| M5 Pro | MBP 14/16 (avail. 2026-03-11); Mac mini (avail. 2026-09-22) | 15 or 18 | 16 or 20 | 24GB base, up to 64GB | 307 | 2026-03 | https://support.apple.com/en-us/126318 |
| M5 Max (32c GPU) | MBP 14/16 | 18 | 32 | 36GB base | 460 | 2026-03 | same |
| M5 Max (40c GPU) | MBP 14/16; Mac Studio (avail. 2026-09-22) | 18 | 40 | up to 128GB | 614 | 2026-03 | same + Mac Studio PR |
| M5 Ultra | Mac Studio (avail. 2026-09-22; 512GB config late Oct) | up to 36 | up to 80 | up to 512GB | 1.2 TB/s | 2026-08-25 ann. | https://www.apple.com/newsroom/2026/08/apple-introduces-new-mac-studio-with-m5-max-and-m5-ultra/ |
| **M6** | Mac mini (avail. 2026-09-22, $899) | 12 | 12 | 16GB base, up to 32GB | up to 170 | 2026-08-25 ann. | https://www.apple.com/newsroom/2026/09/the-new-mac-mini-and-mac-studio-are-available-today/ |

- M5-generation GPUs include "Neural Accelerators" in every GPU core.
- Apple's marketing claims (verbatim):
  - M5 Pro: "Up to 4x faster LLM prompt processing than M4 Pro and M4 Max"
  - M5 Max: "Up to 4x faster than MacBook Pro with M4 Max"
  - Mac Studio M5 Max: "3.9x faster than M4 Max" (LM Studio prompt processing)
  - M5 Ultra: "up to 4x faster than M3 Ultra"
  - These are prompt-processing (prefill) claims, not decode.
- M4 family (from the llama.cpp 4167 table): M4 120, M4 Pro 273, M4 Max 32c 410, M4 Max 40c 546 GB/s. Apple says M4 Max is "over half a terabyte per second" (https://www.apple.com/newsroom/2025/03/apple-unveils-new-mac-studio-the-most-powerful-mac-ever/).
- M3 Ultra: Apple says "over 800GB/s", up to 80-core GPU and 512GB (same 2025-03-05 PR). The exact "819 GB/s" figure is **UNVERIFIED** this session.
- Apple Mac pricing (USD): MBP 14 M5 $1,699; MBP 14 M5 Pro $2,199; MBP 16 M5 Pro $2,699; MBP 14 M5 Max $3,599; MBP 16 M5 Max $3,899; Mac Studio M5 Max $2,499; Mac Studio M5 Ultra $5,499; Mac mini M6 $899; Mac mini M5 Pro $1,699.
- An M6 Pro, M6 Max, MacBook with M6, or an M5 iMac: **UNVERIFIED** / not seen.

---

## 3. PC / OTHER HARDWARE

| Device | Memory | BW GB/s | Source |
|---|---|---|---|
| RTX 5090 | 32GB GDDR7 | 1792 | search summary of spec sites (e.g. https://www.techspot.com/specs/gpu/303357-nvidia-geforce-rtx-5090.html) |
| RTX 5080 | 16GB GDDR7 | 960 | same search (https://www.techradar.com/computing/gpu/nvidia-rtx-5080-vs-rtx-5070-ti) |
| RTX 5070 Ti | 16GB GDDR7 | 896 | https://videocardz.com/newz/nvidia-confirms-full-geforce-rtx-5070-ti-specifications-featuring-gb203-and-gb205-gpus |
| RTX 5070 | 12GB GDDR7 | 672 | same |
| RTX 5060 Ti | 8 or 16GB GDDR7 | 448 | https://www.tomshardware.com/pc-components/gpus/rtx-5070-vs-rtx-5060-ti-16gb |
| RTX PRO 6000 Blackwell | 96GB | 1792 | https://ifactoryapp.com/sap-integration/on-prem-ai/dgx-spark-vs-rtx-pro-6000-blackwell (secondary) |
| DGX Spark (GB10) | 128GB unified | 273 | same (secondary) |
| Ryzen AI Max+ 395 | up to 128GB unified | 256 theoretical (~212 measured) | llm-tracker link above |
| Radeon AI PRO R9700 | 32GB | 640 | secondary search result (https://www.lucebox.com/cards-comparator) |
| Arc Pro B60 | 24GB | 456 | secondary search result |
| RX 9070 XT | 16GB | **UNVERIFIED** (widely cited as 640) | – |
| Arc B580 | 12GB | **UNVERIFIED** (widely cited as 456) | – |

- RTX 50 SUPER (3GB GDDR7 modules, about +50% VRAM) is still **rumored**, with launch tipped for Q4 2026 or Q1 2027. It was not launched as of research (https://www.tomshardware.com/pc-components/gpus/nvidia-is-reportedly-still-planning-fabled-rtx-50-super-series-for-2026-leak-claims-lineup-could-now-include-a-potential-rtx-5060-super-with-12gb-of-vram). **UNVERIFIED**.
- Bandwidth figures for the RTX PRO 6000, DGX Spark, R9700 and B60 come from secondary sources. Before shipping, re-confirm them on the nvidia.com, amd.com and intel.com spec pages.

---

## 4. OPEN-WEIGHT MODELS (2026)

| Model | Total / active | Context | License | Released | URL |
|---|---|---|---|---|---|
| Qwen3-Next-80B-A3B | 80B / 3B | **UNVERIFIED** | Apache-2.0 | 2025-09-11 | https://github.com/QwenLM/Qwen3.8 (timeline) |
| Qwen3.5-397B-A17B | 397B / 17B | – | Apache-2.0 (repo) | 2026-02-16 | https://github.com/QwenLM/Qwen3.8 |
| Qwen3.5-122B-A10B | 122B / 10B | – | Apache-2.0 | 2026-02-24 | same |
| Qwen3.5-35B-A3B | 35B / 3B | – | Apache-2.0 | 2026-02-24 | same |
| Qwen3.5-27B | 27B dense | – | Apache-2.0 | 2026-02-24 | https://huggingface.co/Qwen/Qwen3.5-27B |
| Qwen3.5-9B / 4B / 2B / 0.8B | dense | – | Apache-2.0 | 2026-03-02 | https://huggingface.co/Qwen/Qwen3.5-9B |
| Qwen3.6-35B-A3B | 35B / 3B (inferred from name) | – | Apache-2.0 | 2026-04-16 | Qwen3.8 repo |
| Qwen3.6-27B | 27B dense | – | Apache-2.0 | 2026-04-22 | Qwen3.8 repo |
| Qwen3.8-27B | 27B dense | 262,144 (per repo deploy examples) | Apache-2.0 | 2026-08-14 | Qwen3.8 repo |
| Qwen3.8-2.4T-A95B | 2.4T / 95B | – | Apache-2.0 | 2026-08-12 | Qwen3.8 repo |
| Gemma 4 (E2B, E4B, 12B, 26B-A4B MoE, 31B dense) | 26B/4B active for the MoE | 128K (E2B/E4B), 256K (26B, 31B) | Apache 2.0 | 2026-04-02 | https://huggingface.co/google/gemma-4-31B-it , https://ai.google.dev/gemma/docs/core/model_card_4 |
| Mistral Small 4 | 119B MoE (active **UNVERIFIED**) | – | open (Apache **UNVERIFIED**) | 2026-03-16 | https://simonwillison.net/2026/Mar/16/mistral-small-4/ |
| Devstral Small 2 | 24B | – | – | 2025-12 | https://huggingface.co/mistralai/Devstral-Small-2-24B-Instruct-2512 |
| Devstral 2 | 123B | – | – | 2025-12 | https://huggingface.co/mistralai/Devstral-2-123B-Instruct-2512 |
| Mistral Medium 3.5 | 128B | – | – | 2026 | https://huggingface.co/mistralai/Mistral-Medium-3.5-128B (it replaced Devstral 2 in Mistral Vibe) |
| GLM-4.7-Flash | 30B-A3B MoE | – | – | ~2026-01 (**UNVERIFIED** month) | https://huggingface.co/zai-org/GLM-4.7-Flash |
| gpt-oss-20b / 120b | 21B/3.6B and 117B/5.1B (**UNVERIFIED** this session) | 128K (**UNVERIFIED**) | Apache-2.0 (**UNVERIFIED**) | 2025-08 | https://huggingface.co/openai/gpt-oss-20b |

Not verified this session:
- Qwen3 8B/14B/32B/30B-A3B and Qwen3-Coder-30B-A3B specs (released 2025-04 and 2025-07 respectively per general knowledge, so **UNVERIFIED**)
- Llama 4 Scout (109B total per the llm-tracker benchmark page; other specs not checked)
- DeepSeek latest
- Phi-4
- GLM-5 / GLM-4.6/4.7 Air
- Context lengths for most of the Qwen3.5/3.6 models

---

## 5. TOOL LOCAL-MODEL SUPPORT

| Tool | Local support | Doc URL | Status |
|---|---|---|---|
| Claude Code | `ANTHROPIC_BASE_URL` pointed at an Anthropic-compatible `/v1/messages` server | – | Works with the runtimes below. Each runtime vendor documents this; Anthropic does not support it. |
| Ollama → Claude Code | **Yes**: `/v1/messages`. Env `ANTHROPIC_AUTH_TOKEN=ollama`, `ANTHROPIC_BASE_URL=http://localhost:11434`. Limits: no `count_tokens`, no prompt caching, batches or citations; tool_choice partial; `budget_tokens` not enforced. | https://docs.ollama.com/api/anthropic-compatibility | Official (Ollama). Version and date added **UNVERIFIED**. |
| llama.cpp → Claude Code | **Yes**: llama-server has `/v1/messages` and `/v1/messages/count_tokens`, plus tools, vision, thinking and SSE. Run `ANTHROPIC_BASE_URL=http://127.0.0.1:8080 claude`. Needs `--jinja` for tools. | https://huggingface.co/blog/ggml-org/anthropic-messages-api-in-llamacpp (2026-01-19); PR https://github.com/ggml-org/llama.cpp/pull/17570 | Official (ggml-org) |
| LM Studio → Claude Code | **Yes**: `/v1/messages` since v0.4.1 (about 2026-01-30). `ANTHROPIC_BASE_URL=http://localhost:1234`, `ANTHROPIC_AUTH_TOKEN=lmstudio`. Supports GGUF and MLX. | https://lmstudio.ai/docs/integrations/claude-code , https://lmstudio.ai/blog/claudecode | Official (LM Studio) |
| Lemonade → Claude Code | **Yes**: `/v1/messages`. Default port 13305. | https://lemonade-server.ai/docs/api/anthropic/ | Official (Lemonade) |
| Codex CLI | `--oss` flag; `--local-provider`; config `oss_provider = "ollama"` or `"lmstudio"`; custom `[model_providers.x] base_url=…` with `wire_api = "responses"` or `"chat"` | https://learn.chatgpt.com/docs/config-file/config-advanced (formerly developers.openai.com/codex/config-advanced) | Official |
| Pi coding agent (badlogic/pi-mono; npm `@earendil-works/pi-coding-agent`) | `pi-ai` is a "Unified multi-provider LLM API (OpenAI, Anthropic, Google, etc.)". Local providers not stated on the README, so **UNVERIFIED**. | https://github.com/badlogic/pi-mono | – |
| OpenCode, Aider, Continue, Cline, Roo Code, Open WebUI | Not fetched this session, so **UNVERIFIED**. Probable doc URLs: https://opencode.ai/docs/providers , https://aider.chat/docs/llms/ollama.html , https://docs.continue.dev , https://docs.cline.bot , https://docs.roocode.com , https://docs.openwebui.com | – | **UNVERIFIED** |

---

## 6. RUNTIMES

| Runtime | Platforms / backends (verified items only) | OpenAI API | Anthropic API | Doc |
|---|---|---|---|---|
| llama.cpp (llama-server) | Metal, CUDA, Vulkan, ROCm/HIP, CPU (all seen in the benchmark discussions above) | yes | yes (2026-01) | https://huggingface.co/blog/ggml-org/anthropic-messages-api-in-llamacpp |
| Ollama | **UNVERIFIED** backend list | yes (`/v1`, per Codex config example) | yes | https://docs.ollama.com/api/anthropic-compatibility |
| LM Studio | GGUF (llama.cpp) and MLX | yes | yes (v0.4.1) | https://lmstudio.ai/docs/integrations/claude-code |
| MLX / MLX-LM | Apple Silicon only | **UNVERIFIED** (mlx_lm.server) | **UNVERIFIED** | https://github.com/ml-explore/mlx-lm |
| vLLM + vllm-metal | vllm-metal is a "Community maintained hardware plugin for vLLM on Apple Silicon" in the vllm-project org. Uses MLX/mlx_lm layers, a paged varlen kernel, and "M5 NAX prefill". Requires macOS 15+. | yes (vLLM server) | **UNVERIFIED** | https://github.com/vllm-project/vllm-metal |
| Lemonade (AMD) | Manages llama.cpp and FastFlowLM across GPU, NPU and CPU | yes (`/api/v1` and `/v1`) | yes (`/v1/messages`) | https://lemonade-server.ai/docs/api/anthropic/ |
| SGLang, Jan, LocalAI | not fetched | **UNVERIFIED** | **UNVERIFIED** | – |
