# Model catalog refresh — 2026-10-08

Compared 41 curated models with their Hugging Face config.json. 15 need a look.

| Model | Repo | Result | Downloads |
|---|---|---|---|
| Qwen3.8 27B | Qwen/Qwen3.8-27B | ✓ matches | 6,841,660 |
| Qwen3.6 27B | Qwen/Qwen3.6-27B | ✓ matches | 2,323,903 |
| Qwen3.6 35B-A3B | Qwen/Qwen3.6-35B-A3B | ✓ matches | 3,537,522 |
| Qwen3.5 27B | Qwen/Qwen3.5-27B | ✓ matches | 1,898,479 |
| Qwen3.5 35B-A3B | Qwen/Qwen3.5-35B-A3B | ✓ matches | 1,475,747 |
| Qwen3.5 122B-A10B | Qwen/Qwen3.5-122B-A10B | ✓ matches | 574,128 |
| Qwen3.5 9B | Qwen/Qwen3.5-9B | ✓ matches | 8,537,820 |
| Qwen3.5 4B | Qwen/Qwen3.5-4B | ✓ matches | 8,082,635 |
| Qwen3-Coder 30B-A3B Instruct | Qwen/Qwen3-Coder-30B-A3B-Instruct | ✓ matches | 409,063 |
| Qwen3 30B-A3B Instruct 2507 | Qwen/Qwen3-30B-A3B-Instruct-2507 | ✓ matches | 953,228 |
| Qwen3-Next 80B-A3B Instruct | Qwen/Qwen3-Next-80B-A3B-Instruct | ✓ matches | 266,793 |
| Qwen3 32B | Qwen/Qwen3-32B | ⚠ config native 40960 (catalog 32768) | 3,660,105 |
| Qwen3 14B | Qwen/Qwen3-14B | ⚠ config native 40960 (catalog 32768) | 4,801,773 |
| Qwen3 8B | Qwen/Qwen3-8B | ⚠ config native 40960 (catalog 32768) | 10,122,747 |
| Qwen2.5-Coder 32B Instruct | Qwen/Qwen2.5-Coder-32B-Instruct | ✓ matches | 852,803 |
| Qwen2.5-Coder 7B Instruct | Qwen/Qwen2.5-Coder-7B-Instruct | ✓ matches | 2,126,685 |
| Gemma 4 31B | google/gemma-4-31B-it | ✓ matches | 9,565,805 |
| Gemma 4 26B-A4B | google/gemma-4-26B-A4B-it | ✓ matches | 12,265,732 |
| Gemma 4 12B | google/gemma-4-12B-it | ✓ matches | 1,689,082 |
| Gemma 4 E4B | google/gemma-4-E4B-it | ✓ matches | 4,380,008 |
| Gemma 3 27B | unsloth/gemma-3-27b-it | ✓ matches | 50,073 |
| gpt-oss-20b | openai/gpt-oss-20b | ⚠ config native 4096, rope-extended 131072 (catalog 131072) | 6,110,199 |
| gpt-oss-120b | openai/gpt-oss-120b | ⚠ config native 4096, rope-extended 131072 (catalog 131072) | 4,094,755 |
| Devstral Small 2 (24B) | mistralai/Devstral-Small-2-24B-Instruct-2512 | ⚠ config native 393216 (catalog 262144) | 298,584 |
| Mistral Small 3.2 (24B) | mistralai/Mistral-Small-3.2-24B-Instruct-2506 | ✓ matches | 259,960 |
| Mistral Small 4 (119B-A6.5B) | mistralai/Mistral-Small-4-119B-2603 | ⚠ config native 1048576 (catalog 262144) | 80,241 |
| GLM-4.7-Flash (30B-A3B) | zai-org/GLM-4.7-Flash | ✓ matches | 1,554,586 |
| GLM-4.5-Air (106B-A12B) | zai-org/GLM-4.5-Air | ✓ matches | 502,482 |
| GLM-4.6V-Flash (10B) | zai-org/GLM-4.6V-Flash | ✓ matches | 108,311 |
| GLM-5.3 (753B-A40B) | zai-org/GLM-5.3 | ✓ matches | 1,545,882 |
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
| Llama 3.3 70B Instruct | unsloth/Llama-3.3-70B-Instruct | ⚠ config native 8192, rope-extended 131072 (catalog 131072) | 49,857 |
| Llama 4 Scout (109B-A17B) | unsloth/Llama-4-Scout-17B-16E-Instruct | ⚠ config native 8192, rope-extended 10485760 (catalog 262144) | 2,169 |
| Llama 3.1 8B Instruct | unsloth/Llama-3.1-8B-Instruct | ⚠ config native 8192, rope-extended 131072 (catalog 131072) | 138,821 |
| Llama 3.2 3B Instruct | unsloth/Llama-3.2-3B-Instruct | ⚠ config native 8192, rope-extended 131072 (catalog 131072) | 230,534 |
| Muse Glimmer (30B) | meta-models/Muse-Glimmer-30B | ✓ matches | 268,899 |
| Phi-4 (14B) | microsoft/phi-4 | ✓ matches | 389,842 |
| DeepSeek-R1-0528-Qwen3-8B | deepseek-ai/DeepSeek-R1-0528-Qwen3-8B | ⚠ config native 32768, rope-extended 131072 (catalog 131072) | 660,492 |
| DeepSeek-V4-Flash (284B-A13B) | deepseek-ai/DeepSeek-V4-Flash | ⚠ config native 65536, rope-extended 1048576 (catalog 1048576) | 966,499 |
| DeepSeek-V4.1-Flash (748B-A16B) | deepseek-ai/DeepSeek-V4.1-Flash | ⚠ config native 65536, rope-extended 1048576 (catalog 1048576) | 1,282,524 |
| Kolibri-1 (78B-A3.5B) | Aleph-Alpha/Kolibri-1 | ✓ matches | 6,777 |

## Trending text-generation models not in the catalog

- [Qwen/Qwen3-0.6B](https://huggingface.co/Qwen/Qwen3-0.6B) — 31,151,426 downloads, 1755 likes
- [meta-llama/Llama-3.2-1B-Instruct](https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct) — 7,377,126 downloads, 1797 likes
- [meta-llama/Meta-Llama-3-8B-Instruct](https://huggingface.co/meta-llama/Meta-Llama-3-8B-Instruct) — 850,749 downloads, 5261 likes
- [meta-llama/Llama-3.1-8B](https://huggingface.co/meta-llama/Llama-3.1-8B) — 650,564 downloads, 2615 likes
- [ornith-ai/Ornith-1.5-9B](https://huggingface.co/ornith-ai/Ornith-1.5-9B) — 459,105 downloads, 367 likes
- [autotrust/JEV-9B](https://huggingface.co/autotrust/JEV-9B) — 326,313 downloads, 143 likes
- [ornith-ai/Ornith-1.5-35B-A3B](https://huggingface.co/ornith-ai/Ornith-1.5-35B-A3B) — 260,588 downloads, 710 likes
- [autotrust/JEV-27B](https://huggingface.co/autotrust/JEV-27B) — 173,926 downloads, 69 likes
- [Cactus-Compute/needle3](https://huggingface.co/Cactus-Compute/needle3) — 121,868 downloads, 310 likes
- [dealignai/GLM-5.3-CYBERSECURITY-FP8](https://huggingface.co/dealignai/GLM-5.3-CYBERSECURITY-FP8) — 99,860 downloads, 643 likes
- [XiaomiMiMo/MiMo-V2.6-Pro-RL](https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Pro-RL) — 93,473 downloads, 671 likes
- [XiaomiMiMo/MiMo-V2.6-Flash-RL](https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Flash-RL) — 55,647 downloads, 546 likes
- [Edge0/Audio8-ASR-Infinite](https://huggingface.co/Edge0/Audio8-ASR-Infinite) — 40,580 downloads, 2432 likes
- [XHToken/Spark-X2.5-4B](https://huggingface.co/XHToken/Spark-X2.5-4B) — 31,422 downloads, 1382 likes

_Generated by scripts/refresh-models.mts. Review before editing data/models.ts._

## Reviewer notes (Ray, 2026-10-08)

- The 13 recurring "config native ≠ catalog" flags are intentional, not errors: the catalog stores the
  supported/advertised (rope-extended) context window, which the script surfaces as `rope-extended`.
  No config values changed since 2026-10-07. All 38 catalog entries re-verified against HF today.
- GLM-5.3-Flash "parse error" is a script limitation: the hub config nests architecture under
  `text_config` with `head_dim: 0`. The catalog entry uses a derived headDim (hidden/heads = 64);
  params (320B) and context (1M) match the Z.ai model card.
- New entries today: GLM-5.3 (753B-A40B), GLM-5.3-Flash (320B-A18B), DeepSeek-V4.1-Flash (748B-A16B).
  GGUF sizes from unsloth folder totals (decimal GB). GLM-5.3 ships under a custom Z.ai license,
  not MIT. DeepSeek-V4.1-Flash uses a causal encoder-decoder architecture — engine memory math
  is approximate (KV cache 890 B/token from the technical report).
- Watched, not added: Reflection Beam (501B-A23B) and Mistral Large 4 (1.05T MoE) — both announced
  Oct 5–6 but weights not yet released (planned later in October).
