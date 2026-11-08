# HYPSOS — Web

**BUILT FOR THE TOP. THE ELEVATION.**
Premium contemporary streetwear storefront. Astro (static) + vanilla TypeScript + GSAP + Three.js, headless on the **Shopify Storefront API**.

- Design system → [`HYPSOS_DESIGN_SYSTEM.md`](HYPSOS_DESIGN_SYSTEM.md)
- Motion → [`HYPSOS_MOTION_GUIDELINES.md`](HYPSOS_MOTION_GUIDELINES.md)
- Assets → [`HYPSOS_ASSET_GUIDELINES.md`](HYPSOS_ASSET_GUIDELINES.md)
- Visual references (studied, not copied) → `docs/references/`

## Run

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build && npm run preview
```

Other scripts: `npm run audit:colors` (fails if any colour other than #090303 / #B8DEF5 / #E20A21 appears in `src/`), `npm run assets -- --mockups <path>` (regenerates logos, fonts, garment cut-outs, looks, favicons; needs poppler, Python 3, Pillow, numpy, fontTools + brotli).

Requires Node ≥ 18.20. Output is a fully static site in `dist/` (any static host / CDN).

## Environment variables

Copy `.env.example` to `.env`.

| Variable | Purpose |
|---|---|
| `SITE_URL` | Canonical URL (sitemap, canonical, OG). Default `https://hypsos.co` |
| `PUBLIC_SHOPIFY_STORE_DOMAIN` | `your-store.myshopify.com` |
| `PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` | **Public** Storefront API token (safe in the browser by design). Never an Admin token. |
| `PUBLIC_SHOPIFY_API_VERSION` | e.g. `2026-07` |
| `PUBLIC_NEWSLETTER_ENDPOINT` / `PUBLIC_CONTACT_ENDPOINT` | Optional POST JSON endpoints. Without them the forms open the visitor's email app addressed to hypsos.co@gmail.com |
| `PUBLIC_CAMPAIGN_HERO_IMAGE`, `PUBLIC_CAMPAIGN_FILM_SRC`, `PUBLIC_CAMPAIGN_FILM_POSTER` | Campaign media slots |
| `PUBLIC_ANALYTICS_SRC` | Optional analytics script, loaded **only** after analytics consent |
| `ALLOW_DEMO_FALLBACK=1` | Build-time: allow demo data if the Shopify fetch fails (otherwise production builds fail loudly) |

## Architecture

```
src/
  i18n/            es (default, no prefix) · en (/en) · pt (/pt) dictionaries + helpers
  data/            demo catalogue, runway looks, help/brand copy, site & business placeholders
  lib/             types, catalogue loader, Shopify Storefront client / queries / mappers
  layouts/         BaseLayout (SEO, hreflang, OG, JSON-LD), LegalLayout
  components/      brand · layout (header, footer, overlays) · home · product · sections (runway) · ui
  pages/[...lang]/ localized routes (/, /shop, /collections, /products/[handle], /search, /cart, …)
  pages/legal/     Spanish legal drafts      pages/api/  catalogue JSON per locale
  scripts/         core (runtime, header, consent, forms) · commerce (cart, search, favourites, quick add)
                   motion (reveal, cursor, magnetic) · sections (runway, 3D cross) · pages (home, shop, pdp)
  styles/          tokens · fonts · base · components · runway
tools/             build_assets.py · audit-colors.mjs
brand/source/      original .ai logos and font files
```

## Shopify integration — status

| Area | Implementation | Status |
|---|---|---|
| Products, variants, sizes, colours, prices, images, collections | Fetched at **build time** from the Storefront API per language (`@inContext`) → static pages | Implemented, **not tested against a live store** (no credentials were provided) |
| Inventory | `availableForSale` per variant (+ `quantityAvailable` when the token has the inventory scope); live re-check on the product page | Implemented, untested live |
| Cart | Storefront Cart API (`cartCreate`, `cartLinesAdd/Update/Remove`), cart id in localStorage | Implemented, untested live |
| Checkout | Redirect to Shopify `checkoutUrl` (official checkout; no payment data touches this site) | Implemented, untested live |
| Orders / customer account | Link to the store's Shopify customer account | Link only |
| Metafields | `custom.composition`, `custom.care`, `custom.details`, `custom.story_{silhouette,fabric,construction,graphics,fit,details}` (expose them to the Storefront API) | Optional |
| Without credentials | Clearly labelled **DEMO** catalogue, local cart, checkout disabled with explanation | Working |

**Connect a store**: Shopify admin → *Settings → Apps → Develop apps* (or the Headless channel) → create a Storefront API token with product listing, product inventory, collection listing and checkout/cart read+write scopes (verify names in your admin) → set the env vars → rebuild. Rebuild (or use a webhook-triggered deploy) whenever products change; carts, stock checks and checkout are live.

## Pages

Home · Shop · Collections (index + each) · Product · Search · Bag · Favourites · Account · About · Campaigns · Lookbook · Help (FAQ, contact, size guide, shipping, returns, order tracking) · Legal (aviso legal, privacidad, cookies, condiciones de compra, desistimiento, devoluciones, garantías — Spanish drafts) · 404 · `sitemap.xml` · `robots.txt`.

## Pending before launch

- Shopify credentials and real catalogue (names, prices, stock, composition, care, measurements).
- Business/legal data in `src/data/site.ts` (`BUSINESS`) and every `[BRACKETED]` field in help & legal pages; professional legal review.
- Model cut-outs for the runway, campaign photography and film (see asset guidelines).
- Coolvetica webfont licence confirmation (or the `Hypsos2` font file).
- Newsletter/contact endpoints (optional).
