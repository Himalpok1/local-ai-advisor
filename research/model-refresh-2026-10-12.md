# Model catalog refresh — 2026-10-12

Compared 42 curated models with their Hugging Face config.json. 15 need a look.

| Model | Repo | Result | Downloads |
|---|---|---|---|
| Qwen3.8 27B | Qwen/Qwen3.8-27B | ✓ matches | 6,895,303 |
| Qwen3.6 27B | Qwen/Qwen3.6-27B | ✓ matches | 2,248,192 |
| Qwen3.6 35B-A3B | Qwen/Qwen3.6-35B-A3B | ✓ matches | 3,581,595 |
| Qwen3.5 27B | Qwen/Qwen3.5-27B | ✓ matches | 1,868,848 |
| Qwen3.5 35B-A3B | Qwen/Qwen3.5-35B-A3B | ✓ matches | 1,446,069 |
| Qwen3.5 122B-A10B | Qwen/Qwen3.5-122B-A10B | ✓ matches | 611,149 |
| Qwen3.5 9B | Qwen/Qwen3.5-9B | ✓ matches | 8,339,155 |
| Qwen3.5 4B | Qwen/Qwen3.5-4B | ✓ matches | 7,887,451 |
| Qwen3-Coder 30B-A3B Instruct | Qwen/Qwen3-Coder-30B-A3B-Instruct | ✓ matches | 386,097 |
| Qwen3 30B-A3B Instruct 2507 | Qwen/Qwen3-30B-A3B-Instruct-2507 | ✓ matches | 998,093 |
| Qwen3-Next 80B-A3B Instruct | Qwen/Qwen3-Next-80B-A3B-Instruct | ✓ matches | 245,950 |
| Qwen3 32B | Qwen/Qwen3-32B | ⚠ config native 40960 (catalog 32768) | 3,307,050 |
| Qwen3 14B | Qwen/Qwen3-14B | ⚠ config native 40960 (catalog 32768) | 6,164,691 |
| Qwen3 8B | Qwen/Qwen3-8B | ⚠ config native 40960 (catalog 32768) | 9,647,139 |
| Qwen2.5-Coder 32B Instruct | Qwen/Qwen2.5-Coder-32B-Instruct | ✓ matches | 793,989 |
| Qwen2.5-Coder 7B Instruct | Qwen/Qwen2.5-Coder-7B-Instruct | ✓ matches | 1,683,947 |
| Gemma 4 31B | google/gemma-4-31B-it | ✓ matches | 9,503,078 |
| Gemma 4 26B-A4B | google/gemma-4-26B-A4B-it | ✓ matches | 11,524,713 |
| Gemma 4 12B | google/gemma-4-12B-it | ✓ matches | 1,572,903 |
| Gemma 4 E4B | google/gemma-4-E4B-it | ✓ matches | 4,244,705 |
| Gemma 3 27B | unsloth/gemma-3-27b-it | ✓ matches | 50,223 |
| gpt-oss-20b | openai/gpt-oss-20b | ⚠ config native 4096, rope-extended 131072 (catalog 131072) | 5,896,789 |
| gpt-oss-120b | openai/gpt-oss-120b | ⚠ config native 4096, rope-extended 131072 (catalog 131072) | 3,644,353 |
| Devstral Small 2 (24B) | mistralai/Devstral-Small-2-24B-Instruct-2512 | ⚠ config native 393216 (catalog 262144) | 332,572 |
| Mistral Small 3.2 (24B) | mistralai/Mistral-Small-3.2-24B-Instruct-2506 | ✓ matches | 254,556 |
| Mistral Small 4 (119B-A6.5B) | mistralai/Mistral-Small-4-119B-2603 | ⚠ config native 1048576 (catalog 262144) | 77,411 |
| GLM-4.7-Flash (30B-A3B) | zai-org/GLM-4.7-Flash | ✓ matches | 1,397,640 |
| GLM-4.5-Air (106B-A12B) | zai-org/GLM-4.5-Air | ✓ matches | 592,629 |
| GLM-4.6V-Flash (10B) | zai-org/GLM-4.6V-Flash | ✓ matches | 105,590 |
| GLM-5.3 (753B-A40B) | zai-org/GLM-5.3 | ✓ matches | 1,707,778 |
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
| Llama 3.3 70B Instruct | unsloth/Llama-3.3-70B-Instruct | ⚠ config native 8192, rope-extended 131072 (catalog 131072) | 47,158 |
| Llama 4 Scout (109B-A17B) | unsloth/Llama-4-Scout-17B-16E-Instruct | ⚠ config native 8192, rope-extended 10485760 (catalog 262144) | 2,425 |
| Llama 3.1 8B Instruct | unsloth/Llama-3.1-8B-Instruct | ⚠ config native 8192, rope-extended 131072 (catalog 131072) | 150,540 |
| Llama 3.2 3B Instruct | unsloth/Llama-3.2-3B-Instruct | ⚠ config native 8192, rope-extended 131072 (catalog 131072) | 238,287 |
| Muse Glimmer (30B) | meta-models/Muse-Glimmer-30B | ✓ matches | 247,147 |
| Phi-4 (14B) | microsoft/phi-4 | ✓ matches | 372,259 |
| DeepSeek-R1-0528-Qwen3-8B | deepseek-ai/DeepSeek-R1-0528-Qwen3-8B | ⚠ config native 32768, rope-extended 131072 (catalog 131072) | 570,613 |
| DeepSeek-V4-Flash (284B-A13B) | deepseek-ai/DeepSeek-V4-Flash | ⚠ config native 65536, rope-extended 1048576 (catalog 1048576) | 842,873 |
| DeepSeek-V4.1-Flash (748B-A16B) | deepseek-ai/DeepSeek-V4.1-Flash | ⚠ config native 65536, rope-extended 1048576 (catalog 1048576) | 1,294,550 |
| Kolibri-1 (78B-A3.5B) | Aleph-Alpha/Kolibri-1 | ✓ matches | 14,018 |
| MiniCPM5 2B | openbmb/MiniCPM5-2B | ✓ matches | 1,278,419 |

## Trending text-generation models not in the catalog

- [Qwen/Qwen3-0.6B](https://huggingface.co/Qwen/Qwen3-0.6B) — 30,604,529 downloads, 1787 likes
- [openai-community/gpt2](https://huggingface.co/openai-community/gpt2) — 15,675,425 downloads, 4233 likes
- [deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B](https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B) — 1,270,002 downloads, 1616 likes
- [deepseek-ai/DeepSeek-R1](https://huggingface.co/deepseek-ai/DeepSeek-R1) — 1,147,960 downloads, 14366 likes
- [meta-llama/Meta-Llama-3-8B-Instruct](https://huggingface.co/meta-llama/Meta-Llama-3-8B-Instruct) — 691,424 downloads, 5324 likes
- [meta-llama/Llama-3.1-8B](https://huggingface.co/meta-llama/Llama-3.1-8B) — 680,583 downloads, 2640 likes
- [zai-org/GLM-5.2](https://huggingface.co/zai-org/GLM-5.2) — 594,609 downloads, 5164 likes
- [deepseek-ai/DeepSeek-V4-Pro](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro) — 382,057 downloads, 5660 likes
- [ornith-ai/Ornith-1.5-35B-A3B](https://huggingface.co/ornith-ai/Ornith-1.5-35B-A3B) — 258,425 downloads, 722 likes
- [ConwayResearch/Underdog-Saluki-27B-1.0](https://huggingface.co/ConwayResearch/Underdog-Saluki-27B-1.0) — 242,329 downloads, 358 likes
- [autotrust/JEV-27B](https://huggingface.co/autotrust/JEV-27B) — 186,028 downloads, 82 likes
- [Cactus-Compute/needle3](https://huggingface.co/Cactus-Compute/needle3) — 144,913 downloads, 329 likes
- [dealignai/GLM-5.3-CYBERSECURITY-FP8](https://huggingface.co/dealignai/GLM-5.3-CYBERSECURITY-FP8) — 100,586 downloads, 661 likes
- [XiaomiMiMo/MiMo-V2.6-Pro-RL](https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Pro-RL) — 96,316 downloads, 700 likes
- [deepseek-ai/DeepSeek-V4-Pro-0813](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813) — 79,857 downloads, 883 likes

_Generated by scripts/refresh-models.mts. Review before editing data/models.ts._
