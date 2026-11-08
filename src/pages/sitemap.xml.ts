import type { APIRoute } from 'astro';
import { LOCALES, LOCALE_META, lp } from '../i18n/config';
import { getCatalog } from '../lib/catalog';
import { LEGAL_PAGES, HELP_PAGES } from '../data/site';

/** Sitemap with hreflang alternates for every localized route. */
export const GET: APIRoute = async ({ site }) => {
  const base = site!;
  const cat = await getCatalog('es');
  const paths = [
    '/', '/shop', '/collections', '/about', '/campaigns', '/lookbook',
    ...HELP_PAGES.map((h) => h.path),
    ...cat.collections.map((c) => `/collections/${c.handle}`),
    ...cat.products.map((p) => `/products/${p.handle}`),
  ];
  const urls = paths.map((path) => {
    const alts = LOCALES.map((l) => `<xhtml:link rel="alternate" hreflang="${LOCALE_META[l].hreflang}" href="${new URL(lp(l, path), base).href}"/>`).join('');
    return LOCALES.map((l) => `<url><loc>${new URL(lp(l, path), base).href}</loc>${alts}<xhtml:link rel="alternate" hreflang="x-default" href="${new URL(path, base).href}"/></url>`).join('');
  });
  const legal = LEGAL_PAGES.map((l) => `<url><loc>${new URL(l.path, base).href}</loc></url>`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}${legal.join('')}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
