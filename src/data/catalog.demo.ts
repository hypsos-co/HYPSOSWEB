/**
 * DEMO CATALOGUE — clearly identified placeholder data.
 * Used only when Shopify credentials are not configured (see src/lib/catalog.ts).
 * Names, prices and stock are FICTITIOUS. Composition, weight (GSM), care and
 * construction are intentionally left empty: they must come from confirmed data.
 * Images: HYPSOS streetwear mockup library (blank garments), processed by tools/build_assets.py.
 */
import assets from './generated/assets.json';
import type { Catalog, Collection, Product, ProductImage, Variant } from '../lib/types';
import type { Locale } from '../i18n/config';

type ColorKey = 'black' | 'red';
type Family = 'oversized-tee' | 'baggy-shorts' | 'baggy-pants' | 'zip-hoodie' | 'pullover-hoodie' | 'crewneck' | 'beanie';

const COLOR_LABEL: Record<Locale, Record<ColorKey, string>> = {
  es: { black: 'Negro', red: 'Rojo' },
  en: { black: 'Black', red: 'Red' },
  pt: { black: 'Preto', red: 'Vermelho' },
};
const ONE_SIZE: Record<Locale, string> = { es: 'Talla única', en: 'One size', pt: 'Tamanho único' };
const OPT_NAMES: Record<Locale, { color: string; size: string }> = {
  es: { color: 'Color', size: 'Talla' },
  en: { color: 'Colour', size: 'Size' },
  pt: { color: 'Cor', size: 'Tamanho' },
};

interface Def {
  handle: string;
  family: Family;
  title: string;
  category: Product['category'];
  type: Record<Locale, string>;
  price: number;
  colors: ColorKey[];
  sizes: string[] | null; // null = one size
  isNew: boolean;
  createdAt: string;
  /** demo stock: variant key "color/size" → quantity (0 = sold out). default 12 */
  stock?: Record<string, number>;
  desc: Record<Locale, string>;
  fit?: Record<Locale, string>;
}

const APPAREL = ['S', 'M', 'L', 'XL'];

const DEFS: Def[] = [
  {
    handle: 'hoodie-001', family: 'pullover-hoodie', title: 'Hoodie 001', category: 'sweats',
    type: { es: 'Sudadera', en: 'Hoodie', pt: 'Sweat' }, price: 95, colors: ['red', 'black'], sizes: APPAREL,
    isNew: true, createdAt: '2026-10-20', stock: { 'red/M': 2, 'black/XL': 0 },
    desc: {
      es: 'Sudadera con capucha de silueta amplia y hombro caído, con bolsillo canguro y puños y bajo canalés.',
      en: 'Wide-silhouette hoodie with dropped shoulders, kangaroo pocket and ribbed cuffs and hem.',
      pt: 'Sweat com capuz de silhueta ampla e ombro descaído, com bolso canguru e punhos e bainha canelados.',
    },
    fit: { es: 'Corte oversized.', en: 'Oversized fit.', pt: 'Corte oversized.' },
  },
  {
    handle: 'zip-hoodie-001', family: 'zip-hoodie', title: 'Zip Hoodie 001', category: 'sweats',
    type: { es: 'Sudadera', en: 'Hoodie', pt: 'Sweat' }, price: 99, colors: ['black', 'red'], sizes: APPAREL,
    isNew: true, createdAt: '2026-10-18', stock: { 'red/S': 0 },
    desc: {
      es: 'Sudadera con capucha y cremallera completa, volumen amplio y puños canalés.',
      en: 'Full-zip hoodie with generous volume and ribbed cuffs.',
      pt: 'Sweat com capuz e fecho completo, volume amplo e punhos canelados.',
    },
    fit: { es: 'Corte oversized.', en: 'Oversized fit.', pt: 'Corte oversized.' },
  },
  {
    handle: 'oversized-tee-001', family: 'oversized-tee', title: 'Oversized Tee 001', category: 'tops',
    type: { es: 'Camiseta', en: 'T-shirt', pt: 'T-shirt' }, price: 45, colors: ['black', 'red'], sizes: APPAREL,
    isNew: false, createdAt: '2026-09-30', stock: { 'red/XL': 0, 'black/S': 3 },
    desc: {
      es: 'Camiseta de corte oversized con hombro caído y cuello redondo canalé.',
      en: 'Oversized tee with dropped shoulders and a ribbed crew neck.',
      pt: 'T-shirt de corte oversized com ombro descaído e gola redonda canelada.',
    },
    fit: { es: 'Corte oversized.', en: 'Oversized fit.', pt: 'Corte oversized.' },
  },
  {
    handle: 'crewneck-001', family: 'crewneck', title: 'Crewneck 001', category: 'sweats',
    type: { es: 'Sudadera', en: 'Sweatshirt', pt: 'Sweat' }, price: 79, colors: ['red', 'black'], sizes: APPAREL,
    isNew: false, createdAt: '2026-09-28',
    desc: {
      es: 'Sudadera de cuello redondo con hombro caído y bajo y puños canalés.',
      en: 'Crew-neck sweatshirt with dropped shoulders and ribbed hem and cuffs.',
      pt: 'Sweat de gola redonda com ombro descaído e bainha e punhos canelados.',
    },
  },
  {
    handle: 'baggy-pant-001', family: 'baggy-pants', title: 'Baggy Pant 001', category: 'bottoms',
    type: { es: 'Pantalón', en: 'Pants', pt: 'Calças' }, price: 89, colors: ['black', 'red'], sizes: APPAREL,
    isNew: true, createdAt: '2026-10-15', stock: { 'black/S': 0 },
    desc: {
      es: 'Pantalón de pierna amplia y recta, con bolsillos delanteros y traseros.',
      en: 'Wide straight-leg pants with front and back pockets.',
      pt: 'Calças de perna larga e reta, com bolsos à frente e atrás.',
    },
    fit: { es: 'Corte baggy.', en: 'Baggy fit.', pt: 'Corte baggy.' },
  },
  {
    handle: 'baggy-short-001', family: 'baggy-shorts', title: 'Baggy Short 001', category: 'bottoms',
    type: { es: 'Short', en: 'Shorts', pt: 'Calções' }, price: 65, colors: ['red', 'black'], sizes: APPAREL,
    isNew: false, createdAt: '2026-09-25',
    desc: {
      es: 'Short amplio por debajo de la rodilla, con cintura elástica y cordón.',
      en: 'Wide below-the-knee shorts with elastic waist and drawcord.',
      pt: 'Calções amplos abaixo do joelho, com cintura elástica e cordão.',
    },
    fit: { es: 'Corte baggy.', en: 'Baggy fit.', pt: 'Corte baggy.' },
  },
  {
    handle: 'beanie-001', family: 'beanie', title: 'Beanie 001', category: 'accessories',
    type: { es: 'Gorro', en: 'Beanie', pt: 'Gorro' }, price: 35, colors: ['black'], sizes: null,
    isNew: false, createdAt: '2026-09-20',
    desc: {
      es: 'Gorro de punto canalé con vuelta.',
      en: 'Rib-knit beanie with a turn-up cuff.',
      pt: 'Gorro de malha canelada com dobra.',
    },
  },
];

const A = assets as unknown as { products: Record<string, Record<string, { src: string; w: number; h: number }>> };

function img(family: Family, color: ColorKey, view: 'front' | 'back', alt: string, colorLabel: string): ProductImage | null {
  const set = A.products[`${family}/${color}-${view}`];
  if (!set) return null;
  return {
    src: set['1000'].src,
    srcset: `${set['480'].src} 480w, ${set['1000'].src} 1000w`,
    width: set['1000'].w,
    height: set['1000'].h,
    alt,
    color: colorLabel,
    view,
  };
}

function buildProduct(def: Def, lang: Locale): Product {
  const L = COLOR_LABEL[lang];
  const names = OPT_NAMES[lang];
  const sizes = def.sizes ?? [ONE_SIZE[lang]];
  const images: ProductImage[] = [];
  const colorImageIndex: Record<string, number> = {};
  for (const c of def.colors) {
    for (const view of ['front', 'back'] as const) {
      const viewLabel = view === 'front' ? { es: 'delante', en: 'front', pt: 'frente' }[lang] : { es: 'detrás', en: 'back', pt: 'costas' }[lang];
      const im = img(def.family, c, view, `${def.title} — ${L[c]}, ${viewLabel}`, L[c]);
      if (im) {
        if (view === 'front') colorImageIndex[c] = images.length;
        images.push(im);
      }
    }
  }
  const variants: Variant[] = [];
  for (const c of def.colors) {
    for (const s of sizes) {
      const key = `${c}/${def.sizes ? s : 'OS'}`;
      const qty = def.stock?.[key] ?? 12;
      variants.push({
        id: `demo:${def.handle}:${c}:${def.sizes ? s : 'os'}`,
        title: `${L[c]} / ${s}`,
        options: [
          { name: names.color, value: L[c] },
          { name: names.size, value: s },
        ],
        price: { amount: def.price, currencyCode: 'EUR' },
        compareAtPrice: null,
        available: qty > 0,
        quantityAvailable: qty,
        imageIndex: colorImageIndex[c] ?? 0,
      });
    }
  }
  const story: Product['story'] = [];
  const silhouette = images.filter((i) => i.color === L[def.colors[0]]);
  if (silhouette.length >= 2) {
    story.push({ key: 'silhouette', text: '', images: silhouette });
  }
  if (def.fit) story.push({ key: 'fit', text: def.fit[lang], images: [] });

  return {
    id: `demo:${def.handle}`,
    handle: def.handle,
    title: def.title,
    vendor: 'HYPSOS',
    productType: def.type[lang],
    category: def.category,
    tags: [def.family, ...(def.isNew ? ['new'] : []), 'drop-01'],
    isNew: def.isNew,
    description: def.desc[lang],
    options: [
      { name: names.color, key: 'color', values: def.colors.map((c) => L[c]) },
      { name: names.size, key: 'size', values: sizes },
    ],
    variants,
    images,
    priceRange: { min: { amount: def.price, currencyCode: 'EUR' }, max: { amount: def.price, currencyCode: 'EUR' } },
    available: variants.some((v) => v.available),
    composition: null,
    care: null,
    details: [],
    story,
    collections: [],
    createdAt: def.createdAt,
    seo: { title: null, description: null },
    demo: true,
  };
}

const COLLECTION_COPY: Record<string, { title: Record<Locale, string>; desc: Record<Locale, string>; filter: (p: Product) => boolean }> = {
  'drop-01': {
    title: { es: 'Drop 01 — The Elevation', en: 'Drop 01 — The Elevation', pt: 'Drop 01 — The Elevation' },
    desc: {
      es: 'La primera colección de HYPSOS. Negro profundo y rojo.',
      en: 'The first HYPSOS collection. Deep black and red.',
      pt: 'A primeira coleção da HYPSOS. Preto profundo e vermelho.',
    },
    filter: () => true,
  },
  'new-arrivals': {
    title: { es: 'Novedades', en: 'New in', pt: 'Novidades' },
    desc: { es: 'Los últimos lanzamientos.', en: 'The latest releases.', pt: 'Os últimos lançamentos.' },
    filter: (p) => p.isNew,
  },
  tops: {
    title: { es: 'Camisetas', en: 'T-shirts', pt: 'T-shirts' },
    desc: { es: 'Camisetas de corte oversized.', en: 'Oversized tees.', pt: 'T-shirts de corte oversized.' },
    filter: (p) => p.category === 'tops',
  },
  sweats: {
    title: { es: 'Sudaderas', en: 'Sweats', pt: 'Sweats' },
    desc: { es: 'Hoodies, zip hoodies y crewnecks.', en: 'Hoodies, zip hoodies and crewnecks.', pt: 'Hoodies, zip hoodies e crewnecks.' },
    filter: (p) => p.category === 'sweats',
  },
  bottoms: {
    title: { es: 'Pantalones y shorts', en: 'Pants & shorts', pt: 'Calças e calções' },
    desc: { es: 'Siluetas baggy.', en: 'Baggy silhouettes.', pt: 'Silhuetas baggy.' },
    filter: (p) => p.category === 'bottoms',
  },
  accessories: {
    title: { es: 'Accesorios', en: 'Accessories', pt: 'Acessórios' },
    desc: { es: 'Complementos HYPSOS.', en: 'HYPSOS accessories.', pt: 'Acessórios HYPSOS.' },
    filter: (p) => p.category === 'accessories',
  },
};

export function demoCatalog(lang: Locale): Catalog {
  const products = DEFS.map((d) => buildProduct(d, lang));
  const collections: Collection[] = Object.entries(COLLECTION_COPY).map(([handle, c]) => {
    const list = products.filter(c.filter);
    return {
      handle,
      title: c.title[lang],
      description: c.desc[lang],
      image: list[0]?.images[0] ?? null,
      productHandles: list.map((p) => p.handle),
    };
  });
  for (const p of products) p.collections = collections.filter((c) => c.productHandles.includes(p.handle)).map((c) => c.handle);
  return { source: 'demo', products, collections };
}

/** colour key (black/red) → localized label, used by looks */
export function demoColor(lang: Locale, key: ColorKey) {
  return COLOR_LABEL[lang][key];
}
