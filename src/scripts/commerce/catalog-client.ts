/** Client catalogue (built JSON) + variant helpers shared by quick add, runway, search, PDP. */
import { RT } from '../core/runtime';
import type { Snapshot } from './cart';

export interface CP {
  h: string; t: string; ty: string; c: string; n: boolean; d: boolean; a: boolean; p: number; cur: string;
  o: { n: string; k: 'color' | 'size' | 'other'; v: string[] }[];
  v: { id: string; o: string[]; a: boolean; q: number | null; p: number; i: number | null }[];
  i: { s: string; ss?: string; w: number; h: number; c: string | null; vw: string | null }[];
  tags: string[];
}

let pending: Promise<CP[]> | null = null;
export function loadCatalog(): Promise<CP[]> {
  pending ??= fetch(RT.paths.catalog, { credentials: 'same-origin' })
    .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
    .then((j) => (Array.isArray(j.products) ? j.products : []))
    .catch((e) => { pending = null; throw e; });
  return pending;
}
export async function getProduct(handle: string) {
  return (await loadCatalog()).find((p) => p.h === handle) ?? null;
}

export function findVariant(p: CP, selected: string[]) {
  return p.v.find((v) => v.o.every((val, i) => selected[i] == null || selected[i] === val)) ?? null;
}

/** Is option value `val` (option index `oi`) available given the other current selections? */
export function valueAvailable(p: CP, oi: number, val: string, selected: string[]) {
  return p.v.some((v) => v.a && v.o[oi] === val && v.o.every((x, j) => j === oi || selected[j] == null || selected[j] === x));
}

export function imageFor(p: CP, variant: CP['v'][number] | null, smallest = true) {
  const im = (variant?.i != null ? p.i[variant.i] : null) ?? p.i[0];
  if (!im) return null;
  let src = im.s;
  if (smallest && im.ss) src = im.ss.split(',')[0].trim().split(/\s+/)[0];
  return { src, w: im.w, h: im.h };
}

export function snapshot(p: CP, v: CP['v'][number]): Snapshot {
  return {
    handle: p.h,
    title: p.t,
    variantTitle: v.o.join(' / '),
    options: p.o.map((o, i) => ({ name: o.n, value: v.o[i] })),
    price: v.p,
    currency: p.cur,
    image: imageFor(p, v),
    available: v.a,
    max: v.q,
  };
}
