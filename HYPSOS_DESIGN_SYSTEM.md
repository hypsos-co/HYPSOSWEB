# HYPSOS — Design System

> **BUILT FOR THE TOP. THE ELEVATION.**
> Luxury streetwear × cinematic editorial × experimental design × Apple-level interaction.

Single source of truth in code: `src/styles/tokens.css` (tokens) · `src/styles/base.css` (primitives) · `src/styles/components.css` (shared components) · `src/styles/runway.css` (runway).

---

## 1. Art direction

Three modes share one chromatic and typographic identity:

| Mode | Where | Rules |
|---|---|---|
| **A — Editorial** | Home, About, Campaigns, Lookbook | Full-bleed, monumental Coolvetica type, asymmetry, generous negative space, scroll-linked motion. Photography (or product) carries the emotion; text never crowds an image. |
| **B — Product** | Shop, collections, product page, runway | Garments on an **Ice plinth** (`.plinth`), clear hierarchy name → price → options → CTA, fast quick add, contextual navigation. |
| **C — Functional** | Cart, search, account, help, legal | Clarity first: forms, accordions, readable prose (`.prose`), minimal motion. |

References were studied for principles only (nothing copied): **21 TSI** (full-bleed editorial, silence vs. scale jumps, ghost pills), **Apple** (product plinth, precise interaction, pinned storytelling), **Shelby** (monumental type, mono micro-labels, colour-field section bands), **Slush** (sculptural display type, 3D object as brand symbol), **Cake Equity** (form structure, panels, spacing). The original reference files live in `docs/references/`.

## 2. Brand identity

- **Wordmark** — official gothic HYPSOS logo, converted from `brand/source/HYPSOS.ai` by `tools/build_assets.py` (geometry untouched). Component: `src/components/brand/Wordmark.astro` (inline SVG, `fill=currentColor`). Files: `public/brand/hypsos-wordmark*.svg`.
- **Cross** — independent identity element from `brand/source/CROSS_LOGO.ai`. Component: `Cross.astro`; 3D version: `src/scripts/sections/cross3d.ts` (extruded from the same path).
- Never redraw, stretch, recolour outside the palette, add effects that change the silhouette, or place third-party logos on garments or UI.

## 3. Official palette — three colours only

| Token | Hex | Role |
|---|---|---|
| `--color-obsidian` | `#090303` | Dominant base (≈65–75 %): canvas, header, footer, panels, overlays |
| `--color-ice` | `#B8DEF5` | Contrast & light (≈15–25 %): reading text on dark, light sections, product plinth, primary buttons |
| `--color-crimson` | `#E20A21` | Identity accent (≈5–10 %): progress, active states, badges, cross, checkout CTA, one experimental section |

Allowed derived values: **transparencies of the three colours only**, declared once in `tokens.css` (`--ice-90 … --ice-04`, `--obsidian-90 … --obsidian-08`, `--crimson-72 … --crimson-12`) or written as `rgb(var(--rgb-ice) / .4)`.

Preferred pairings: Obsidian/Ice (reading), Obsidian/Crimson (accent, large type only), Ice/Obsidian, Ice/Crimson, Crimson/Ice, Crimson/Obsidian.

**Rules**
- No `white`, `black`, greys or any extra hex anywhere in UI CSS/SVG/JS. `npm run audit:colors` fails the build check if one appears.
- Crimson is never used for small body text on Obsidian (contrast); use Ice.
- No `mix-blend-mode` that synthesises new hues (e.g. `difference`).
- Gradients only between the three colours / their alphas, and rarely.
- **Photography keeps its natural colour** (skin, real garment dye, metallic reflections of the 3D cross). The rule governs interface and graphics, not photos.

## 4. Typography

| Role | Family | Use |
|---|---|---|
| Brand / display | **Coolvetica** (supplied; replaces the brief's `Hypsos2-Regular.otf`, which was not provided) — `--font-brand`, `--font-display` | Hero, section titles, statements, prices in large sizes |
| UI | **Inter Variable** (self-hosted via @fontsource) — `--font-ui` | Navigation text, body, forms, buttons, checkout |
| Mono | **IBM Plex Mono** 400/500 — `--font-mono` | Labels `HYPSOS / COLLECTION 001`, numbering, metadata (`.t-label`) |

To switch to Hypsos2: add the woff2 to `public/fonts/` and change `src/styles/fonts.css`. **Licence**: verify the Typodermic webfont licence for Coolvetica before launch (the font's `fsType` is "preview & print").

### Scale (fluid, `clamp()`)

| Class | Token | Size |
|---|---|---|
| `.t-mega` | `--fs-mega` | 4.5rem → 19rem, lh .8 |
| `.t-hero` | `--fs-hero` | 3.5rem → 12rem, lh .88, tracking −.045em |
| `.t-section` | `--fs-section` | 2.5rem → 7rem, lh .95 |
| `.t-h2` / `.t-h3` / `.t-h4` | `--fs-h2…h4` | 2–4.5rem / 1.5–2.5rem / 1.125–1.5rem |
| `.t-lead` / `.t-body` | `--fs-lead` / `--fs-body` | 1.06–1.375rem / .875–1.06rem, lh 1.6 |
| `.t-label` | `--fs-label` | 11px mono, +.14em, uppercase |

Display sizes use negative tracking; uppercase labels use positive tracking. Text uses `text-wrap: balance/pretty`.

## 5. Spacing · 6. Radius · 7. Grid

- **Spacing**: 4px base (`--space-1` … `--space-40`), `--gutter: clamp(16px, 3.6vw, 56px)`, `--section-y: clamp(80px, 12vw, 180px)`.
- **Radius**: `0` for editorial media and panels (sharp, fashion), `--radius-pill` for all interactive controls (21 TSI ghost pills), `--radius-sheet: 20px` for mobile bottom sheets, `2px` for badges.
- **Grid**: full-bleed by default (`.wrap-full`), `.wrap` max 1440px for reading pages; editorial sections use a 12-column CSS grid (`Collection.astro`); catalogue `.pgrid` 4 → 3 → 2 columns.

## 8. Breakpoints

| Name | Range | Notes |
|---|---|---|
| Phone | ≤ 749px | Own composition: docked panels, bottom sheets, classic runway line, swipe galleries, no hover effects |
| Tablet | 750–1099px | Burger navigation, runway ring with narrower panel, 3-column grid |
| Desktop | ≥ 1100px | Mega menu, pinned scenes (≥ 900px), contextual cursor, hover reveals |
| Small phone | ≤ 374px | Tighter gutters in the runway |

## 9. Components

| Component | File | Notes |
|---|---|---|
| Header + mega menu + mobile menu | `components/layout/Header.astro`, `scripts/core/header.ts` | Hides on scroll down, shows on scroll up; mega menu opens on hover intent, click and keyboard |
| Cart drawer, search, consent, cursor, toasts | `components/layout/Overlays.astro` | Focus-trapped overlays (`scripts/core/dom.ts → overlay()`) |
| Product card | `components/product/ProductCard.astro` | Front/back hover, badges, sizes, favourites, quick add chips |
| Shop view | `components/product/ShopView.astro`, `scripts/pages/shop.ts` | Filters (size, colour, type, price, availability), sort, URL-synced |
| Runway | `components/sections/Runway.astro`, `scripts/sections/runway.ts` | See motion guidelines |
| Buttons | `.btn`, `.btn--ghost`, `.btn--accent`, `.btn--dark`, `--lg/--sm/--block` | Pills with light sweep on hover |
| Chips / pills | `.chip` | Sizes, filters; `.is-unavailable` diagonal strike |
| Forms | `.input`, `.select`, `.textarea`, `.check`, `.switch` | Labels always visible or `sr-only`; `aria-invalid` styling |
| Accordion | `.acc details` | Native `<details>` |
| Prose | `.prose`, `.ph` | Legal/help; `.ph` highlights pending `[FIELDS]` |

## 10. States

Hover (desktop only), `:focus-visible` (2px Crimson outline, offset 3px; Ice on Crimson surfaces), active (scale .94–.98), disabled (opacity .45), loading (`.is-loading` spinner), empty (`.empty-state`), error/notice (`.notice`, left Crimson rule), success (toast), sold out (badge + strike), low stock (`Últimas unidades`).

## 11. Accessibility

Semantic landmarks, skip link, visible focus, focus traps + Esc in every overlay, `aria-expanded/controls/pressed/current`, live regions (cart, search, runway look announcements), labelled forms, keyboard carousel (runway arrows, gallery arrows), `prefers-reduced-motion` honoured everywhere (static fallbacks), 44px touch targets, Ice-on-Obsidian reading contrast (≈13:1).

## 12. Usage rules — Do / Don't

**Do** — let photography/product breathe · one Crimson focal point per view · mono label above every section title · Ice plinth for garments · pills for controls · use tokens only.

**Don't** — add colours or greys · put body text over imagery · make every button red · use more than three families · redraw the logo or cross · ship a section without a reduced-motion state · fake features (payments, accounts, discounts).
