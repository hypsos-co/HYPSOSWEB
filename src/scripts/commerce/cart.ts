/**
 * Cart store with two adapters:
 *  - ShopifyAdapter: real Storefront API cart (cartCreate / cartLinesAdd / Update / Remove) → official checkoutUrl.
 *  - LocalAdapter: demo cart in localStorage (no checkout, no payment — clearly labelled).
 */
import { RT, S } from '../core/runtime';
import { store } from '../core/storage';
import { storefront, shopifyImageUrl } from '../../lib/shopify/storefront';
import { CART_CREATE, CART_LINES_ADD, CART_LINES_REMOVE, CART_LINES_UPDATE, CART_QUERY } from '../../lib/shopify/queries';

export interface Snapshot {
  handle: string;
  title: string;
  variantTitle: string;
  options: { name: string; value: string }[];
  price: number;
  currency: string;
  image: { src: string; w: number; h: number } | null;
  available: boolean;
  max: number | null;
}
export interface CartLine extends Snapshot { id: string; merchandiseId: string; quantity: number }
export interface CartState { lines: CartLine[]; totalQuantity: number; subtotal: number; currency: string; checkoutUrl: string | null; demo: boolean }
export interface AddItem { merchandiseId: string; quantity: number; snapshot: Snapshot }

const MAX_PER_LINE = 10;
const EMPTY: CartState = { lines: [], totalQuantity: 0, subtotal: 0, currency: 'EUR', checkoutUrl: null, demo: true };

interface Adapter {
  load(): Promise<CartState>;
  add(items: AddItem[]): Promise<CartState>;
  update(lineId: string, quantity: number): Promise<CartState>;
  remove(lineId: string): Promise<CartState>;
}

/* ── Local (demo) ───────────────────────────────────────────────────── */
class LocalAdapter implements Adapter {
  key = 'hypsos-cart-v1';
  read(): CartLine[] {
    const raw = store.get<CartLine[]>(this.key, []);
    return Array.isArray(raw) ? raw.filter((l) => l && typeof l.merchandiseId === 'string' && Number.isInteger(l.quantity) && l.quantity > 0).slice(0, 50) : [];
  }
  state(lines: CartLine[]): CartState {
    return {
      lines,
      totalQuantity: lines.reduce((a, l) => a + l.quantity, 0),
      subtotal: Math.round(lines.reduce((a, l) => a + l.price * l.quantity, 0) * 100) / 100,
      currency: lines[0]?.currency ?? 'EUR',
      checkoutUrl: null,
      demo: true,
    };
  }
  async load() { return this.state(this.read()); }
  async add(items: AddItem[]) {
    const lines = this.read();
    for (const it of items) {
      if (!it.snapshot.available) throw new Error(S.cart?.unavailable ?? 'Unavailable');
      const cap = Math.min(MAX_PER_LINE, it.snapshot.max ?? MAX_PER_LINE);
      const ex = lines.find((l) => l.merchandiseId === it.merchandiseId);
      if (ex) {
        if (ex.quantity >= cap) throw new Error(S.cart?.maxQty ?? 'Max');
        ex.quantity = Math.min(cap, ex.quantity + it.quantity);
      } else lines.push({ ...it.snapshot, id: it.merchandiseId, merchandiseId: it.merchandiseId, quantity: Math.min(cap, it.quantity) });
    }
    store.set(this.key, lines);
    return this.state(lines);
  }
  async update(lineId: string, quantity: number) {
    let lines = this.read();
    const l = lines.find((x) => x.id === lineId);
    if (l) {
      const cap = Math.min(MAX_PER_LINE, l.max ?? MAX_PER_LINE);
      if (quantity > cap) throw new Error(S.cart?.maxQty ?? 'Max');
      l.quantity = quantity;
      if (quantity <= 0) lines = lines.filter((x) => x !== l);
    }
    store.set(this.key, lines);
    return this.state(lines);
  }
  async remove(lineId: string) { return this.update(lineId, 0); }
}

/* ── Shopify ────────────────────────────────────────────────────────── */
class ShopifyAdapter implements Adapter {
  key = 'hypsos-shopify-cart-id';
  cfg = RT.shopify!;
  ctx = { language: RT.shopifyLanguage, country: 'ES' };
  map(cart: any): CartState {
    if (!cart) return { ...EMPTY, demo: false };
    const lines: CartLine[] = cart.lines.nodes.map((n: any) => {
      const m = n.merchandise;
      return {
        id: n.id,
        merchandiseId: m.id,
        quantity: n.quantity,
        handle: m.product.handle,
        title: m.product.title,
        variantTitle: m.title,
        options: m.selectedOptions,
        price: Number(m.price.amount),
        currency: m.price.currencyCode,
        image: m.image ? { src: shopifyImageUrl(m.image.url, 300), w: m.image.width, h: m.image.height } : null,
        available: m.availableForSale,
        max: null,
      };
    });
    return {
      lines,
      totalQuantity: cart.totalQuantity,
      subtotal: Number(cart.cost.subtotalAmount.amount),
      currency: cart.cost.subtotalAmount.currencyCode,
      checkoutUrl: cart.checkoutUrl,
      demo: false,
    };
  }
  check(payload: any) {
    const errs = payload?.userErrors;
    if (errs?.length) throw new Error(errs.map((e: any) => e.message).join(' '));
    return payload.cart;
  }
  async load() {
    const id = store.get<string | null>(this.key, null);
    if (!id) return this.map(null);
    const data = await storefront(this.cfg, CART_QUERY, { id, ...this.ctx });
    if (!data.cart) store.remove(this.key); // expired / completed
    return this.map(data.cart);
  }
  async add(items: AddItem[]) {
    const lines = items.map((i) => ({ merchandiseId: i.merchandiseId, quantity: i.quantity }));
    const id = store.get<string | null>(this.key, null);
    if (id) {
      try {
        const d = await storefront(this.cfg, CART_LINES_ADD, { cartId: id, lines, ...this.ctx });
        return this.map(this.check(d.cartLinesAdd));
      } catch (e) {
        if (!/not exist|invalid|not found/i.test(String((e as Error).message))) throw e;
        store.remove(this.key);
      }
    }
    const d = await storefront(this.cfg, CART_CREATE, { input: { lines, buyerIdentity: { countryCode: 'ES' } }, ...this.ctx });
    const cart = this.check(d.cartCreate);
    store.set(this.key, cart.id);
    return this.map(cart);
  }
  async update(lineId: string, quantity: number) {
    const id = store.get<string>(this.key, '');
    const d = await storefront(this.cfg, CART_LINES_UPDATE, { cartId: id, lines: [{ id: lineId, quantity }], ...this.ctx });
    return this.map(this.check(d.cartLinesUpdate));
  }
  async remove(lineId: string) {
    const id = store.get<string>(this.key, '');
    const d = await storefront(this.cfg, CART_LINES_REMOVE, { cartId: id, lineIds: [lineId], ...this.ctx });
    return this.map(this.check(d.cartLinesRemove));
  }
}

/* ── Store ──────────────────────────────────────────────────────────── */
class CartStore extends EventTarget {
  adapter: Adapter;
  state: CartState = EMPTY;
  ready: Promise<CartState>;
  busy = false;
  constructor() {
    super();
    this.adapter = RT.source === 'shopify' && RT.shopify ? new ShopifyAdapter() : new LocalAdapter();
    this.ready = this.refresh();
    window.addEventListener('storage', (e) => { if (e.key && e.key.startsWith('hypsos-') && e.key.includes('cart')) this.refresh(); });
  }
  get isDemo() { return this.adapter instanceof LocalAdapter; }
  private set(s: CartState) {
    this.state = s;
    this.dispatchEvent(new CustomEvent('change', { detail: s }));
    return s;
  }
  async refresh() {
    try { return this.set(await this.adapter.load()); }
    catch { return this.set({ ...EMPTY, demo: this.isDemo }); }
  }
  async add(items: AddItem[], opts: { source?: string; look?: boolean } = {}) {
    const s = this.set(await this.adapter.add(items));
    this.dispatchEvent(new CustomEvent('added', { detail: { items, ...opts } }));
    return s;
  }
  async update(lineId: string, qty: number) { return this.set(await this.adapter.update(lineId, qty)); }
  async remove(lineId: string) { return this.set(await this.adapter.remove(lineId)); }
  checkout() {
    if (this.state.checkoutUrl) window.location.href = this.state.checkoutUrl;
    return !!this.state.checkoutUrl;
  }
}

let instance: CartStore | null = null;
export function cart() {
  return (instance ??= new CartStore());
}
