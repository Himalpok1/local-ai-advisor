"""LEGACY (indigo) brand asset generator. Superseded by generate-neobrutal-brand.py for the logos and stack illustration; running this overwrites them with the old look."""

from pathlib import Path
from xml.etree import ElementTree
from PIL import Image, ImageDraw, ImageFont
import math

ROOT = Path(__file__).resolve().parents[1] / "public" / "brand"
ROOT.mkdir(parents=True, exist_ok=True)

INK = "#20263A"
INDIGO = "#514BC8"
GREEN = "#2C9B75"
AMBER = "#D99B32"
CORAL = "#D46D5C"
IVORY = "#F7F7F5"
PALE = "#E9EAF4"


def save(name, body, w, h, label):
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{label}">{body}</svg>'''
    ElementTree.fromstring(svg)
    (ROOT / name).write_text(svg + "\n")


def mark(size=64, bg=INDIGO):
    return f'''<rect width="{size}" height="{size}" rx="{size*.23}" fill="{bg}"/>
<path d="M{size*.23} {size*.56}h{size*.16}m{size*.06} 0h{size*.16}m{size*.06} 0h{size*.11}" stroke="white" stroke-width="{size*.085}" stroke-linecap="round"/>
<path d="M{size*.23} {size*.38}h{size*.34}" stroke="white" stroke-opacity=".78" stroke-width="{size*.07}" stroke-linecap="round"/>
<circle cx="{size*.74}" cy="{size*.37}" r="{size*.09}" fill="{GREEN}" stroke="white" stroke-width="{size*.035}"/>'''


save("logo-mark.svg", mark(), 64, 64, "Local AI Advisor mark")
save("logo-mark-light.svg", mark(bg=INK), 64, 64, "Local AI Advisor mark, dark base")
save("logo-horizontal.svg", mark() + f'''<text x="80" y="40" fill="{INK}" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" letter-spacing="-.7">Local AI</text><text x="180" y="40" fill="{INDIGO}" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" letter-spacing="-.7">Advisor</text>''', 272, 64, "Local AI Advisor logo")
save("logo-horizontal-dark.svg", mark(bg=INK) + f'''<text x="80" y="40" fill="#FFFFFF" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" letter-spacing="-.7">Local AI</text><text x="180" y="40" fill="#A9A5FF" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" letter-spacing="-.7">Advisor</text>''', 272, 64, "Local AI Advisor logo for dark surfaces")

icons = {
    "hardware": (INDIGO, '<rect x="12" y="14" width="40" height="36" rx="8"/><path d="M21 8v6m11-6v6m11-6v6M21 50v6m11-6v6m11-6v6M6 24h6M6 40h6m40-16h6m-6 16h6"/><rect x="23" y="25" width="18" height="14" rx="3"/>'),
    "model": (INDIGO, '<rect x="13" y="12" width="38" height="12" rx="5"/><rect x="13" y="27" width="38" height="12" rx="5"/><rect x="13" y="42" width="38" height="12" rx="5"/><path d="M22 18h15M22 33h20M22 48h12"/>'),
    "memory": (AMBER, '<rect x="10" y="16" width="44" height="32" rx="7"/><path d="M18 24h28M18 32h21M18 40h15M17 10v6m15-6v6m15-6v6M17 48v6m15-6v6m15-6v6"/>'),
    "speed": (CORAL, '<path d="M13 44a22 22 0 1 1 38 0"/><path d="m32 34 12-13-6 17"/><circle cx="32" cy="38" r="3"/><path d="M22 49h20"/>'),
    "compatibility": (GREEN, '<rect x="9" y="14" width="22" height="36" rx="7"/><rect x="33" y="14" width="22" height="36" rx="7"/><path d="m24 32 5 5 11-12"/>'),
    "comfort": (GREEN, '<circle cx="32" cy="32" r="23"/><path d="m20 32 8 8 17-18"/>'),
}
for name, (color, drawing) in icons.items():
    save(f"icon-{name}.svg", f'''<circle cx="32" cy="32" r="31" fill="{IVORY}"/><g fill="none" stroke="{color}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">{drawing}</g>''', 64, 64, f"{name.title()} icon")

card = f'''<rect width="1200" height="520" rx="28" fill="{IVORY}"/>
<text x="70" y="77" fill="{INK}" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="700">Four levels of local AI fit</text>
<text x="70" y="112" fill="#667085" font-family="Arial,Helvetica,sans-serif" font-size="17">From physically possible to genuinely comfortable.</text>'''
for i, (title, detail, color) in enumerate([
    ("01  Load", "Fits in memory", INDIGO),
    ("02  Run", "Runtime works", AMBER),
    ("03  Usable", "Enough speed", CORAL),
    ("04  Comfortable", "Room to work", GREEN),
]):
    x = 70 + i * 280
    card += f'''<rect x="{x}" y="185" width="248" height="245" rx="20" fill="white" stroke="#DDDFE8"/>
    <rect x="{x+20}" y="210" width="208" height="8" rx="4" fill="{PALE}"/>
    <rect x="{x+20}" y="210" width="{(i+1)*52}" height="8" rx="4" fill="{color}"/>
    <circle cx="{x+52}" cy="285" r="31" fill="{color}" opacity=".13"/>
    <text x="{x+52}" y="295" text-anchor="middle" fill="{color}" font-family="Arial,Helvetica,sans-serif" font-size="27" font-weight="700">{i+1}</text>
    <text x="{x+20}" y="355" fill="{INK}" font-family="Arial,Helvetica,sans-serif" font-size="21" font-weight="700">{title}</text>
    <text x="{x+20}" y="390" fill="#667085" font-family="Arial,Helvetica,sans-serif" font-size="17">{detail}</text>'''
    if i < 3:
        card += f'<path d="M{x+252} 302h20m-8-8 8 8-8 8" fill="none" stroke="#A6AABD" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
save("illustration-four-tiers.svg", card, 1200, 520, "Four progressive levels of local AI model fit")

stack = f'''<rect width="1200" height="500" rx="28" fill="{IVORY}"/>
<text x="70" y="78" fill="{INK}" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="700">Your local AI stack</text>
<text x="70" y="113" fill="#667085" font-family="Arial,Helvetica,sans-serif" font-size="17">Five connected choices, one usable setup.</text>'''
for i, (title, color) in enumerate([("Hardware", INDIGO), ("Runtime", AMBER), ("Model", CORAL), ("Local API", GREEN), ("AI tool", INDIGO)]):
    x = 70 + i * 228
    stack += f'''<rect x="{x}" y="188" width="198" height="210" rx="20" fill="white" stroke="#DDDFE8"/>
    <rect x="{x+24}" y="215" width="52" height="52" rx="14" fill="{color}"/>
    <circle cx="{x+50}" cy="241" r="9" fill="white"/>
    <rect x="{x+24}" y="293" width="116" height="9" rx="4" fill="#E5E7ED"/>
    <rect x="{x+24}" y="315" width="86" height="9" rx="4" fill="#E5E7ED"/>
    <text x="{x+24}" y="370" fill="{INK}" font-family="Arial,Helvetica,sans-serif" font-size="20" font-weight="700">{title}</text>'''
    if i < 4:
        stack += f'<path d="M{x+203} 292h17m-7-7 7 7-7 7" fill="none" stroke="#A6AABD" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
save("illustration-local-stack.svg", stack, 1200, 500, "Five connected parts of a local AI stack")

# Animated GIF: one step at a time, with a deliberate hold at the final verdict.
scale = 2
W, H = 720, 360
frames = []
palette = [INDIGO, AMBER, CORAL, GREEN]
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 26 * scale)
    small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 17 * scale)
except OSError:
    font = small = ImageFont.load_default()

def box(draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(tuple(int(v*scale) for v in xy), radius=radius*scale, fill=fill, outline=outline, width=width*scale)

for phase in range(20):
    im = Image.new("RGB", (W*scale, H*scale), IVORY)
    d = ImageDraw.Draw(im)
    box(d, (30, 24, 690, 336), 25, "#FFFFFF", "#E2E3E8")
    d.text((60*scale, 55*scale), "Model fit, explained", font=font, fill=INK)
    d.text((60*scale, 97*scale), "A better verdict takes four checks.", font=small, fill="#667085")
    labels = ["Load", "Run", "Usable", "Comfort"]
    for i, (label, color) in enumerate(zip(labels, palette)):
        x = 60 + i*157
        active = phase >= (i+1)*4
        box(d, (x, 166, x+135, 258), 14, color if active else "#F0F1F5")
        dot = "#FFFFFF" if active else color
        d.ellipse(((x+16)*scale, 185*scale, (x+42)*scale, 211*scale), fill=dot)
        d.text(((x+16)*scale, 224*scale), label, font=small, fill="#FFFFFF" if active else INK)
    verdict = "Comfortable" if phase >= 16 else "Checking your setup"
    d.text((60*scale, 286*scale), verdict, font=small, fill=GREEN if phase >= 16 else "#667085")
    frames.append(im.resize((W, H), Image.Resampling.LANCZOS))
frames[0].save(ROOT / "fit-check.gif", save_all=True, append_images=frames[1:], duration=[100]*16+[180]*4, loop=0, optimize=True)
frames[-1].save(ROOT / "fit-check-poster.png")

print(f"Generated {len(list(ROOT.iterdir()))} assets in {ROOT}")
