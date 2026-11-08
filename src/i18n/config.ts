export const LOCALES = ['es', 'en', 'pt'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'es';

export const LOCALE_META: Record<Locale, { htmlLang: string; hreflang: string; intl: string; label: string; short: string; shopifyLanguage: string; ogLocale: string }> = {
  es: { htmlLang: 'es-ES', hreflang: 'es-ES', intl: 'es-ES', label: 'Español', short: 'ES', shopifyLanguage: 'ES', ogLocale: 'es_ES' },
  en: { htmlLang: 'en', hreflang: 'en', intl: 'en-IE', label: 'English', short: 'EN', shopifyLanguage: 'EN', ogLocale: 'en_GB' },
  pt: { htmlLang: 'pt-PT', hreflang: 'pt-PT', intl: 'pt-PT', label: 'Português', short: 'PT', shopifyLanguage: 'PT_PT', ogLocale: 'pt_PT' },
};

export const CURRENCY = 'EUR';
export const COUNTRY = 'ES';

export function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as readonly string[]).includes(v);
}

/** getStaticPaths helper for `src/pages/[...lang]/…` routes (es has no prefix). */
export function localeParams() {
  return LOCALES.map((l) => ({ params: { lang: l === DEFAULT_LOCALE ? undefined : l } }));
}

export function langFromParam(param: string | undefined): Locale {
  return isLocale(param) ? param : DEFAULT_LOCALE;
}

/** Build a localized, clean URL path. `path` is locale-neutral and starts with "/". */
export function lp(lang: Locale, path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang === DEFAULT_LOCALE) return clean;
  return clean === '/' ? `/${lang}/` : `/${lang}${clean}`;
}

/** Remove the locale prefix from a pathname → { lang, path } */
export function splitLocale(pathname: string): { lang: Locale; path: string } {
  const m = pathname.match(/^\/(en|pt)(\/.*)?$/);
  if (m) return { lang: m[1] as Locale, path: m[2] || '/' };
  return { lang: DEFAULT_LOCALE, path: pathname || '/' };
}

export function formatMoney(amount: number, lang: Locale, currency = CURRENCY) {
  return new Intl.NumberFormat(LOCALE_META[lang].intl, { style: 'currency', currency }).format(amount);
}
