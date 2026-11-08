/**
 * RUNWAY LOOKS — "Try the look" section.
 *
 * Each look = one 9:16 transparent figure + the pieces it is styled with.
 * Current figures are "ghost outfits" composed from the collection garments
 * (tools/build_assets.py). To use real model cut-outs, drop transparent WebP files
 * (1080×1920 + 640×1138) in /public/looks/, update image640/image1080, set probe:true
 * (enables automatic feet-to-floor detection) and adjust each piece's `pin` (% of figure box).
 */
import assets from './generated/assets.json';
import type { Catalog, Look, Product } from '../lib/types';
import type { Locale } from '../i18n/config';
import { demoColor } from './catalog.demo';

type PieceDef = { handle: string; color: 'black' | 'red'; slot: 'head' | 'top' | 'bottom'; isNew?: boolean };

const DEFS: { key: string; name: string; pieces: PieceDef[] }[] = [
  { key: 'ascent', name: 'Ascent', pieces: [
    { handle: 'beanie-001', color: 'black', slot: 'head' },
    { handle: 'oversized-tee-001', color: 'black', slot: 'top' },
    { handle: 'baggy-pant-001', color: 'red', slot: 'bottom', isNew: true },
  ] },
  { key: 'altitude', name: 'Altitude', pieces: [
    { handle: 'hoodie-001', color: 'red', slot: 'top', isNew: true },
    { handle: 'baggy-pant-001', color: 'black', slot: 'bottom' },
  ] },
  { key: 'summit', name: 'Summit', pieces: [
    { handle: 'zip-hoodie-001', color: 'black', slot: 'top', isNew: true },
    { handle: 'baggy-short-001', color: 'black', slot: 'bottom' },
  ] },
  { key: 'vertical', name: 'Vertical', pieces: [
    { handle: 'beanie-001', color: 'black', slot: 'head' },
    { handle: 'crewneck-001', color: 'red', slot: 'top' },
    { handle: 'baggy-pant-001', color: 'black', slot: 'bottom' },
  ] },
  { key: 'apex', name: 'Apex', pieces: [
    { handle: 'beanie-001', color: 'black', slot: 'head' },
    { handle: 'oversized-tee-001', color: 'red', slot: 'top' },
    { handle: 'baggy-short-001', color: 'red', slot: 'bottom' },
  ] },
  { key: 'crown', name: 'Crown', pieces: [
    { handle: 'hoodie-001', color: 'black', slot: 'top' },
    { handle: 'baggy-pant-001', color: 'red', slot: 'bottom', isNew: true },
  ] },
];

const A = assets as unknown as { looks: { index: number; pins: { piece: string; at: [number, number] }[]; '640': { src: string }; '1080': { src: string } }[] };

export interface ResolvedLook extends Look {
  products: Product[];
}

export function getLooks(lang: Locale, catalog: Catalog): ResolvedLook[] {
  return DEFS.map((def, i) => {
    const gen = A.looks[i];
    const pieces = def.pieces
      .map((p) => {
        const pin = gen?.pins.find((x) => x.piece === p.slot)?.at ?? [50, 50];
        const product = catalog.products.find((x) => x.handle === p.handle);
        if (!product) return null;
        // colour label in the active catalogue language (demo) — Shopify catalogues keep their own values
        const color = catalog.source === 'demo' ? demoColor(lang, p.color) : null;
        return { piece: { handle: p.handle, color, pin: pin as [number, number], isNew: p.isNew }, product };
      })
      .filter(Boolean) as { piece: Look['pieces'][number]; product: Product }[];
    return {
      key: def.key,
      name: def.name,
      image640: gen?.['640'].src ?? '',
      image1080: gen?.['1080'].src ?? '',
      probe: false,
      pieces: pieces.map((x) => x.piece),
      products: pieces.map((x) => x.product),
    };
  }).filter((l) => l.pieces.length >= 2);
}
