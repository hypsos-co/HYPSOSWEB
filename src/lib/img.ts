import type { ProductImage } from './types';

/** Pick the srcset candidate closest to (>=) the requested width. */
export function pickSrc(img: ProductImage | null | undefined, width: number): string {
  if (!img) return '';
  if (!img.srcset) return img.src;
  const cands = img.srcset.split(',').map((s) => {
    const [u, w] = s.trim().split(/\s+/);
    return { u, w: parseInt(w, 10) || 0 };
  }).sort((a, b) => a.w - b.w);
  return (cands.find((c) => c.w >= width) ?? cands[cands.length - 1]).u;
}
