#!/usr/bin/env python3
"""
HYPSOS — asset pipeline.

Regenerates every web-ready brand/product asset from the original sources.

    python3 -I tools/build_assets.py --mockups /path/to/HYPSOS_STREETWEAR_MOCKUP_LIBRARY

Inputs
  brand/source/HYPSOS.ai        official wordmark (PDF-compatible .ai)
  brand/source/CROSS_LOGO.ai    official cross
  brand/source/Coolvetica_*.otf brand display typeface
  --mockups                     HYPSOS_STREETWEAR_MOCKUP_LIBRARY folder (PNG, light studio background)

Outputs
  public/brand/*.svg            logo vectors (geometry untouched, fill=currentColor)
  src/data/generated/logos.json path data for inline SVG components
  public/fonts/*.woff2          brand typeface
  public/products/<family>/<color>-<view>-<w>.webp   transparent cut-outs (4:5)
  public/looks/look-0N-<w>.webp                       "ghost outfit" figures (9:16, transparent)
  public/og-default.jpg, favicons
  src/data/generated/assets.json  manifest consumed by the demo catalog

Requires: pdftocairo + pdftoppm (poppler), Pillow, numpy, fontTools[woff2] (brotli).
Only the three official colours are used for anything generated here
(#090303 obsidian, #B8DEF5 ice, #E20A21 crimson). Garment photography keeps its natural colour.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
GEN = ROOT / "src" / "data" / "generated"

OBSIDIAN = (9, 3, 3)
ICE = (184, 222, 245)
CRIMSON = (226, 10, 33)

FAMILIES = {
    "01_OVERSIZED_TSHIRT": ("oversized-tee", "OVERSIZED_TSHIRT"),
    "02_BAGGY_SHORTS": ("baggy-shorts", "BAGGY_SHORTS"),
    "03_BAGGY_PANTS": ("baggy-pants", "BAGGY_PANTS"),
    "04_ZIP_UP_HOODIE": ("zip-hoodie", "ZIP_UP_HOODIE"),
    "05_PULLOVER_HOODIE": ("pullover-hoodie", "PULLOVER_HOODIE"),
    "06_CREWNECK_SWEATSHIRT": ("crewneck", "CREWNECK_SWEATSHIRT"),
    "07_BEANIE": ("beanie", "BEANIE"),
    "08_BASEBALL_CAP": ("cap", "BASEBALL_CAP"),
}

# Real-world reference sizes (cm) used only to give the composed looks plausible proportions.
GARMENT_CM = {
    "oversized-tee": ("w", 72),
    "crewneck": ("w", 74),
    "pullover-hoodie": ("w", 76),
    "zip-hoodie": ("w", 76),
    "baggy-pants": ("h", 106),
    "baggy-shorts": ("h", 56),
    "beanie": ("w", 25),
}
TOP_OVERLAP_CM = {"oversized-tee": 17, "crewneck": 12, "pullover-hoodie": 12, "zip-hoodie": 12}
WAIST_CM = 106

# Six demo looks (ghost-outfit figures). Replace with real model cut-outs when the campaign is shot.
LOOKS = [
    {"top": ("oversized-tee", "black"), "bottom": ("baggy-pants", "red"), "head": ("beanie", "black")},
    {"top": ("pullover-hoodie", "red"), "bottom": ("baggy-pants", "black"), "head": None},
    {"top": ("zip-hoodie", "black"), "bottom": ("baggy-shorts", "black"), "head": None},
    {"top": ("crewneck", "red"), "bottom": ("baggy-pants", "black"), "head": ("beanie", "black")},
    {"top": ("oversized-tee", "red"), "bottom": ("baggy-shorts", "red"), "head": ("beanie", "black")},
    {"top": ("pullover-hoodie", "black"), "bottom": ("baggy-pants", "red"), "head": None},
]


# --------------------------------------------------------------------------- logos

NUM = re.compile(r"-?\d+(?:\.\d+)?")


def svg_paths(pdf: Path) -> list[str]:
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "x.svg"
        subprocess.run(["pdftocairo", "-svg", str(pdf), str(out)], check=True)
        text = out.read_text()
    return re.findall(r'<path[^>]*\sd="([^"]+)"', text)


def compact(d: str) -> str:
    def r(m):
        v = float(m.group(0))
        s = f"{v:.2f}".rstrip("0").rstrip(".")
        return "0" if s in ("-0", "") else s

    d = NUM.sub(r, d)
    return re.sub(r"\s+", " ", d).strip()


def bbox_of(paths: list[str]) -> tuple[float, float, float, float]:
    xs, ys = [], []
    for d in paths:
        nums = [float(n) for n in NUM.findall(d)]
        xs += nums[0::2]
        ys += nums[1::2]
    return min(xs), min(ys), max(xs), max(ys)


def build_logos() -> dict:
    out = {}
    (PUBLIC / "brand").mkdir(parents=True, exist_ok=True)
    for key, src in (("wordmark", "HYPSOS.ai"), ("cross", "CROSS_LOGO.ai")):
        paths = [compact(d) for d in svg_paths(ROOT / "brand" / "source" / src)]
        x0, y0, x1, y1 = bbox_of(paths)
        pad = 2
        vb = [round(x0 - pad, 2), round(y0 - pad, 2), round(x1 - x0 + 2 * pad, 2), round(y1 - y0 + 2 * pad, 2)]
        d = " ".join(paths)
        out[key] = {"viewBox": " ".join(str(v) for v in vb), "d": d, "w": vb[2], "h": vb[3]}
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{out[key]["viewBox"]}" '
            f'fill="currentColor"><title>HYPSOS</title><path d="{d}"/></svg>\n'
        )
        (PUBLIC / "brand" / f"hypsos-{key}.svg").write_text(svg)
        # coloured variants for contexts where currentColor is unavailable (OG, mail, favicon)
        for cname, rgb in (("obsidian", OBSIDIAN), ("ice", ICE), ("crimson", CRIMSON)):
            hexv = "#%02X%02X%02X" % rgb
            (PUBLIC / "brand" / f"hypsos-{key}-{cname}.svg").write_text(svg.replace("currentColor", hexv))
    GEN.mkdir(parents=True, exist_ok=True)
    (GEN / "logos.json").write_text(json.dumps(out))
    return out


def logo_mask(src: str, dpi: int = 300) -> Image.Image:
    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp) / "r"
        subprocess.run(["pdftoppm", "-r", str(dpi), "-gray", "-png", str(ROOT / "brand" / "source" / src), str(base)], check=True)
        img = Image.open(next(Path(tmp).glob("r*.png"))).convert("L")
        img.load()
    mask = Image.eval(img, lambda v: 255 - v)
    return mask.crop(mask.getbbox())


def solid(size, rgb):
    return Image.new("RGB", size, rgb)


def paste_mask(canvas: Image.Image, mask: Image.Image, rgb, box_w: int, center):
    m = mask.resize((box_w, round(mask.height * box_w / mask.width)), Image.LANCZOS)
    layer = Image.new("RGB", m.size, rgb)
    canvas.paste(layer, (round(center[0] - m.width / 2), round(center[1] - m.height / 2)), m)
    return m.size


def build_icons():
    cross = logo_mask("CROSS_LOGO.ai", 200)
    word = logo_mask("HYPSOS.ai", 150)
    # favicons: crimson cross on obsidian
    for size, name in ((32, "favicon-32.png"), (180, "apple-touch-icon.png"), (192, "icon-192.png"), (512, "icon-512.png")):
        c = solid((size, size), OBSIDIAN)
        paste_mask(c, cross, CRIMSON, round(size * 0.74), (size / 2, size / 2))
        c.save(PUBLIC / name)
    # OG image 1200x630
    og = solid((1200, 630), OBSIDIAN)
    paste_mask(og, word, ICE, 760, (600, 330))
    paste_mask(og, cross, CRIMSON, 64, (600, 92))
    og.save(PUBLIC / "og-default.jpg", quality=88)


# --------------------------------------------------------------------------- fonts

def build_fonts():
    from fontTools.ttLib import TTFont

    (PUBLIC / "fonts").mkdir(parents=True, exist_ok=True)
    for src, dst in (("Coolvetica_Rg.otf", "coolvetica-regular.woff2"), ("Coolvetica_Rg_It.otf", "coolvetica-italic.woff2")):
        f = TTFont(ROOT / "brand" / "source" / src)
        f.flavor = "woff2"
        f.save(PUBLIC / "fonts" / dst)


# --------------------------------------------------------------------------- garments

def cutout(path: Path) -> Image.Image:
    """Key the light studio background out of a mockup → RGBA, trimmed."""
    rgb = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    lum = rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    h, w = lum.shape
    border = np.concatenate([rgb[:8].reshape(-1, 3), rgb[-8:].reshape(-1, 3), rgb[:, :8].reshape(-1, 3), rgb[:, -8:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    lo, hi = 112.0, 196.0  # luminance ramp: <=lo opaque, >=hi transparent (drops the soft floor shadow)
    a = np.clip((hi - lum) / (hi - lo), 0, 1)
    a = a * a * (3 - 2 * a)  # smoothstep
    # un-premultiply the background out of semi-transparent edge pixels
    safe = np.maximum(a, 1e-3)[..., None]
    col = np.clip((rgb - (1 - a)[..., None] * bg) / safe, 0, 255)
    col = np.where(a[..., None] > 0.995, rgb, col)
    out = np.dstack([col, a * 255]).astype(np.uint8)
    img = Image.fromarray(out, "RGBA")
    bb = Image.fromarray((a > 0.04).astype(np.uint8) * 255).getbbox()
    return img.crop(bb)


def fit_canvas(img: Image.Image, w: int, h: int, fill=0.84) -> Image.Image:
    scale = min(w * fill / img.width, h * fill / img.height)
    im = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    c = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    c.alpha_composite(im, ((w - im.width) // 2, (h - im.height) // 2))
    return c


def save_webp(img: Image.Image, path: Path, width: int, quality=82):
    path.parent.mkdir(parents=True, exist_ok=True)
    im = img if img.width == width else img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    im.save(path, "WEBP", quality=quality, method=6)
    return {"src": "/" + str(path.relative_to(PUBLIC)), "w": im.width, "h": im.height}


def build_products(mockups: Path) -> tuple[dict, dict]:
    manifest: dict = {}
    cuts: dict = {}
    for folder, (family, stem) in FAMILIES.items():
        for color in ("BLACK", "RED"):
            for view in ("FRONT", "BACK"):
                p = mockups / folder / color / f"{stem}_{color}_{view}.png"
                if not p.exists():
                    continue
                cut = cutout(p)
                cuts[(family, color.lower(), view.lower())] = cut
                canvas = fit_canvas(cut, 1000, 1250)
                key = f"{family}/{color.lower()}-{view.lower()}"
                manifest[key] = {
                    str(wd): save_webp(canvas, PUBLIC / "products" / family / f"{color.lower()}-{view.lower()}-{wd}.webp", wd)
                    for wd in (480, 1000)
                }
    return manifest, cuts


def scaled(cut: Image.Image, family: str, px_per_cm: float) -> Image.Image:
    axis, cm = GARMENT_CM[family]
    target = cm * px_per_cm
    s = target / (cut.width if axis == "w" else cut.height)
    return cut.resize((max(1, round(cut.width * s)), max(1, round(cut.height * s))), Image.LANCZOS)


def build_looks(cuts: dict) -> list:
    W, H = 1080, 1920
    ppc = 8.7  # px per cm
    ground = H - 8
    out = []
    for i, look in enumerate(LOOKS, 1):
        canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        bfam, bcol = look["bottom"]
        bottom = scaled(cuts[(bfam, bcol, "front")], bfam, ppc)
        waist_y = ground - WAIST_CM * ppc
        canvas.alpha_composite(bottom, ((W - bottom.width) // 2, round(waist_y)))
        tfam, tcol = look["top"]
        top = scaled(cuts[(tfam, tcol, "front")], tfam, ppc)
        hem_y = waist_y + TOP_OVERLAP_CM[tfam] * ppc
        top_y = round(hem_y - top.height)
        canvas.alpha_composite(top, ((W - top.width) // 2, top_y))
        if look["head"]:
            hfam, hcol = look["head"]
            head = scaled(cuts[(hfam, hcol, "front")], hfam, ppc)
            # beanie floats where the head would be: ~14cm above the collar line
            canvas.alpha_composite(head, ((W - head.width) // 2, round(top_y - 14 * ppc - head.height)))
        bb = canvas.getbbox()
        entry = {
            "index": i,
            "bbox": bb,
            "pieces": [look["head"], look["top"], look["bottom"]],
            "1080": save_webp(canvas, PUBLIC / "looks" / f"look-{i:02d}-1080.webp", 1080, 80),
            "640": save_webp(canvas, PUBLIC / "looks" / f"look-{i:02d}-640.webp", 640, 80),
        }
        # pin anchors (% of the 9:16 figure box) — centre of each piece
        pins = []
        def pct(x, y):
            return [round(100 * x / W, 1), round(100 * y / H, 1)]
        if look["head"]:
            pins.append({"piece": "head", "at": pct(W / 2, top_y - 14 * ppc - head.height / 2)})
        pins.append({"piece": "top", "at": pct(W / 2 + top.width * 0.08, top_y + top.height * 0.42)})
        pins.append({"piece": "bottom", "at": pct(W / 2 - bottom.width * 0.12, waist_y + bottom.height * 0.62)})
        entry["pins"] = pins
        out.append(entry)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mockups", type=Path, help="HYPSOS_STREETWEAR_MOCKUP_LIBRARY folder")
    ap.add_argument("--skip-garments", action="store_true")
    args = ap.parse_args()
    PUBLIC.mkdir(exist_ok=True)
    GEN.mkdir(parents=True, exist_ok=True)
    build_logos()
    build_icons()
    build_fonts()
    if args.mockups and not args.skip_garments:
        products, cuts = build_products(args.mockups)
        looks = build_looks(cuts)
        (GEN / "assets.json").write_text(json.dumps({"products": products, "looks": looks}, indent=1))
    print("assets ok")


if __name__ == "__main__":
    main()
