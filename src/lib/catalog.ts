/**
 * Catalogue loader (build time).
 *  - Shopify credentials present → products & collections from the Storefront API (per language).
 *  - Otherwise → the clearly-labelled demo catalogue.
 */
import type { Catalog, Collection, Product } from './types';
import { LOCALE_META, COUNTRY, type Locale } from '../i18n/config';
import { demoCatalog } from '../data/catalog.demo';
import { shopifyConfig, storefront } from './shopify/storefront';
import { COLLECTIONS_QUERY, PRODUCTS_QUERY } from './shopify/queries';
import { mapCollection, mapProduct } from './shopify/mappers';

const cache = new Map<Locale, Promise<Catalog>>();

async function fetchShopify(lang: Locale): Promise<Catalog> {
  const cfg = shopifyConfig()!;
  const vars = { language: LOCALE_META[lang].shopifyLanguage, country: COUNTRY };
  const products: Product[] = [];
  let withInventory = true;
  let cursor: string | null = null;
  do {
    let data: any;
    try {
      data = await storefront(cfg, PRODUCTS_QUERY(withInventory), { ...vars, cursor });
    } catch (err) {
      // quantityAvailable needs the `unauthenticated_read_product_inventory` scope — retry without it
      if (withInventory && /access|quantityAvailable|denied/i.test(String((err as Error).message))) {
        withInventory = false;
        continue;
      }
      throw err;
    }
    products.push(...data.products.nodes.map(mapProduct));
    cursor = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
  } while (cursor);
  const cdata: any = await storefront(cfg, COLLECTIONS_QUERY, vars);
  const collections: Collection[] = cdata.collections.nodes.map(mapCollection);
  return { source: 'shopify', products, collections };
}

export function getCatalog(lang: Locale): Promise<Catalog> {
  if (!cache.has(lang)) {
    const p = shopifyConfig()
      ? fetchShopify(lang).catch((err) => {
          // Fail loudly in production builds: never publish demo data while claiming to be connected.
          if (import.meta.env.PROD && process.env.ALLOW_DEMO_FALLBACK !== '1') throw err;
          console.warn(`[catalog] Shopify fetch failed (${(err as Error).message}). Using DEMO catalogue.`);
          return demoCatalog(lang);
        })
      : Promise.resolve(demoCatalog(lang));
    cache.set(lang, p);
  }
  return cache.get(lang)!;
}

export async function getProduct(lang: Locale, handle: string) {
  return (await getCatalog(lang)).products.find((p) => p.handle === handle) ?? null;
}

export function productsIn(catalog: Catalog, handle: string): Product[] {
  const c = catalog.collections.find((x) => x.handle === handle);
  if (!c) return [];
  return c.productHandles.map((h) => catalog.products.find((p) => p.handle === h)).filter(Boolean) as Product[];
}

export function colorOptionName(p: Product) {
  return p.options.find((o) => o.key === 'color')?.name ?? null;
}
export function sizeOptionName(p: Product) {
  return p.options.find((o) => o.key === 'size')?.name ?? null;
}

/** First image for a given colour (front preferred). */
export function imageForColor(p: Product, color: string | null, view: 'front' | 'back' = 'front') {
  const list = color ? p.images.filter((i) => i.color === color) : p.images;
  return list.find((i) => i.view === view) ?? list[0] ?? p.images[0] ?? null;
}

/** Lightweight JSON for client scripts (search, quick add, favourites, runway). */
export function clientProduct(p: Product) {
  return {
    h: p.handle,
    t: p.title,
    ty: p.productType,
    c: p.category,
    n: p.isNew,
    d: p.demo,
    a: p.available,
    p: p.priceRange.min.amount,
    cur: p.priceRange.min.currencyCode,
    o: p.options.map((o) => ({ n: o.name, k: o.key, v: o.values })),
    v: p.variants.map((v) => ({ id: v.id, o: v.options.map((x) => x.value), a: v.available, q: v.quantityAvailable, p: v.price.amount, i: v.imageIndex })),
    i: p.images.map((im) => ({ s: im.src, ss: im.srcset, w: im.width, h: im.height, c: im.color, vw: im.view })),
    tags: p.tags,
  };
}
export type ClientProduct = ReturnType<typeof clientProduct>;
