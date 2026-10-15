# Model catalog refresh — 2026-10-15

Compared 42 curated models with their Hugging Face config.json. 15 need a look.

| Model | Repo | Result | Downloads |
|---|---|---|---|
| Qwen3.8 27B | Qwen/Qwen3.8-27B | ✓ matches | 7,363,968 |
| Qwen3.6 27B | Qwen/Qwen3.6-27B | ✓ matches | 2,288,557 |
| Qwen3.6 35B-A3B | Qwen/Qwen3.6-35B-A3B | ✓ matches | 3,695,301 |
| Qwen3.5 27B | Qwen/Qwen3.5-27B | ✓ matches | 1,840,434 |
| Qwen3.5 35B-A3B | Qwen/Qwen3.5-35B-A3B | ✓ matches | 1,484,223 |
| Qwen3.5 122B-A10B | Qwen/Qwen3.5-122B-A10B | ✓ matches | 677,777 |
| Qwen3.5 9B | Qwen/Qwen3.5-9B | ✓ matches | 8,591,266 |
| Qwen3.5 4B | Qwen/Qwen3.5-4B | ✓ matches | 7,944,995 |
| Qwen3-Coder 30B-A3B Instruct | Qwen/Qwen3-Coder-30B-A3B-Instruct | ✓ matches | 422,336 |
| Qwen3 30B-A3B Instruct 2507 | Qwen/Qwen3-30B-A3B-Instruct-2507 | ✓ matches | 1,051,915 |
| Qwen3-Next 80B-A3B Instruct | Qwen/Qwen3-Next-80B-A3B-Instruct | ✓ matches | 202,355 |
| Qwen3 32B | Qwen/Qwen3-32B | ⚠ config native 40960 (catalog 32768) | 3,172,856 |
| Qwen3 14B | Qwen/Qwen3-14B | ⚠ config native 40960 (catalog 32768) | 7,308,016 |
| Qwen3 8B | Qwen/Qwen3-8B | ⚠ config native 40960 (catalog 32768) | 9,578,964 |
| Qwen2.5-Coder 32B Instruct | Qwen/Qwen2.5-Coder-32B-Instruct | ✓ matches | 740,593 |
| Qwen2.5-Coder 7B Instruct | Qwen/Qwen2.5-Coder-7B-Instruct | ✓ matches | 1,597,653 |
| Gemma 4 31B | google/gemma-4-31B-it | ✓ matches | 9,180,042 |
| Gemma 4 26B-A4B | google/gemma-4-26B-A4B-it | ✓ matches | 11,170,734 |
| Gemma 4 12B | google/gemma-4-12B-it | ✓ matches | 1,656,357 |
| Gemma 4 E4B | google/gemma-4-E4B-it | ✓ matches | 4,193,163 |
| Gemma 3 27B | unsloth/gemma-3-27b-it | ✓ matches | 50,668 |
| gpt-oss-20b | openai/gpt-oss-20b | ⚠ config native 4096, rope-extended 131072 (catalog 131072) | 5,988,822 |
| gpt-oss-120b | openai/gpt-oss-120b | ⚠ config native 4096, rope-extended 131072 (catalog 131072) | 3,423,004 |
| Devstral Small 2 (24B) | mistralai/Devstral-Small-2-24B-Instruct-2512 | ⚠ config native 393216 (catalog 262144) | 312,196 |
| Mistral Small 3.2 (24B) | mistralai/Mistral-Small-3.2-24B-Instruct-2506 | ✓ matches | 248,354 |
| Mistral Small 4 (119B-A6.5B) | mistralai/Mistral-Small-4-119B-2603 | ⚠ config native 1048576 (catalog 262144) | 74,916 |
| GLM-4.7-Flash (30B-A3B) | zai-org/GLM-4.7-Flash | ✓ matches | 1,307,102 |
| GLM-4.5-Air (106B-A12B) | zai-org/GLM-4.5-Air | ✓ matches | 701,853 |
| GLM-4.6V-Flash (10B) | zai-org/GLM-4.6V-Flash | ✓ matches | 106,665 |
| GLM-5.3 (753B-A40B) | zai-org/GLM-5.3 | ✓ matches | 1,803,969 |
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
| Llama 3.3 70B Instruct | unsloth/Llama-3.3-70B-Instruct | ⚠ config native 8192, rope-extended 131072 (catalog 131072) | 49,019 |
| Llama 4 Scout (109B-A17B) | unsloth/Llama-4-Scout-17B-16E-Instruct | ⚠ config native 8192, rope-extended 10485760 (catalog 262144) | 2,804 |
| Llama 3.1 8B Instruct | unsloth/Llama-3.1-8B-Instruct | ⚠ config native 8192, rope-extended 131072 (catalog 131072) | 155,417 |
| Llama 3.2 3B Instruct | unsloth/Llama-3.2-3B-Instruct | ⚠ config native 8192, rope-extended 131072 (catalog 131072) | 266,126 |
| Muse Glimmer (30B) | meta-models/Muse-Glimmer-30B | ✓ matches | 252,863 |
| Phi-4 (14B) | microsoft/phi-4 | ✓ matches | 363,287 |
| DeepSeek-R1-0528-Qwen3-8B | deepseek-ai/DeepSeek-R1-0528-Qwen3-8B | ⚠ config native 32768, rope-extended 131072 (catalog 131072) | 525,777 |
| DeepSeek-V4-Flash (284B-A13B) | deepseek-ai/DeepSeek-V4-Flash | ⚠ config native 65536, rope-extended 1048576 (catalog 1048576) | 805,960 |
| DeepSeek-V4.1-Flash (748B-A16B) | deepseek-ai/DeepSeek-V4.1-Flash | ⚠ config native 65536, rope-extended 1048576 (catalog 1048576) | 1,238,583 |
| Kolibri-1 (78B-A3.5B) | Aleph-Alpha/Kolibri-1 | ✓ matches | 16,805 |
| MiniCPM5 2B | openbmb/MiniCPM5-2B | ✓ matches | 1,253,288 |

## Trending text-generation models not in the catalog

- [Qwen/Qwen3-Embedding-0.6B](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B) — 8,605,583 downloads, 1291 likes
- [Qwen/Qwen2.5-0.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct) — 6,002,460 downloads, 691 likes
- [deepseek-ai/DeepSeek-R1](https://huggingface.co/deepseek-ai/DeepSeek-R1) — 1,254,482 downloads, 14382 likes
- [meta-llama/Llama-3.1-8B](https://huggingface.co/meta-llama/Llama-3.1-8B) — 678,921 downloads, 2657 likes
- [meta-llama/Meta-Llama-3-8B-Instruct](https://huggingface.co/meta-llama/Meta-Llama-3-8B-Instruct) — 613,787 downloads, 5362 likes
- [deepseek-ai/DeepSeek-V4-Pro](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro) — 383,720 downloads, 5673 likes
- [deepseek-ai/DeepSeek-R1-Distill-Qwen-7B](https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B) — 359,688 downloads, 927 likes
- [ConwayResearch/Underdog-Saluki-27B-1.0](https://huggingface.co/ConwayResearch/Underdog-Saluki-27B-1.0) — 344,177 downloads, 477 likes
- [Cactus-Compute/needle3](https://huggingface.co/Cactus-Compute/needle3) — 156,995 downloads, 334 likes
- [dealignai/GLM-5.3-CYBERSECURITY-FP8](https://huggingface.co/dealignai/GLM-5.3-CYBERSECURITY-FP8) — 117,020 downloads, 689 likes
- [LiquidAI/LFM2.5-2.6B](https://huggingface.co/LiquidAI/LFM2.5-2.6B) — 114,916 downloads, 831 likes
- [XiaomiMiMo/MiMo-V2.6-Pro-RL](https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Pro-RL) — 99,548 downloads, 728 likes
- [jialinyyzz/humanizer](https://huggingface.co/jialinyyzz/humanizer) — 75,253 downloads, 1688 likes
- [XHToken/Spark-X2.5-4B](https://huggingface.co/XHToken/Spark-X2.5-4B) — 40,328 downloads, 1419 likes

_Generated by scripts/refresh-models.mts. Review before editing data/models.ts._
