/** Internal commerce model — Shopify-shaped so both data sources map 1:1. */

export interface Money {
  amount: number;
  currencyCode: string;
}

export interface ProductImage {
  src: string;
  srcset?: string;
  width: number;
  height: number;
  alt: string;
  /** option value this image belongs to (Color), when known */
  color?: string | null;
  view?: 'front' | 'back' | 'detail' | 'lifestyle' | null;
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface Variant {
  id: string; // Shopify ProductVariant GID or demo id
  title: string;
  options: SelectedOption[];
  price: Money;
  compareAtPrice: Money | null;
  available: boolean;
  /** null = unknown (Shopify scope not granted) */
  quantityAvailable: number | null;
  imageIndex: number | null;
}

export interface ProductOption {
  name: string;
  /** semantic key used by filters & UI: 'color' | 'size' | other */
  key: 'color' | 'size' | 'other';
  values: string[];
}

export interface StoryModule {
  key: 'silhouette' | 'fabric' | 'construction' | 'graphics' | 'fit' | 'details';
  text: string;
  images: ProductImage[];
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  /** stable category key for navigation */
  category: 'tops' | 'sweats' | 'bottoms' | 'accessories' | 'other';
  tags: string[];
  isNew: boolean;
  description: string;
  descriptionHtml?: string;
  options: ProductOption[];
  variants: Variant[];
  images: ProductImage[];
  priceRange: { min: Money; max: Money };
  available: boolean;
  /** only confirmed data — never invented */
  composition: string | null;
  care: string | null;
  details: string[];
  story: StoryModule[];
  collections: string[];
  createdAt: string;
  seo: { title: string | null; description: string | null };
  demo: boolean;
}

export interface Collection {
  handle: string;
  title: string;
  description: string;
  image: ProductImage | null;
  productHandles: string[];
}

export interface Catalog {
  source: 'shopify' | 'demo';
  products: Product[];
  collections: Collection[];
}

export interface LookPiece {
  handle: string;
  /** colour option value pre-selected for this look */
  color: string | null;
  pin: [number, number]; // left %, top % of the 9:16 figure box
  isNew?: boolean;
}

export interface Look {
  key: string;
  name: string;
  image640: string;
  image1080: string;
  /** set when the figure is a real model cut-out (enables feet detection) */
  probe: boolean;
  pieces: LookPiece[];
}
