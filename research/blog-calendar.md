# Blog calendar

Every post and idea lives here so topics never repeat. Before writing, check both tables. After publishing, move the row from **Ideas backlog** to **Published** (newest first). Priority: high, medium or low.

## Published

| date | slug | title |
| 2026-10-03 | tensorfold-faster-local-llm-exact | TensorFold: faster local LLM answers with identical output |
| 2026-10-03 | astabrief-8b-cited-science-reports | AstaBrief 8B: a small open model that writes cited science reports on your machine |

| --- | --- | --- |
| 2026-10-02 | speculative-decoding-faster-local-llm | Speculative decoding: free speed for your local LLM |
| 2026-10-02 | ollama-035-decision-models | Ollama 0.35 can now make decisions, not just chat |
| 2026-10-01 | ai2-olmo-core-3-moe-explained | Ai2's Olmo-core 3: Why Bigger MoE Models Can Still Run Fast |
| 2026-10-01 | welcome-to-the-local-ai-advisor-blog | Welcome to the Local AI Advisor blog |

## Ideas backlog

| topic | angle | priority |
| --- | --- | --- |
| How much memory do you need to run AI locally? | Turn RAM/VRAM numbers into "what can I run with 8, 16, 32, 64 GB", using /hardware-for-model | high |
| Ollama vs LM Studio for a first-time user | Which app to install first, with honest trade-offs, linking to /stack | high |
| Quantization explained with one picture | What Q4 vs Q8 means for quality, size and speed; link /learn | high |
| Local AI on a MacBook Air vs a gaming PC | Unified memory vs a GPU, in plain terms, with /compare/hardware | medium |
| What the weekly model refresh found | Summarize the latest research/model-refresh report for readers: what changed in popular open models | medium |
| Private by default: what "local" really protects | What stays on your machine, what doesn't (downloads, telemetry, plugins) | medium |
| Is local AI good enough for coding? | Honest look at small coding models vs cloud assistants, with /check for a coding workload | medium |
| Context windows: why long chats slow down | KV cache memory growth explained simply | low |
| Best local AI models for 16 GB of RAM | RAM-tier guide the SEO audit found missing; rank picks with /what-runs-on data, honest about 8 GB limits | high |
| Can you run ChatGPT on your own computer? | Explain gpt-oss (OpenAI's open-weight models) vs ChatGPT, what it takes to run them, with /can-i-run links | high |
| Which MacBook should I buy for local AI? | Hub for MacBook Air vs Pro by memory size, using /compare/hardware | medium |
| Lower-precision formats beyond quantisation | What MXFP8 and BF16 mean in plain terms, and how they differ from Q4/Q8 model files for local users | medium |
| Specialised small models vs one big general model | When a small model trained for one job beats a general chat model locally, with honest limits | low |
| Cloudflare Clef vs Ollama nimble for local triage | Head-to-head: which decision model to run locally, at what hardware cost | medium |
| Can local decision models replace cloud APIs in real agents? | Case-study walkthrough of moving one agent inner loop fully local with measured latency/cost | high |
| Decision models for coding agents: safety gates before shell commands | Using a local decision model as a pre-execution approval gate in coding workflows | medium |
| Open weights does not mean runs on your PC | Why new open-weight releases like DeepSeek V4.1 Flash are not always runnable locally yet; the vLLM/llama.cpp/Ollama architecture-gate explained honestly | medium |
| Qwen-Image-2.1: the new #1 open image model | Text-to-image and editing in one 7B-class model with day-0 ComfyUI support; what VRAM it needs, and the Qwen Research License catch for commercial use | medium |
| transformers now runs GGUF quants | Hugging Face packed-inference path for GGUF in Python: what it means for fine-tuning and introspection, the narrow arch coverage, and why llama.cpp still wins for day-to-day serving | low |
| POCKET-Darwin-180B: can a 180B model really run on a laptop? | 4-bit GGUF, 111 GB, ~3B active params via MoE; what "runs on a laptop" actually means here | medium |
| Budget VRAM rigs: dual RTX 2080 Ti + NVLink as a 44 GB local serving box | Old GPUs joined by NVLink for 27B-class models; used-market math vs one new card | medium |
| Why your second reply is faster: prompt caching explained | How engines keep conversation prefixes so follow-ups skip reprocessing | low |
| llama.cpp typed-decision API (/v1/systemone) | How to run structured yes/no, classification and scoring locally on five open decision-model families | medium |
| Ollama 0.40 pre-release: MLX-by-default on Apple Silicon | What changes for Mac users, and whether to wait on 0.35.1 stable or try the pre-release | medium |
| Full arXiv archive as a 16TB Hugging Face dataset | Stream 3.1M papers without downloading: the corpus half of a local research agent, pairing with AstaBrief-style synthesis | medium |
