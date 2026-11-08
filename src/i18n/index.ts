import es, { type Dict } from './es';
import en from './en';
import pt from './pt';
import type { Locale } from './config';

export * from './config';
export type { Dict };

const DICTS: Record<Locale, Dict> = { es, en, pt };

export function getDict(lang: Locale): Dict {
  return DICTS[lang];
}

/** Simple `{var}` interpolation. */
export function fmt(str: string, vars: Record<string, string | number> = {}): string {
  return str.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Strings that client-side scripts need (embedded once per page as JSON). */
export function clientStrings(lang: Locale) {
  const d = DICTS[lang];
  return {
    common: d.common,
    cart: d.cart,
    search: d.search,
    shop: d.shop,
    runway: d.runway,
    newsletter: d.newsletter,
    cookies: d.cookies,
    demo: d.demo,
    product: { selectSizeFirst: d.product.selectSizeFirst, onlyN: d.product.onlyN },
  };
}
export type ClientStrings = ReturnType<typeof clientStrings>;
