import type { Collection, Product, ProductImage, ProductOption, StoryModule, Variant } from '../types';
import { shopifyImageUrl } from './storefront';

const COLOR_NAMES = /^(colou?r|cor)$/i;
const SIZE_NAMES = /^(size|talla|tamanho|taille)$/i;

export function categoryOf(productType: string, tags: string[]): Product['category'] {
  const tagged = tags.find((t) => t.startsWith('category:'))?.split(':')[1];
  if (tagged && ['tops', 'sweats', 'bottoms', 'accessories'].includes(tagged)) return tagged as Product['category'];
  const t = `${productType} ${tags.join(' ')}`.toLowerCase();
  if (/(tee|t-shirt|camiseta|shirt)/.test(t)) return 'tops';
  if (/(hoodie|sudadera|sweat|crewneck|moletom)/.test(t)) return 'sweats';
  if (/(pant|short|pantal|cal[cç])/.test(t)) return 'bottoms';
  if (/(beanie|cap|gorr|hat|bag|access|acess)/.test(t)) return 'accessories';
  return 'other';
}

function image(n: any, fallbackAlt: string): ProductImage {
  return {
    src: shopifyImageUrl(n.url, 1000),
    srcset: [480, 1000, 1600].map((w) => `${shopifyImageUrl(n.url, w)} ${w}w`).join(', '),
    width: n.width || 1000,
    height: n.height || 1250,
    alt: n.altText || fallbackAlt,
    color: null,
    view: null,
  };
}

function money(m: any) {
  return { amount: Number(m.amount), currencyCode: m.currencyCode };
}

function parseList(value: string | undefined | null): string[] {
  if (!value) return [];
  try {
    const v = JSON.parse(value);
    if (Array.isArray(v)) return v.map(String);
  } catch {}
  return value.split('\n').map((s) => s.trim()).filter(Boolean);
}

export function mapProduct(n: any): Product {
  const images: ProductImage[] = n.images.nodes.map((i: any) => image(i, n.title));
  const rawUrls: string[] = n.images.nodes.map((i: any) => i.url.split('?')[0]);
  const options: ProductOption[] = n.options.map((o: any) => ({
    name: o.name,
    key: COLOR_NAMES.test(o.name) ? 'color' : SIZE_NAMES.test(o.name) ? 'size' : 'other',
    values: (o.optionValues || []).map((v: any) => v.name),
  }));
  const colorOpt = options.find((o) => o.key === 'color');
  const variants: Variant[] = n.variants.nodes.map((v: any) => {
    const idx = v.image ? rawUrls.indexOf(v.image.url.split('?')[0]) : -1;
    if (idx >= 0 && colorOpt) {
      const c = v.selectedOptions.find((s: any) => s.name === colorOpt.name)?.value;
      if (c && !images[idx].color) images[idx].color = c;
    }
    return {
      id: v.id,
      title: v.title,
      options: v.selectedOptions,
      price: money(v.price),
      compareAtPrice: v.compareAtPrice ? money(v.compareAtPrice) : null,
      available: !!v.availableForSale,
      quantityAvailable: typeof v.quantityAvailable === 'number' ? v.quantityAvailable : null,
      imageIndex: idx >= 0 ? idx : null,
    };
  });
  // propagate colour to following untagged images (typical: front, back, detail per colour)
  let current: string | null = null;
  for (const im of images) {
    if (im.color) current = im.color;
    else im.color = current;
    const alt = (im.alt || '').toLowerCase();
    im.view = /back|detr[aá]s|costas|espalda/.test(alt) ? 'back' : /detail|detalle|detalhe/.test(alt) ? 'detail' : /look|lifestyle|campaign/.test(alt) ? 'lifestyle' : 'front';
  }
  const story: StoryModule[] = [];
  for (const key of ['silhouette', 'fabric', 'construction', 'graphics', 'fit', 'details'] as const) {
    const v = n[`story_${key}`]?.value;
    if (v) story.push({ key, text: v, images: [] });
  }
  const tags: string[] = n.tags || [];
  return {
    id: n.id,
    handle: n.handle,
    title: n.title,
    vendor: n.vendor,
    productType: n.productType,
    category: categoryOf(n.productType, tags),
    tags,
    isNew: tags.some((t) => /^(new|nuevo|novidade)$/i.test(t)),
    description: n.description,
    descriptionHtml: n.descriptionHtml,
    options,
    variants,
    images,
    priceRange: { min: money(n.priceRange.minVariantPrice), max: money(n.priceRange.maxVariantPrice) },
    available: !!n.availableForSale,
    composition: n.composition?.value ?? null,
    care: n.care?.value ?? null,
    details: parseList(n.details?.value),
    story,
    collections: n.collections.nodes.map((c: any) => c.handle),
    createdAt: n.createdAt,
    seo: n.seo ?? { title: null, description: null },
    demo: false,
  };
}

export function mapCollection(n: any): Collection {
  return {
    handle: n.handle,
    title: n.title,
    description: n.description,
    image: n.image ? image(n.image, n.title) : null,
    productHandles: n.products.nodes.map((p: any) => p.handle),
  };
}
