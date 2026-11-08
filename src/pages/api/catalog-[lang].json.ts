import type { APIRoute } from 'astro';
import { LOCALES, type Locale } from '../../i18n/config';
import { getCatalog, clientProduct } from '../../lib/catalog';

export function getStaticPaths() {
  return LOCALES.map((lang) => ({ params: { lang } }));
}

export const GET: APIRoute = async ({ params }) => {
  const catalog = await getCatalog(params.lang as Locale);
  return new Response(JSON.stringify({ source: catalog.source, products: catalog.products.map(clientProduct) }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
