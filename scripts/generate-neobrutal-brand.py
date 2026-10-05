"""Generate the neobrutalism logo set and the local-stack illustration for Local AI Advisor.

Writes SVGs to public/brand. Pass --png to also rasterize logo-mark-128.png / logo-mark-512.png
(needs Playwright with Chromium installed; transparent background).
"""

import argparse
from pathlib import Path
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1] / "public" / "brand"

INK = "#171410"
CREAM = "#FDF8E7"
YELLOW = "#FFCF1F"
GREEN = "#2EE88C"
PINK = "#FF9BE8"
BLUE = "#6FA8FF"
ORANGE = "#FF9F43"
TEAL = "#2A9D8F"
FONT = 'font-family="Arial,Helvetica,sans-serif"'


def save(name, w, h, label, body):
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{label}">{body}</svg>'
    ElementTree.fromstring(svg)
    (ROOT / name).write_text(svg + "\n")


def mark(line=INK, shadow=INK, fill=YELLOW):
    """64x64 mark: a yellow tile with a hard shadow, four progress segments and a green result dot."""
    return f"""<rect x="6" y="6" width="54" height="54" rx="14" fill="{shadow}"/>
<rect x="2" y="2" width="54" height="54" rx="14" fill="{fill}" stroke="{line}" stroke-width="4"/>
<path d="M13 37h9m4 0h9m4 0h4" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>
<path d="M13 25h19" stroke="{INK}" stroke-opacity=".7" stroke-width="4" stroke-linecap="round"/>
<circle cx="42" cy="24" r="5.5" fill="{GREEN}" stroke="{INK}" stroke-width="3"/>"""


def logos():
    save("logo-mark.svg", 64, 64, "Local AI Advisor mark", mark())
    # Variant for dark backgrounds: cream outline and shadow keep the tile readable.
    save("logo-mark-light.svg", 64, 64, "Local AI Advisor mark", mark(line=CREAM, shadow=CREAM))
    for name, text, line in (("logo-horizontal.svg", INK, INK), ("logo-horizontal-dark.svg", CREAM, CREAM)):
        body = (
            mark(line=line, shadow=line)
            + f'<rect x="170" y="14" width="92" height="36" rx="8" fill="{YELLOW}" stroke="{line}" stroke-width="3"/>'
            + f'<text x="80" y="40" fill="{text}" {FONT} font-size="22" font-weight="800" letter-spacing="-.7">Local AI</text>'
            + f'<text x="180" y="40" fill="{INK}" {FONT} font-size="22" font-weight="800" letter-spacing="-.7">Advisor</text>'
        )
        save(name, 272, 64, "Local AI Advisor logo", body)


def stack():
    cards = [("Hardware", YELLOW), ("Runtime", PINK), ("Model", GREEN), ("Local API", BLUE), ("AI tool", ORANGE)]
    out = [
        f'<rect width="1200" height="500" fill="{CREAM}"/>',
        f'<text x="60" y="84" fill="{INK}" {FONT} font-size="34" font-weight="800">Your local AI stack</text>',
        f'<text x="60" y="122" fill="#4A443B" {FONT} font-size="19">Five connected choices, one usable setup.</text>',
    ]
    for i, (label, color) in enumerate(cards):
        x = 60 + i * 226
        y = 175
        out += [
            f'<rect x="{x + 7}" y="{y + 7}" width="192" height="220" rx="18" fill="{INK}"/>',
            f'<rect x="{x}" y="{y}" width="192" height="220" rx="18" fill="#FFFFFF" stroke="{INK}" stroke-width="4"/>',
            f'<rect x="{x + 22}" y="{y + 24}" width="58" height="58" rx="14" fill="{color}" stroke="{INK}" stroke-width="4"/>',
            f'<circle cx="{x + 51}" cy="{y + 53}" r="9" fill="{INK}"/>',
            f'<rect x="{x + 22}" y="{y + 108}" width="120" height="10" rx="5" fill="#E8E2D0"/>',
            f'<rect x="{x + 22}" y="{y + 130}" width="90" height="10" rx="5" fill="#E8E2D0"/>',
            f'<text x="{x + 22}" y="{y + 190}" fill="{INK}" {FONT} font-size="24" font-weight="800">{label}</text>',
        ]
        if i < len(cards) - 1:
            ax = x + 200
            out.append(f'<path d="M{ax} {y + 110}h16m-7-8 8 8-8 8" fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>')
    save("illustration-local-stack.svg", 1200, 500, "Five connected parts of a local AI stack", "\n".join(out))


def rasterize():
    from playwright.sync_api import sync_playwright

    svg = (ROOT / "logo-mark.svg").read_text()
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for size in (128, 512):
            page = browser.new_page(viewport={"width": size, "height": size})
            page.set_content(f'<body style="margin:0;background:transparent">{svg.replace("width=\"64\" height=\"64\"", f"width=\"{size}\" height=\"{size}\"")}</body>')
            page.screenshot(path=str(ROOT / f"logo-mark-{size}.png"), omit_background=True)
        browser.close()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--png", action="store_true", help="also write logo-mark-128.png and logo-mark-512.png")
    args = ap.parse_args()
    ROOT.mkdir(parents=True, exist_ok=True)
    logos()
    stack()
    if args.png:
        rasterize()
    print("wrote neobrutalism brand assets to", ROOT)
