# Findings 2 — Model architecture, tool support, runtimes (collected 2026-09-30)

Method: raw `config.json` via `https://huggingface.co/<repo>/raw/main/config.json`, metadata via
`https://huggingface.co/api/models/<repo>` (license, createdAt, `safetensors.total` = exact param count),
model-card README grep for stated params/context, GGUF sizes via
`https://huggingface.co/api/models/<unsloth GGUF repo>/tree/main?recursive=true` (summed across split shards; GB = 1e9 bytes; mmproj excluded).
Everything below was read on 2026-09-30. "UNVERIFIED" = not confirmed from a primary source in this pass.

## PART A — Model architecture (from config.json)

Notation: L = num_hidden_layers, KV = num_key_value_heads, hd = head_dim, ctx = max_position_embeddings.
"Linear" = Gated DeltaNet-style linear attention layers (`linear_attention` in `layer_types`) — no growing KV cache.
Release month = HF repo `createdAt` (may precede public announcement by days).

### Qwen 3.5 / 3.6 / 3.8 family (hybrid: 3 linear : 1 full attention, `full_attention_interval=4`)
All: `model_type qwen3_5[_moe]`, vision_config present (image-text-to-text), Apache-2.0, card: "Context Length: 262,144 natively and extensible up to 1,010,000 tokens" (3.8-27B card: "up to 1,000,000"). rope partial_rotary_factor 0.25, theta 1e7.

| Repo | Card params | safetensors.total | L | full / linear layers | KV (full-attn) | hd | hidden | ctx | MoE | Created | GGUF Q4_K_M / Q8_0 (unsloth) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Qwen/Qwen3.5-27B | 27B dense | 27,781,427,952 | 64 | 16 / 48 | 4 | 256 | 5120 | 262144 | – | 2026-02 | 16.74 / 28.60 GB |
| Qwen/Qwen3.5-35B-A3B | 35B total, 3B active | 35,951,822,704 | 40 | 10 / 30 | 2 | 256 | 2048 | 262144 | 256 experts, 8 routed + 1 shared | 2026-02 | 22.02 / 36.90 GB (MXFP4 21.59) |
| Qwen/Qwen3.5-122B-A10B | 122B total, 10B active | 125,086,497,008 | 48 | 12 / 36 | 2 | 256 | 3072 | 262144 | 256 experts, 8 routed + 1 shared | 2026-02 | 76.54 / 129.87 GB |
| Qwen/Qwen3.5-9B | 9B dense | 9,653,104,368 | 32 | 8 / 24 | 4 | 256 | 4096 | 262144 | – | 2026-02 | 5.68 / 9.53 GB |
| Qwen/Qwen3.5-4B | 4B dense | 4,659,865,088 | 32 | 8 / 24 | 4 | 256 | 2560 | 262144 | – | 2026-02 | 2.74 / 4.48 GB |
| Qwen/Qwen3.6-27B | 27B dense | 27,781,427,952 | 64 | 16 / 48 | 4 | 256 | 5120 | 262144 | – | 2026-04 | 16.82 / 28.60 GB |
| Qwen/Qwen3.6-35B-A3B | 35B total, 3B active | 35,951,822,704 | 40 | 10 / 30 | 2 | 256 | 2048 | 262144 | 256 experts, 8 routed + 1 shared | 2026-04 | UD-Q4_K_M 22.13 / 36.90 GB |
| Qwen/Qwen3.8-27B | 27B dense | 27,781,427,952 | 64 | 16 / 48 | 4 | 256 | 5120 | 262144 | – | 2026-08 | UD-Q4_K_M 16.46 / 29.05 GB |

- Qwen3.6-27B and Qwen3.8-27B have identical architecture to Qwen3.5-27B (same config values, same param count).
- Linear-attention heads: 27B: 16 K / 48 V heads; 35B-A3B: 16/32; 122B: 16/64; 9B & 4B: 16/32.
- Qwen3.8 appears on HF as Qwen/Qwen3.8-27B (also FP8). A "Qwen3.8-Flash-Next" exists (unsloth/Qwen3.8-Flash-Next-GGUF; Ollama `qwen3.8-flash-next`) — architecture UNVERIFIED (no config.json in GGUF repo; official repo not checked).
- Qwen3.5 also has 397B-A17B (Qwen/Qwen3.5-397B-A17B-FP8), 2B, 0.8B — not detailed.
- Source: https://huggingface.co/Qwen/Qwen3.5-27B , https://huggingface.co/Qwen/Qwen3.6-35B-A3B , https://huggingface.co/Qwen/Qwen3.8-27B etc.

### Qwen3 (2025) family — all full attention (no sliding window), Apache-2.0, text-only
| Repo | Card params | safetensors.total | L | KV | hd | ctx (config) | Native ctx (card) | MoE | Created | Q4_K_M / Q8_0 |
|---|---|---|---|---|---|---|---|---|---|---|
| Qwen/Qwen3-Coder-30B-A3B-Instruct | 30.5B total, 3.3B active | 30,532,122,624 | 48 | 4 | 128 | 262144 | 262,144 natively (1M with YaRN) | 128 experts, 8 active | 2025-07 | 18.56 / 32.48 GB |
| Qwen/Qwen3-30B-A3B-Instruct-2507 | 30.5B / 3.3B active | 30,532,122,624 | 48 | 4 | 128 | 262144 | 262,144 natively | 128 / 8 | 2025-07 | 18.56 / 32.48 GB |
| Qwen/Qwen3-8B | 8.2B | 8,190,735,360 | 36 | 8 | 128 | 40960 | 32,768 native; 131,072 w/ YaRN | – | 2025-04 | 5.03 / 8.71 GB |
| Qwen/Qwen3-14B | 14.8B | 14,768,307,200 | 40 | 8 | 128 | 40960 | 32,768 native; 131,072 w/ YaRN | – | 2025-04 | 9.00 / 15.70 GB |
| Qwen/Qwen3-32B | 32.8B | 32,762,123,264 | 64 | 8 | 128 | 40960 | 32,768 native; 131,072 w/ YaRN | – | 2025-04 | 19.76 / 34.82 GB |
| Qwen/Qwen3-Next-80B-A3B-Instruct | 80B total, 3B active | 81,324,862,720 | 48 | 2 | 256 | 262144 | UNVERIFIED (card line not captured; config 262144) | 512 experts, 10 active | 2025-09 | 48.51 / 84.81 GB |

- Qwen3-Next is hybrid: `full_attention_interval=4` (=> 12 full / 36 linear of 48, computed from interval; `layer_types` not present in config), linear heads 16 K / 32 V.

### Gemma 4 / Gemma 3 (Google) — interleaved sliding-window + global attention
| Repo | Card params | safetensors.total | L | sliding / full layers | sliding_window | KV (sliding) | global KV heads | hd (sliding/global) | ctx | Vision/Audio | License | Created | Q4_K_M / Q8_0 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| google/gemma-4-31B-it | 30.7B | 31,273,088,876 | 60 | 50 / 10 | 1024 | 16 | 4 | 256 / 512 | 262144 | Text+Image | Apache-2.0 | 2026-03 | 18.32 / 33.15 GB |
| google/gemma-4-26B-A4B-it | 25.2B total, 3.8B active | 25,805,936,206 | 30 | 25 / 5 | 1024 | 8 | 2 | 256 / 512 | 262144 | Text+Image | Apache-2.0 | 2026-03 | UD-Q4_K_M 16.95 / 27.32 GB (MXFP4 16.55) |
| google/gemma-4-12B-it | 11.95B | 11,959,730,224 | 48 | 40 / 8 | 1024 | 8 | 1 | 256 / 512 | 262144 | Text+Image+Audio | Apache-2.0 | 2026-05 | 7.12 / 13.13 GB |
| google/gemma-4-E4B-it | 4.5B effective (8B with embeddings) | 7,996,156,490 | 42 | 35 / 7 | 512 | 2 | (null) | 256 / 512 | 131072 | Text+Image+Audio | Apache-2.0 | 2026-03 | 4.98 / 8.29 GB |
| google/gemma-3-27b-it (gated, config via unsloth/gemma-3-27b-it) | UNVERIFIED (card gated) | 27,432,406,640 | 62 | pattern 6 (5 local : 1 global) | 1024 | 16 | – | 128 | 131072 | Text+Image | Gemma license (gated: manual) | 2025-03 | 16.55 / 28.71 GB |
| google/gemma-3-12b-it (gated, unsloth mirror) | UNVERIFIED | 12,187,325,040 | 48 | pattern 6 | 1024 | 8 | – | 256 | 131072 | Text+Image | Gemma license (gated) | 2025-03 | 7.30 / 12.51 GB |

- Gemma 4: full-attention every 6th layer (layer_types first full at index 5). `attention_k_eq_v=True` for 31B/26B/12B (False for E4B). 26B-A4B: 128 experts, `top_k_experts=8`; card: "8 active / 128 total and 1 shared". E4B: `num_kv_shared_layers=18`, per-layer embeddings (`hidden_size_per_layer_input=256`).
- Gemma 4 card: "small models feature a 128K context window, while the medium models support 256K". 12B uses `Gemma4UnifiedForConditionalGeneration` (pipeline any-to-any). Also exists: gemma-4-E2B-it.
- Gemma 3 `sliding_window_pattern=6`, rope linear factor 8. Gemma 3 L=62 → ~52 local / ~10 global (computed from pattern; exact split UNVERIFIED).
- Sources: https://huggingface.co/google/gemma-4-26B-A4B-it , https://huggingface.co/google/gemma-4-31B-it , https://huggingface.co/unsloth/gemma-3-27b-it

### Mistral
| Repo | Card params | safetensors.total | L | KV | hd | ctx (config) | Attention | MoE | Vision | License | Created | Q4_K_M / Q8_0 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mistralai/Devstral-Small-2-24B-Instruct-2512 | 24B dense | 24,011,361,840 | 40 | 8 | 128 | 393216 (card: "256k context window") | full GQA, no sliding | – | vision_config present | Apache-2.0 | 2025-11 | 14.33 / 25.06 GB |
| mistralai/Mistral-Small-4-119B-2603 | 119B total, 6.5B active | 119,401,317,952 | 36 | MLA (kv_lora_rank 256, q_lora_rank 1024, qk_rope 64; num_kv_heads=32) | 128 | 1048576 (card: "256k context length") | MLA | 128 routed + 1 shared, 4 active | vision_config present | Apache-2.0 | 2026-01 (repo created; name suggests 2026-03 release) | UD-Q4_K_M 73.76 / 126.47 GB (MXFP4 71.81) |
| mistralai/Mistral-Small-3.2-24B-Instruct-2506 | 24B | 24,011,361,280 | 40 | 8 | 128 | 131072 | full GQA | – | vision present | Apache-2.0 | 2025-06 | 14.33 / 25.05 GB |
- Devstral 2 big sibling exists: mistralai/Devstral-2-123B-Instruct-2512 (not detailed).

### GLM (Z.ai) — MIT license
| Repo | Card params | safetensors.total | L | KV | hd | ctx | Attention | MoE | Vision | Created | Q4_K_M / Q8_0 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| zai-org/GLM-4.7-Flash | "30B-A3B MoE" | 31,221,488,576 | 47 | MLA: kv_lora_rank 512, q_lora_rank 768, qk_rope 64 (20 heads) | – | 202752 | MLA, no sliding | 64 routed + 1 shared, 4 active | text-only | 2026-01 | 18.31 / 31.84 GB (MXFP4 16.97) |
| zai-org/GLM-4.5-Air | 106B total, 12B active | 110,468,824,832 | 46 | 8 | 128 | 131072 | full GQA (96 q heads) | 128 + 1 shared, 8 active | text | 2025-07 | 72.98 / 117.46 GB |
| zai-org/GLM-4.6V-Flash | UNVERIFIED (~10B per safetensors) | 10,292,777,472 | 40 | 2 | 128 (computed 4096/32) | 131072 (card: "128k tokens in training") | full GQA | dense | yes | 2025-12 | 6.17 / 10.00 GB |
| zai-org/GLM-4.6V (Air-class VLM) | UNVERIFIED (safetensors 107.7B) | 107,710,933,120 | 46 | 8 | 128 | 131072 | full GQA | 128 + 1 shared, 8 active | yes | 2025-12 | not checked |
- zai-org/GLM-4.7 (full size) exists (2025-12). Ollama "newest" list also shows glm-5.2, glm-5.3, glm-5.3-flash (2026) — HF details UNVERIFIED.

### OpenAI gpt-oss — Apache-2.0, text-only
| Repo | Card params | safetensors.total | L | sliding / full | sliding_window | KV | hd | ctx | MoE | Created | Q4_K_M / Q8_0 (unsloth) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| openai/gpt-oss-20b | 21B, 3.6B active | 20,914,757,184 | 24 | 12 / 12 (alternating) | 128 | 8 | 64 | 131072 | 32 experts, 4 active | 2025-08 | 11.62 / 12.11 GB (F16 13.79; weights natively MXFP4 so quants barely shrink) |
| openai/gpt-oss-120b | 117B, 5.1B active | 116,829,156,672 | 36 | 18 / 18 | 128 | 8 | 64 | 131072 | 128 experts, 4 active | 2025-08 | 62.77 / 63.39 GB (F16 65.37) |

### Meta Llama (gated; configs via unsloth mirrors)
| Repo | Card params | safetensors.total | L | KV | hd | ctx | MoE | Vision | License | Created | Q4_K_M / Q8_0 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| meta-llama/Llama-3.1-8B-Instruct | UNVERIFIED (gated card) | 8,030,261,248 | 32 | 8 | 128 | 131072 | – | no | llama3.1 (gated manual) | 2024-07 | 4.92 GB / Q8_0 not found in unsloth listing |
| meta-llama/Llama-3.3-70B-Instruct | UNVERIFIED | 70,553,706,496 | 80 | 8 | 128 | 131072 | – | no | llama3.3 (gated) | 2024-11 | 42.52 / 74.98 GB |
| meta-llama/Llama-4-Scout-17B-16E-Instruct | 17B active, 109B total (unsloth mirror card) | 108,641,793,536 | 48 | 8 | 128 | 10485760 | 16 experts, 1 active | yes | llama4 (gated) | 2025-04 | 65.36 / 114.53 GB |

### Microsoft / DeepSeek
| Repo | Card params | safetensors.total | L | KV | hd | ctx | Notes | License | Created | Q4_K_M / Q8_0 |
|---|---|---|---|---|---|---|---|---|---|---|
| microsoft/phi-4 | "14B parameters, dense decoder-only" | 14,659,507,200 | 40 | 10 | 128 (5120/40) | 16384 (card: 16K) | text-only | MIT | 2024-12 | 8.89 / 15.58 GB |
| deepseek-ai/DeepSeek-R1-0528-Qwen3-8B | (Qwen3-8B arch) | 8,190,735,360 | 36 | 8 | 128 | 131072 (YaRN factor 4 over 32768) | text | MIT | 2025-05 | 5.03 / 8.71 GB |
| deepseek-ai/DeepSeek-V4-Flash(-0731) | 284B total, 13B active (V4 card table) | 304,180,418,494 | 43 | 1 (MLA-like, hd 512) | 512 | 1048576 | sliding_window 128 + compressed sparse attention (`compress_ratios`, `index_topk` 512); 256 routed + 1 shared, 6 active | MIT | V4-Flash 2026-04; -0731 2026-07 | unsloth GGUF listing returned only ~11 GB for BF16/Q8_0 matches — sizes UNVERIFIED |
| deepseek-ai/DeepSeek-V4-Pro | 1.6T total, 49B active | 1,598,839,674,782 | 61 | 1 | 512 | 1048576 | 384 routed + 1 shared, 6 active; FP4 experts + FP8 | MIT | 2026-04 | n/a |
| deepseek-ai/DeepSeek-V4.1-Flash (latest flagship-line, 2026-09-10) | "552B backbone parameters", activated "8B / 16B" (card table) | 763,205,315,794 | 40 | 1 | 512 | 1048576 ("up to one million tokens") | multimodal (vision_config), CSA2 attention; 384 routed + 1 shared, 6 active | MIT | 2026-09 | n/a |
- V4 card table rows: "# Total Params | - | 671B | 284B | 1.6T" and "# Activated Params | - | 37B | 13B | 49B" (column headers not captured; mapping V3.2 / V4-Flash / V4-Pro inferred from safetensors totals — header mapping UNVERIFIED).
- Older: deepseek-ai/DeepSeek-V3.2 (2025-12).

### Ollama library — most popular (https://ollama.com/library?sort=popular, fetched 2026-09-30; order = all-time pulls, counts not extracted)
1 llama3.1, 2 deepseek-r1, 3 nomic-embed-text, 4 llama3.2, 5 qwen2.5, 6 gemma3, 7 qwen3, 8 mistral, 9 gemma2, 10 gemma4, 11 llama3, 12 qwen2.5-coder, 13 qwen3.5, 14 phi3, 15 mxbai-embed-large, 16 llava, 17 gpt-oss, 18 qwen3-coder, 19 gemma, 20 qwen, 21 phi4, 22 glm-ocr, 23 llama2, 24 bge-m3, 25 qwen3.6.
- Newest tool-capable models (https://ollama.com/search?c=tools&o=newest): deepseek-v4.1-flash, qwen3.8-flash-next, glm-5.3-flash, glm-5.3, qwen3.8, nemotron-3.5-lightning, muse-glimmer, kimi-k3, laguna-s-2.1, laguna-xs-2.1, ornith, north-mini-code-1.0, glm-5.2, kimi-k2.7-code, nemotron-3-ultra (details UNVERIFIED).
- HF download leaders seen in searches (sort=downloads): Qwen3.8-27B (7.0M), gemma-4-26B-A4B-it (12.8M), gemma-4-31B-it (9.9M), Qwen3.5-9B (9.5M), Qwen3.6-35B-A3B-FP8 (6.6M), DeepSeek-V4-Flash-0731 (4.5M).

## PART B — Coding tools: local-model support

| Tool | Ollama | LM Studio | llama.cpp | Generic OpenAI-compatible | Anthropic-compatible | Official? | Source |
|---|---|---|---|---|---|---|---|
| OpenCode | Yes (listed provider; also Ollama Cloud) | Yes ("runs local LLMs behind an OpenAI-compatible API server") | Yes (listed) | Yes via `@ai-sdk/openai-compatible` npm + `options.baseURL` | UNVERIFIED | Official docs | https://opencode.ai/docs/providers |
| Aider | Yes, `OLLAMA_API_BASE` (default http://127.0.0.1:11434); docs warn "Ollama uses a 2k context window by default", aider sets Ollama's context window itself | Yes, `LM_STUDIO_API_KEY` / base | via OpenAI-compatible | Yes: `OPENAI_API_BASE`, model prefix `openai/<model>` | n/a | Official | https://aider.chat/docs/llms/ollama.html , /openai-compat.html , /lm-studio.html |
| Continue | Yes (top-level provider page) | Yes (top-level/lmstudio) | Yes (more/llamacpp) | Yes (`apiBase` on openai provider) | – | Official | https://docs.continue.dev/customize/model-providers/top-level/ollama , .../top-level/lmstudio , .../more/llamacpp |
| Cline | Yes | Yes (also "Atomic Chat") | via OpenAI-compatible | Yes ("OpenAI Compatible" provider) | – | Official | https://docs.cline.bot/running-models-locally/overview , https://docs.cline.bot/provider-config/openai-compatible |
| Roo Code | Docs list Ollama / LM Studio / OpenAI-compatible providers, BUT: "The Roo Code Extension was shut down on May 15th" (dated May 15, 2026); suggests ZooCode (community fork) and Cline | | | | | Official notice | https://docs.roocode.com/ |
| Open WebUI | Yes, native "Ollama API Protocol" connection (model pulling from Admin UI) | via OpenAI-compatible | Yes (listed: Llama.cpp, vLLM) | Yes ("any server... that implements the OpenAI-compatible API") | Anthropic listed as a provider (https://api.anthropic.com/v1) | Official | https://docs.openwebui.com/getting-started/quick-start/connect-a-provider/starting-with-ollama , .../starting-with-openai-compatible |
| Pi coding agent | Yes via `models.json` (`baseUrl http://localhost:11434/v1`, `api: "openai-completions"`, dummy apiKey) | Yes (models.json) | Yes, dedicated doc for llama.cpp router server (`llama-server` without `-m`) | Yes: "An OpenAI-, Anthropic-, or Google-compatible endpoint — add it to models.json"; vLLM, SGLang named | Yes (Anthropic-compatible endpoints in models.json) | Official. Repo moved: badlogic/pi-mono → github.com/earendil-works/pi; site pi.dev | https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models.md , .../docs/llama-cpp.md |
| Zed | Yes | Yes | Yes (`llama serve` router mode; auto-discovers context/tool/vision caps) | Yes ("Local OpenAI-compatible server") | Yes ("Anthropic-compatible" provider under Use API Access) | Official | https://zed.dev/docs/ai/use-a-local-model , https://zed.dev/docs/ai/llm-providers |
| VS Code Copilot Chat (BYOK) | Yes: "BYOK models work without signing into a GitHub account and without a Copilot plan... fully offline scenarios with local models such as Ollama" | via extension (e.g. AI Toolkit) | via custom endpoint | Yes: custom endpoint "that speaks Chat Completions, Responses, or Messages API" | Messages API endpoints supported | Official. Caveat: BYOK applies to chat + utility tasks only; inline completions, semantic search, embeddings still need GitHub account; Business/Enterprise need admin opt-in | https://code.visualstudio.com/docs/copilot/customization/language-models |
| Claude Code | Not officially; Ollama itself advertises it (below) | – | – | No (gateway must speak Anthropic Messages / Bedrock / Vertex formats) | `ANTHROPIC_BASE_URL` → gateway exposing `/v1/messages` (+ optional `/v1/messages/count_tokens`), forwarding `anthropic-beta`/`anthropic-version` | Official docs explicitly: "Anthropic ... doesn't support routing Claude Code to non-Claude models through any gateway" | https://code.claude.com/docs/en/llm-gateway , https://code.claude.com/docs/en/llm-gateway-protocol |
| Codex CLI | Yes, built-in provider id `ollama`; `--oss` flag uses `oss_provider` (`lmstudio` \| `ollama`) | Yes, built-in `lmstudio` | via custom `model_providers.<id>` | Custom providers with `base_url`; `wire_api` type documented as `"responses"` (Responses API only — Chat Completions wire not listed) | – | Official | https://developers.openai.com/codex/config-reference , https://developers.openai.com/codex/config-advanced |

Ollama-side integration: Ollama v0.14.0+ is "compatible with the Anthropic [Messages API]" — "you can now use Claude Code with any Ollama model" (Ollama blog, Jan 16, 2026, https://ollama.com/blog/claude). Ollama MLX blog shows `ollama launch claude --model qwen3.5:35b-a3b-coding-nvfp4` (community/vendor path, not Anthropic-supported).

## PART C — Runtimes

| Runtime | Platforms / backends | APIs | Notes | Source |
|---|---|---|---|---|
| Ollama (latest v0.35.0, 2026-09-28) | NVIDIA CUDA; AMD ROCm (requires ROCm v7 driver on Linux, ROCm v7/HIP7 on Windows); Vulkan "enabled by default when the backend is installed" (Windows/Linux, extra GPU support); Apple Metal; **MLX engine on Apple Silicon**: preview announced March 30, 2026 ("Ollama on Apple silicon is now built on top of ... MLX"; uses M5/M5 Pro/M5 Max GPU Neural Accelerators; NVFP4 support; "make sure you have a Mac with more than 32GB of unified memory"); June 11, 2026 update "up to 20% faster"; active MLX PRs through 2026-09 (e.g. "mlx: speed up Qwen 3.8 prompt processing" #18550) | Ollama native, OpenAI-compatible, Anthropic Messages (v0.14.0+) | | https://github.com/ollama/ollama/blob/main/docs/gpu.mdx , https://ollama.com/blog/mlx , https://ollama.com/blog/mlx-performance , https://ollama.com/blog/claude |
| MLX-LM server (`mlx_lm.server`) | Apple Silicon | "intended to be similar to the OpenAI chat API": `/v1/chat/completions`, `/v1/models` | "not recommended for production as it only implements basic security checks"; "A quantized KV cache does not support batching. The server processes requests one at a time when you set `--kv-bits`" (implies batching otherwise; general batching details UNVERIFIED) | https://github.com/ml-explore/mlx-lm/blob/main/mlx_lm/SERVER.md |
| SGLang | NVIDIA (A100/H100/B200..., select RTX 30/40/50, DGX Spark, Jetson), AMD Instinct MI300X–MI355X, Google TPU v6e/v7, Intel Arc/Arc Pro B + Xeon CPU, Apple Silicon "via Metal / MLX" | OpenAI-compatible; Anthropic conversion code exists per merged PRs (#35127, #35480, Aug 2026) — official Anthropic endpoint docs UNVERIFIED | | https://github.com/sgl-project/sglang |
| vLLM | NVIDIA, AMD, Intel GPUs, x86/ARM/PowerPC CPUs; plugins: Google TPU, Intel Gaudi, IBM Spyre, Huawei Ascend, Apple Silicon, others | "OpenAI-compatible API server, plus Anthropic Messages API and gRPC support" (`/v1/messages`, active PRs Aug–Sep 2026) | | https://github.com/vllm-project/vllm |
| llama.cpp `llama-server` | (CPU, CUDA, Metal, Vulkan, ROCm — not re-verified here) | OpenAI-compatible endpoints + "Anthropic Messages API compatible chat completions"; router mode (no `-m`) loads models on demand | | https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md |
| Jan | Bundled llama.cpp engine; variants cpu, vulkan, metal, cuda12, cuda13, hip/rocm | "OpenAI-Compatible API: Local server at localhost:1337"; cloud connectors (OpenAI, Anthropic, Mistral, Groq, MiniMax) | MLX engine UNVERIFIED | https://github.com/janhq/jan |
| LocalAI | Backends pulled on demand: llama.cpp, vLLM, MLX, whisper.cpp, stable-diffusion, etc.; NVIDIA, AMD (ROCm), Intel, Apple Silicon, Vulkan, CPU | "Drop-in API compatibility: OpenAI, Anthropic, and ElevenLabs APIs across every backend" | | https://github.com/mudler/LocalAI |
| KoboldCpp | CUDA (`--usecuda`), Vulkan (`--usevulkan`, any GPU), HIPBLAS (AMD), Metal (not explicitly captured) | KoboldCppApi, OpenAiApi, OllamaApi, A1111/ComfyUI, Whisper, XTTS, OpenAI Speech; can also front remote providers (OpenAI-compatible, Anthropic, OpenRouter, Gemini...) | Anthropic-compatible *server* endpoint UNVERIFIED | https://github.com/LostRuins/koboldcpp |

## Gaps / UNVERIFIED summary
- Gemma 3 and Llama 3.x total params from model cards (gated) — only safetensors totals recorded.
- GLM-4.6V / 4.6V-Flash card param claims; Qwen3-Next card native-context line.
- DeepSeek V4 card table column headers; V4-Flash-0731 GGUF sizes.
- Qwen3.8-Flash-Next, GLM-5.x, Kimi K3 architecture (only seen as names).
- OpenCode Anthropic-compatible custom providers; SGLang Anthropic endpoint docs; Jan MLX; KoboldCpp Metal.
- Ollama popular-list pull counts.
