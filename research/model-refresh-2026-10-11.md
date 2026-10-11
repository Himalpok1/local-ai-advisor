# Model catalog refresh — 2026-10-11

Compared 41 curated models with their Hugging Face config.json. 15 need a look.

| Model | Repo | Result | Downloads |
|---|---|---|---|
| Qwen3.8 27B | Qwen/Qwen3.8-27B | ✓ matches | 6,843,108 |
| Qwen3.6 27B | Qwen/Qwen3.6-27B | ✓ matches | 2,254,212 |
| Qwen3.6 35B-A3B | Qwen/Qwen3.6-35B-A3B | ✓ matches | 3,559,902 |
| Qwen3.5 27B | Qwen/Qwen3.5-27B | ✓ matches | 1,868,681 |
| Qwen3.5 35B-A3B | Qwen/Qwen3.5-35B-A3B | ✓ matches | 1,456,773 |
| Qwen3.5 122B-A10B | Qwen/Qwen3.5-122B-A10B | ✓ matches | 594,205 |
| Qwen3.5 9B | Qwen/Qwen3.5-9B | ✓ matches | 8,290,657 |
| Qwen3.5 4B | Qwen/Qwen3.5-4B | ✓ matches | 7,877,547 |
| Qwen3-Coder 30B-A3B Instruct | Qwen/Qwen3-Coder-30B-A3B-Instruct | ✓ matches | 383,753 |
| Qwen3 30B-A3B Instruct 2507 | Qwen/Qwen3-30B-A3B-Instruct-2507 | ✓ matches | 975,665 |
| Qwen3-Next 80B-A3B Instruct | Qwen/Qwen3-Next-80B-A3B-Instruct | ✓ matches | 249,798 |
| Qwen3 32B | Qwen/Qwen3-32B | ⚠ config native 40960 (catalog 32768) | 3,357,796 |
| Qwen3 14B | Qwen/Qwen3-14B | ⚠ config native 40960 (catalog 32768) | 5,776,369 |
| Qwen3 8B | Qwen/Qwen3-8B | ⚠ config native 40960 (catalog 32768) | 9,650,573 |
| Qwen2.5-Coder 32B Instruct | Qwen/Qwen2.5-Coder-32B-Instruct | ✓ matches | 800,328 |
| Qwen2.5-Coder 7B Instruct | Qwen/Qwen2.5-Coder-7B-Instruct | ✓ matches | 1,784,907 |
| Gemma 4 31B | google/gemma-4-31B-it | ✓ matches | 9,587,016 |
| Gemma 4 26B-A4B | google/gemma-4-26B-A4B-it | ✓ matches | 11,657,345 |
| Gemma 4 12B | google/gemma-4-12B-it | ✓ matches | 1,575,927 |
| Gemma 4 E4B | google/gemma-4-E4B-it | ✓ matches | 4,256,825 |
| Gemma 3 27B | unsloth/gemma-3-27b-it | ✓ matches | 50,296 |
| gpt-oss-20b | openai/gpt-oss-20b | ⚠ config native 4096, rope-extended 131072 (catalog 131072) | 5,898,135 |
| gpt-oss-120b | openai/gpt-oss-120b | ⚠ config native 4096, rope-extended 131072 (catalog 131072) | 3,736,207 |
| Devstral Small 2 (24B) | mistralai/Devstral-Small-2-24B-Instruct-2512 | ⚠ config native 393216 (catalog 262144) | 318,657 |
| Mistral Small 3.2 (24B) | mistralai/Mistral-Small-3.2-24B-Instruct-2506 | ✓ matches | 254,806 |
| Mistral Small 4 (119B-A6.5B) | mistralai/Mistral-Small-4-119B-2603 | ⚠ config native 1048576 (catalog 262144) | 78,283 |
| GLM-4.7-Flash (30B-A3B) | zai-org/GLM-4.7-Flash | ✓ matches | 1,435,437 |
| GLM-4.5-Air (106B-A12B) | zai-org/GLM-4.5-Air | ✓ matches | 570,341 |
| GLM-4.6V-Flash (10B) | zai-org/GLM-4.6V-Flash | ✓ matches | 105,527 |
| GLM-5.3 (753B-A40B) | zai-org/GLM-5.3 | ✓ matches | 1,694,033 |
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
| Llama 3.3 70B Instruct | unsloth/Llama-3.3-70B-Instruct | ⚠ config native 8192, rope-extended 131072 (catalog 131072) | 47,243 |
| Llama 4 Scout (109B-A17B) | unsloth/Llama-4-Scout-17B-16E-Instruct | ⚠ config native 8192, rope-extended 10485760 (catalog 262144) | 2,356 |
| Llama 3.1 8B Instruct | unsloth/Llama-3.1-8B-Instruct | ⚠ config native 8192, rope-extended 131072 (catalog 131072) | 148,592 |
| Llama 3.2 3B Instruct | unsloth/Llama-3.2-3B-Instruct | ⚠ config native 8192, rope-extended 131072 (catalog 131072) | 235,623 |
| Muse Glimmer (30B) | meta-models/Muse-Glimmer-30B | ✓ matches | 247,769 |
| Phi-4 (14B) | microsoft/phi-4 | ✓ matches | 376,569 |
| DeepSeek-R1-0528-Qwen3-8B | deepseek-ai/DeepSeek-R1-0528-Qwen3-8B | ⚠ config native 32768, rope-extended 131072 (catalog 131072) | 594,281 |
| DeepSeek-V4-Flash (284B-A13B) | deepseek-ai/DeepSeek-V4-Flash | ⚠ config native 65536, rope-extended 1048576 (catalog 1048576) | 867,331 |
| DeepSeek-V4.1-Flash (748B-A16B) | deepseek-ai/DeepSeek-V4.1-Flash | ⚠ config native 65536, rope-extended 1048576 (catalog 1048576) | 1,382,367 |
| Kolibri-1 (78B-A3.5B) | Aleph-Alpha/Kolibri-1 | ✓ matches | 12,550 |

## Trending text-generation models not in the catalog

- [Qwen/Qwen3-0.6B](https://huggingface.co/Qwen/Qwen3-0.6B) — 30,575,964 downloads, 1767 likes
- [openbmb/MiniCPM5-2B](https://huggingface.co/openbmb/MiniCPM5-2B) — 1,285,616 downloads, 1736 likes
- [deepseek-ai/DeepSeek-R1](https://huggingface.co/deepseek-ai/DeepSeek-R1) — 1,119,761 downloads, 14346 likes
- [meta-llama/Meta-Llama-3-8B-Instruct](https://huggingface.co/meta-llama/Meta-Llama-3-8B-Instruct) — 735,822 downloads, 5306 likes
- [meta-llama/Llama-3.1-8B](https://huggingface.co/meta-llama/Llama-3.1-8B) — 682,640 downloads, 2633 likes
- [ornith-ai/Ornith-1.5-35B-A3B](https://huggingface.co/ornith-ai/Ornith-1.5-35B-A3B) — 259,763 downloads, 717 likes
- [autotrust/JEV-27B](https://huggingface.co/autotrust/JEV-27B) — 182,232 downloads, 79 likes
- [Cactus-Compute/needle3](https://huggingface.co/Cactus-Compute/needle3) — 140,075 downloads, 326 likes
- [ConwayResearch/Underdog-Saluki-27B-1.0](https://huggingface.co/ConwayResearch/Underdog-Saluki-27B-1.0) — 108,900 downloads, 303 likes
- [XiaomiMiMo/MiMo-V2.6-Pro-RL](https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Pro-RL) — 95,740 downloads, 695 likes
- [dealignai/GLM-5.3-CYBERSECURITY-FP8](https://huggingface.co/dealignai/GLM-5.3-CYBERSECURITY-FP8) — 94,175 downloads, 655 likes
- [jialinyyzz/humanizer](https://huggingface.co/jialinyyzz/humanizer) — 37,647 downloads, 1013 likes
- [XHToken/Spark-X2.5-4B](https://huggingface.co/XHToken/Spark-X2.5-4B) — 27,213 downloads, 1401 likes

_Generated by scripts/refresh-models.mts. Review before editing data/models.ts._

## Reviewer notes (Ray, 2026-10-11)

- Same 15 flagged rows as 2026-10-10: all are the known, intentional "config native ≠ catalog" cases (catalog stores the advertised/supported context window, not raw config values). GLM-5.3-Flash parse error is the known head_dim:0 script limitation. No model data edits needed for any of these.
- **Added to catalog (data/models.ts): openbmb/MiniCPM5-2B** — new MiniCPM5 family release from established lab OpenBMB (Apache-2.0, released 2026-09-06; 1.28M downloads, 1,736 likes). Config: Llama architecture, 42 layers / 2 kvHeads / head_dim 128 (~2.5B params), native 131K context, tool-calling tag, no vision. Official GGUF repo (openbmb/MiniCPM5-2B-GGUF): Q4_K_M 1.56 GB, Q8_0 2.68 GB, F16 5.04 GB. Capability tiers set conservatively from vendor claims (2B-class SOTA, competitive with 4B-class) vs catalog peers.
- Watched, not added: Mistral Large 4 (public preview announced Oct 6; weights still not released — HF page "Upcoming release", ETA end of Oct 2026); Ornith-1.5-35B-A3B (derivative fine-tune, keep watched); Cloudflare Clef/Clef-Flash, JEV-27B, needle3 (decision models — don't fit the catalog's chat/coding schema).
- **Hardware: no changes.** NVIDIA RTX Spark (Arm Windows 11 AI PCs, Oct 2026 rollout) has no official spec sheet or vendor pricing yet — the $2,899 figure is a Morgan Stanley analyst estimate; only confirmed retail product is an ASUS ProArt laptop listing. Per policy, no entry until official spec-page sources exist. GPU street prices remain volatile (RTX 5090 $6.5–9.5K, AMD SEP hikes in China reported Oct 1) — no dated vendor/retailer price, so no basePrice edits.
- **Runtimes: Ollama entry verified, not changed.** Official GitHub releases page confirms v0.40.0 (shipped MLX-by-default on Apple Silicon; newer tags v0.40.1-rc0/v0.40.2-rc0/v0.40.3 also live) — the catalog's "Since v0.40 (Oct 2026)" claim is accurate; lastVerified bumped to 2026-10-11. vLLM v0.31.0 (Oct 5) adds perf features but changes no cataloged fact. llama.cpp serves decision models via /v1/systemone (HF blog, Oct 2) — catalog claim confirmed; "0.6.0" seen in press appears to be the llama.app versioning, engine still ships nightly b-tags.
