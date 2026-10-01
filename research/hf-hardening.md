# Hugging Face live-import hardening — 2026-10-01

A–L: imports now rate native context and explain RoPE extensions; refuse embeddings/rerankers; summarize commercial-use licenses; discover community GGUF quants and measured sizes; identify template/name/config capability signals; support FP8; deduplicate in-flight Hub work; offer accessible search and validated local preferences; and serve 30 seeded model pages with default-hardware recommendations, canonical URLs, sitemap entries and OG cards. The refresh script uses six workers, preserves report ordering, retries 429/5xx twice, and has a weekly review-only workflow.

## Corrections to the requested assumptions

- `safetensors.total` is the number of parameters, **not bytes**. Dividing it by GiB would halve FP16 weights and mislabel a guess as exact. We keep it for parameter counts and measure root safetensors weight files only when the config explicitly identifies unquantized FP16/BF16. Exact sizes carry format provenance into the memory engine. See [HF metadata parsing](https://huggingface.co/docs/safetensors/metadata_parsing) and [Hub API types](https://github.com/huggingface/huggingface_hub/blob/main/src/huggingface_hub/hf_api.py).
- The initial report contained 13 trending entries, including one ASR model. The hardcoded 30-page seed uses 12 text-model entries and 18 catalog rows from the same report, ordered by downloads. No build-time trending query is used. Page data is read from the Hub and revalidated after six hours. Unavailable facts produce an honest, noindex retry page rather than an invented rating.
- Next 16 file-based image functions receive route params, not query parameters. `/hugging-face/opengraph-image` is the generic card; query URLs explicitly point to `/hf/<owner>/<model>/opengraph-image` for model-specific cards.

## Provenance and limits

License summaries use the declared license, not a legal determination. Conditional notes follow [Gemma terms](https://ai.google.dev/gemma/terms), [Meta's community license](https://github.com/meta-llama/llama-models/blob/main/models/llama4/LICENSE), and [BigCode OpenRAIL](https://www.bigcode-project.org/docs/pages/bigcode-openrail/). Model cards remain authoritative.

Conversion matching is based on the model slug and prioritizes known publishers; it does not prove tensor equivalence. The UI warns about this and about unverified MLX conversions. Template/name/config signals do not establish benchmarked capability. Cache and rate limits are process-local, as before.

The refreshed report has 13 review rows under the native-context comparison policy. It retains the existing headings, table columns and trending-list shape. No curated entries were changed.

## Verification

Automated tests cover native/extended context, refusal through the API, license normalization, measured sizes and format isolation, signal provenance, tokenizer fallback, GGUF discovery/merge/failure and in-flight sharing, FP8, repo normalization, persisted-state validation and rate-limit reset. Next 16 docs for static params, metadata and ImageResponse were reviewed locally.

HTTP checks verify canonical/model-specific OG metadata and PNG generation. Browser-based checks remain pending because the available computer-use provider reports no connected browsers:

- Search: badges, mouse selection, ArrowDown/Up including wrap, Enter selection, Escape dismissal, active option announcement.
- Refusal: submit an embedding repo and verify the helpful error appears in the alert region.
- Persistence: change hardware/workload and reload a fresh lookup; invalid saved JSON falls back; private-mode storage failures remain harmless; explicit shared hardware takes precedence.
- Facts: native/extended context, commercial-use badge, provenance, file-size versus computed labels; inspect responsive layout.

The workflow was parsed as YAML; it was not pushed or executed on GitHub.

Final verification: `npm run typecheck && npm test && npm run lint && npm run build` passed (91 tests). All 30 generated model HTML files contain facts. A separately started production server returned the expected 422 embedding refusal, canonical and model-specific OG metadata, a 1200×630 PNG (visually inspected), and 30 HF sitemap entries. No `HF_TOKEN` or authorization-header identifiers were found in client static bundles. `git diff --check` passed, and `data/models.ts` is unchanged.
