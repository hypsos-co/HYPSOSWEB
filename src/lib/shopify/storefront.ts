/**
 * Shopify Storefront API client (headless). Works at build time (SSG) and in the browser.
 * Uses the *public* Storefront access token, which Shopify designs to be exposed client-side
 * (read catalogue, manage carts). Admin tokens must never be used here.
 */

export interface ShopifyConfig {
  domain: string;
  token: string;
  version: string;
}

export function shopifyConfig(): ShopifyConfig | null {
  const env = import.meta.env;
  const domain = (env.PUBLIC_SHOPIFY_STORE_DOMAIN || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const token = (env.PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '').trim();
  const version = (env.PUBLIC_SHOPIFY_API_VERSION || '2026-07').trim();
  if (!domain || !token) return null;
  return { domain, token, version };
}

export class StorefrontError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'StorefrontError';
  }
}

export async function storefront<T = any>(
  cfg: ShopifyConfig,
  query: string,
  variables: Record<string, unknown> = {},
  { retries = 2, signal }: { retries?: number; signal?: AbortSignal } = {},
): Promise<T> {
  const url = `https://${cfg.domain}/api/${cfg.version}/graphql.json`;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Shopify-Storefront-Access-Token': cfg.token,
        },
        body: JSON.stringify({ query, variables }),
        signal,
      });
      if (res.status === 429 || res.status >= 500) throw new StorefrontError(`Storefront HTTP ${res.status}`);
      const json = await res.json();
      if (!res.ok) throw new StorefrontError(`Storefront HTTP ${res.status}`, json);
      if (json.errors?.length) throw new StorefrontError(json.errors.map((e: any) => e.message).join('; '), json.errors);
      return json.data as T;
    } catch (err) {
      lastErr = err;
      if ((err as any)?.name === 'AbortError') throw err;
      const retryable = !(err instanceof StorefrontError) || /HTTP (429|5\d\d)/.test((err as Error).message);
      if (!retryable || attempt === retries) break;
      await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
    }
  }
  throw lastErr;
}

/** Shopify CDN image resizing via the `width` query param. */
export function shopifyImageUrl(url: string, width: number) {
  return `${url}${url.includes('?') ? '&' : '?'}width=${width}`;
}
