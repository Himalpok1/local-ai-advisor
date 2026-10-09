# Model catalog refresh — 2026-10-09

Compared 41 curated models with their Hugging Face config.json. 19 need a look.

| Model | Repo | Result | Downloads |
|---|---|---|---|
| Qwen3.8 27B | Qwen/Qwen3.8-27B | ✓ matches | 6,783,589 |
| Qwen3.6 27B | Qwen/Qwen3.6-27B | ✓ matches | 2,276,333 |
| Qwen3.6 35B-A3B | Qwen/Qwen3.6-35B-A3B | ✓ matches | 3,554,896 |
| Qwen3.5 27B | Qwen/Qwen3.5-27B | ✓ matches | 1,880,044 |
| Qwen3.5 35B-A3B | Qwen/Qwen3.5-35B-A3B | ✓ matches | 1,478,513 |
| Qwen3.5 122B-A10B | Qwen/Qwen3.5-122B-A10B | ✓ matches | 602,190 |
| Qwen3.5 9B | Qwen/Qwen3.5-9B | ✓ matches | 8,386,311 |
| Qwen3.5 4B | Qwen/Qwen3.5-4B | ✓ matches | 8,018,081 |
| Qwen3-Coder 30B-A3B Instruct | Qwen/Qwen3-Coder-30B-A3B-Instruct | ✓ matches | 398,363 |
| Qwen3 30B-A3B Instruct 2507 | Qwen/Qwen3-30B-A3B-Instruct-2507 | ✓ matches | 950,290 |
| Qwen3-Next 80B-A3B Instruct | Qwen/Qwen3-Next-80B-A3B-Instruct | ✓ matches | 256,721 |
| Qwen3 32B | Qwen/Qwen3-32B | ⚠ config native 40960 (catalog 32768) | 3,594,280 |
| Qwen3 14B | Qwen/Qwen3-14B | ⚠ config native 40960 (catalog 32768) | 5,064,620 |
| Qwen3 8B | Qwen/Qwen3-8B | ⚠ config native 40960 (catalog 32768) | 9,983,563 |
| Qwen2.5-Coder 32B Instruct | Qwen/Qwen2.5-Coder-32B-Instruct | ✓ matches | 841,117 |
| Qwen2.5-Coder 7B Instruct | Qwen/Qwen2.5-Coder-7B-Instruct | ✓ matches | 1,952,637 |
| Gemma 4 31B | google/gemma-4-31B-it | ✓ matches | 9,588,358 |
| Gemma 4 26B-A4B | google/gemma-4-26B-A4B-it | ✓ matches | 12,060,213 |
| Gemma 4 12B | google/gemma-4-12B-it | ✓ matches | 1,633,695 |
| Gemma 4 E4B | google/gemma-4-E4B-it | ✓ matches | 4,338,155 |
| Gemma 3 27B | unsloth/gemma-3-27b-it | ⚠ couldn't read (gated or moved) | |
| gpt-oss-20b | openai/gpt-oss-20b | ⚠ couldn't read (gated or moved) | |
| gpt-oss-120b | openai/gpt-oss-120b | ⚠ config native 4096, rope-extended 131072 (catalog 131072) | 3,965,343 |
| Devstral Small 2 (24B) | mistralai/Devstral-Small-2-24B-Instruct-2512 | ⚠ config native 393216 (catalog 262144) | 290,699 |
| Mistral Small 3.2 (24B) | mistralai/Mistral-Small-3.2-24B-Instruct-2506 | ✓ matches | 258,111 |
| Mistral Small 4 (119B-A6.5B) | mistralai/Mistral-Small-4-119B-2603 | ⚠ config native 1048576 (catalog 262144) | 79,656 |
| GLM-4.7-Flash (30B-A3B) | zai-org/GLM-4.7-Flash | ⚠ couldn't read (gated or moved) | |
| GLM-4.5-Air (106B-A12B) | zai-org/GLM-4.5-Air | ⚠ couldn't read (gated or moved) | |
| GLM-4.6V-Flash (10B) | zai-org/GLM-4.6V-Flash | ✓ matches | 108,820 |
| GLM-5.3 (753B-A40B) | zai-org/GLM-5.3 | ✓ matches | 1,648,104 |
| GLM-5.3-Flash (320B-A18B) | zai-org/GLM-5.3-Flash | ⚠ parse error: [
  {
    "origin": "number",
    "code": "too_small",
    "minimum": 0,
    "inclusive": false,
    "path": [
      "architecture",
      "headDim"
    ],
    "message": "Too small: expected number to be >0"
  }
] | |
| Llama 3.3 70B Instruct | unsloth/Llama-3.3-70B-Instruct | ⚠ config native 8192, rope-extended 131072 (catalog 131072) | 49,570 |
| Llama 4 Scout (109B-A17B) | unsloth/Llama-4-Scout-17B-16E-Instruct | ⚠ couldn't read (gated or moved) | |
| Llama 3.1 8B Instruct | unsloth/Llama-3.1-8B-Instruct | ⚠ couldn't read (gated or moved) | |
| Llama 3.2 3B Instruct | unsloth/Llama-3.2-3B-Instruct | ⚠ couldn't read (gated or moved) | |
| Muse Glimmer (30B) | meta-models/Muse-Glimmer-30B | ✓ matches | 259,208 |
| Phi-4 (14B) | microsoft/phi-4 | ✓ matches | 379,710 |
| DeepSeek-R1-0528-Qwen3-8B | deepseek-ai/DeepSeek-R1-0528-Qwen3-8B | ⚠ couldn't read (gated or moved) | |
| DeepSeek-V4-Flash (284B-A13B) | deepseek-ai/DeepSeek-V4-Flash | ⚠ couldn't read (gated or moved) | |
| DeepSeek-V4.1-Flash (748B-A16B) | deepseek-ai/DeepSeek-V4.1-Flash | ⚠ config native 65536, rope-extended 1048576 (catalog 1048576) | 1,316,468 |
| Kolibri-1 (78B-A3.5B) | Aleph-Alpha/Kolibri-1 | ⚠ couldn't read (gated or moved) | |

## Trending text-generation models not in the catalog

- [Qwen/Qwen3-0.6B](https://huggingface.co/Qwen/Qwen3-0.6B) — 30,889,504 downloads, 1757 likes
- [meta-llama/Llama-3.2-1B-Instruct](https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct) — 7,154,415 downloads, 1803 likes
- [meta-llama/Meta-Llama-3-8B-Instruct](https://huggingface.co/meta-llama/Meta-Llama-3-8B-Instruct) — 814,610 downloads, 5275 likes
- [meta-llama/Llama-3.1-8B](https://huggingface.co/meta-llama/Llama-3.1-8B) — 679,200 downloads, 2622 likes
- [autotrust/JEV-9B](https://huggingface.co/autotrust/JEV-9B) — 331,233 downloads, 155 likes
- [ornith-ai/Ornith-1.5-35B-A3B](https://huggingface.co/ornith-ai/Ornith-1.5-35B-A3B) — 266,052 downloads, 713 likes
- [autotrust/JEV-27B](https://huggingface.co/autotrust/JEV-27B) — 176,040 downloads, 72 likes
- [Cactus-Compute/needle3](https://huggingface.co/Cactus-Compute/needle3) — 125,666 downloads, 319 likes
- [bosonai/higgs-tts-3-4b](https://huggingface.co/bosonai/higgs-tts-3-4b) — 102,581 downloads, 800 likes
- [dealignai/GLM-5.3-CYBERSECURITY-FP8](https://huggingface.co/dealignai/GLM-5.3-CYBERSECURITY-FP8) — 97,408 downloads, 648 likes
- [XiaomiMiMo/MiMo-V2.6-Pro-RL](https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Pro-RL) — 94,175 downloads, 678 likes
- [XHToken/Spark-X2.5-4B](https://huggingface.co/XHToken/Spark-X2.5-4B) — 29,885 downloads, 1386 likes
- [jialinyyzz/humanizer](https://huggingface.co/jialinyyzz/humanizer) — 29,470 downloads, 704 likes

_Generated by scripts/refresh-models.mts. Review before editing data/models.ts._

## Reviewer notes (Ray, 2026-10-09)

- First script pass hit HF rate limits (23 repos "couldn't read" though all return HTTP 200); a
  second pass 2 min later reduced this to 9 transient misses. All 41 catalog entries were read on at
  least one pass; no config values changed vs 2026-10-08.
- The recurring "config native ≠ catalog" flags (Qwen3 8B/14B/32B, Devstral Small 2, Mistral Small 4,
  gpt-oss-120b, DeepSeek-V4.1-Flash, Llama family) are intentional: the catalog stores the
  advertised/supported context window. Mistral Small 4's model card explicitly states "256k context
  length" (catalog 262144) — confirmed on the HF model card today.
- GLM-5.3-Flash "parse error" is a known script limitation (architecture nested under `text_config`
  with `head_dim: 0`); catalog values match the Z.ai model card.
- Watched, not added: Mistral Large 4 (1.05T-A49B, API preview live Oct 6, weights planned ~Oct 27 —
  HF repo still gated) and Reflection Beam (501B-A23B, weights expected later in October, no HF repo
  yet). Also watched: Liquid AI d1-3B / d1-omni-600M (decision models, Oct 7, on HF) — a new model
  category that doesn't fit the catalog's chat/coding schema; not added.
- Runtimes updated today (data/runtimes.ts): Ollama v0.35.0 decision-models API (`/v1/systemone`,
  https://github.com/ollama/ollama/releases/tag/v0.35.0); llama.cpp decision-model serving since build
  11361 (https://huggingface.co/blog/ggml-org/decision-models-in-llamacpp). Both sources re-verified
  2026-10-09. New runtime NOT added: Windows ML llama.cpp integration (Oct 8, NPU routing on Copilot+
  PCs) — cataloging it would need invented efficiency numbers; noted for the weekly audit.
- Hardware: no changes. GPU price-spike headlines (RTX 5090 $7k+ on marketplaces) are volatile third-party
  listings, not dated vendor/retailer prices — per policy no basePrice edits. MacBook Neo (Mar 2026,
  A18 Pro) is still missing from the Apple Silicon chip table; flagged for the weekly audit since chip
  TFLOPS has no primary source.
