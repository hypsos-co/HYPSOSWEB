/** Page runtime config + client strings (embedded as JSON by BaseLayout). */
import type { ClientStrings } from '../../i18n';

export interface Runtime {
  lang: 'es' | 'en' | 'pt';
  intl: string;
  shopifyLanguage: string;
  source: 'demo' | 'shopify';
  shopify: { domain: string; token: string; version: string } | null;
  base: string;
  paths: { product: string; search: string; cart: string; catalog: string };
  forms: { newsletter: string; contact: string };
  email: string;
  analytics: string;
}

function readJSON<T>(id: string, fallback: T): T {
  try {
    const el = document.getElementById(id);
    return el ? (JSON.parse(el.textContent || '') as T) : fallback;
  } catch {
    return fallback;
  }
}

export const RT = readJSON<Runtime>('hypsos-runtime', {} as Runtime);
export const S = readJSON<ClientStrings>('hypsos-i18n', {} as ClientStrings);

export function fmt(str: string, vars: Record<string, string | number> = {}) {
  return String(str ?? '').replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

const nf = new Map<string, Intl.NumberFormat>();
export function money(amount: number, currency = 'EUR') {
  const key = `${RT.intl}|${currency}`;
  if (!nf.has(key)) nf.set(key, new Intl.NumberFormat(RT.intl || 'es-ES', { style: 'currency', currency }));
  return nf.get(key)!.format(amount);
}

export function productUrl(handle: string) {
  return `${RT.paths?.product ?? '/products/'}${handle}`;
}
