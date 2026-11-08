# HYPSOS — Asset Guidelines

All generated assets are reproducible: `npm run assets -- --mockups /path/to/HYPSOS_STREETWEAR_MOCKUP_LIBRARY` (runs `tools/build_assets.py`).

## 1. Current status

| Asset | Status | Location |
|---|---|---|
| Official wordmark | ✅ from `HYPSOS.ai` | `brand/source/`, `public/brand/hypsos-wordmark*.svg`, inline component |
| Cross | ✅ from `CROSS_LOGO.ai` | `public/brand/hypsos-cross*.svg`, 3D in `cross3d.ts` |
| Brand typeface | ✅ Coolvetica Rg / It (woff2) — **licence to verify**; `Hypsos2-Regular.otf` not provided | `public/fonts/` |
| Garment photography | ✅ 26 mockups (blank garments, black & red, front/back) → transparent cut-outs | `public/products/<family>/<color>-<view>-<480|1000>.webp` |
| Missing mockups | ⏳ Beanie red, baseball cap (black/red) — listed in the library manifest but not included in the zips | — |
| Runway figures | ⚠️ Placeholder "ghost outfits" composed from the garments | `public/looks/look-0N-<640|1080>.webp` |
| Model photography | ⏳ **Pending** — three character sheets were shared in chat as previews only (not as files) | — |
| Campaign hero photo / film | ⏳ Pending — slots ready (`PUBLIC_CAMPAIGN_HERO_IMAGE`, `PUBLIC_CAMPAIGN_FILM_SRC`, `PUBLIC_CAMPAIGN_FILM_POSTER`) | — |
| Product detail / fabric / lifestyle shots | ⏳ Pending | — |
| OG image, favicons | ✅ generated from logos in the 3 colours | `public/og-default.jpg`, `favicon.svg`, `icon-*.png` |

Placeholders are always identified on the site (DEMO badges, "looks compuestos" notes, "en producción" labels). Never present demo imagery as a real campaign.

## 2. Photography direction

- **Campaign**: editorial fashion, cinematic; direct flash, side light, back light, deep shadows; urban or studio; models in motion; single-subject frames with negative space. Skin and garments keep natural colour.
- **Product (per colour)**: front, back, side, close-up, fabric detail, construction detail, graphic detail, lifestyle, full-body on model.
- **Runway models**: full body, standing, feet visible, neutral pose, even light, shot on a plain background so they can be cut out.

## 3. Formats, ratios, resolutions

| Use | Ratio | Delivery | Min source |
|---|---|---|---|
| Product (cards, PDP, cart) | 4:5 | WebP/AVIF, transparent or plain, 480 + 1000 + 1600w | 2000×2500 |
| Runway figure | 9:16 | **Transparent** WebP/PNG, 640 + 1080w (feet at the bottom, ~3% margin) | 1080×1920 |
| Campaign hero | 16:9 desktop / 4:5 or 9:16 mobile | JPEG/WebP/AVIF | 3200px wide |
| Editorial tiles | 4:5, 16:11, 1:1 | WebP | 2000px |
| Campaign film | 16:9 (plus 9:16 cut) | MP4 H.264 + WebM, muted-friendly, ≤ 8 Mbps, poster JPEG | 1920×1080 |
| OG | 1200×630 | JPEG | — |

## 4. Naming & organisation

```
public/
  brand/      hypsos-<wordmark|cross>[-<obsidian|ice|crimson>].svg
  fonts/      <family>-<style>.woff2
  products/   <family>/<color>-<view>-<width>.webp      e.g. pullover-hoodie/red-back-1000.webp
  looks/      look-<NN>-<width>.webp                   e.g. look-03-1080.webp
  campaign/   <campaign>-<shot>-<width>.<ext>           e.g. 001-hero-3200.avif
```
Lower-case, hyphens, no spaces, colour in English (`black`, `red`), view in English (`front`, `back`, `side`, `detail`, `lifestyle`).

With Shopify connected, product images come from Shopify: upload in order **front → back → details** per colour, set **alt text** (include `back`/`detrás` for back views), and attach each variant's image so the gallery filters by colour automatically.

## 5. Replacing the runway figures with real models

1. Cut out each model (transparent background), export 1080×1920 and 640×1138 WebP.
2. Save as `public/looks/look-0N-1080.webp` / `-640.webp` (or new names).
3. In `src/data/looks.ts` set `probe: true` (automatic feet-to-floor alignment) and adjust each piece `pin` (left %, top % of the figure) and the look `pieces` (handles + colour).
4. The "looks compuestos" placeholder note disappears automatically once every look has `probe: true`.

## 6. Video

Never autoplay with sound; the film component plays muted, loops, has play/pause and mute toggles, a poster, and `preload="none"`.

## 7. Logos & typography

Use only the SVGs in `public/brand/` or the inline components. Minimum wordmark width 88px (digital); clear space = height of the cross's central bar on every side. Coolvetica for display, Inter for UI, IBM Plex Mono for labels.

## 8. 3D assets

The 3D cross is procedural (extruded from the official path) — no external model files. Future 3D assets (garment scans, type) should be glTF/GLB with Draco/Meshopt compression, ≤ 2 MB, lazy-loaded and with a static fallback image.
