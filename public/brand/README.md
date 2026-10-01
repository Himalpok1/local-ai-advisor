# Local AI Advisor asset set

These brand assets are stored in `public/brand`. The website uses the mark, feature icons, illustrations, editorial images, and fit-check animation; alternate logo exports remain available for future uses.

## Visual direction

- Minimal geometric forms with calm, editorial spacing.
- Solid indigo (`#514BC8`), emerald (`#2C9B75`), amber (`#D99B32`), and coral (`#D46D5C`) on ivory (`#F7F7F5`) and ink (`#20263A`).
- No neon, gradient fills, or glow effects.
- The mark uses four progress segments and a green result dot, reflecting the app's four fit levels.

## Files

| Asset | Intended use |
| --- | --- |
| `logo-mark.svg`, `logo-mark-light.svg` | Compact app/social mark on light or dark contexts |
| `logo-horizontal.svg`, `logo-horizontal-dark.svg` | Header, footer, and media lockups |
| `logo-mark-128.png`, `logo-mark-512.png` | Raster mark exports; also used to make `app/favicon.ico` |
| `icon-{hardware,model,memory,speed,compatibility,comfort}.svg` | Topic and feature icons |
| `illustration-four-tiers.svg` | Capability explanation graphic |
| `illustration-local-stack.svg` | Stack builder explainer graphic |
| `editorial-capability-layers.png/.webp` | Hero or article illustration |
| `editorial-model-choice.png/.webp` | Model selection or social illustration |
| `fit-check.gif`, `fit-check-poster.png` | Short four-step progress loop and reduced-motion still |
| `asset-preview.png` | Contact sheet for review only |

Vector assets and the GIF can be regenerated with `python3 scripts/generate-brand-assets.py`. The editorial images are original generated raster assets.
