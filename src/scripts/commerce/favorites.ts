/** Favourites — stored on this device only (no account required, no fake auth). */
import { store } from '../core/storage';
import { S } from '../core/runtime';
import { toast } from '../core/toast';

const KEY = 'hypsos-favorites-v1';
const list = (): string[] => {
  const v = store.get<string[]>(KEY, []);
  return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 200) : [];
};
export const favorites = {
  all: list,
  has: (h: string) => list().includes(h),
  toggle(h: string) {
    const l = list();
    const on = !l.includes(h);
    store.set(KEY, on ? [h, ...l] : l.filter((x) => x !== h));
    sync();
    toast(on ? S.common.favAdded : S.common.favRemoved);
    document.dispatchEvent(new CustomEvent('favorites:change'));
    return on;
  },
};

export function sync() {
  const l = list();
  document.querySelectorAll<HTMLButtonElement>('[data-fav]').forEach((b) => {
    const on = l.includes(b.dataset.fav!);
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? S.common.removeFav : S.common.addFav);
  });
  document.querySelectorAll<HTMLElement>('[data-fav-dot]').forEach((d) => (d.hidden = l.length === 0));
}

export function initFavorites() {
  sync();
  document.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-fav]');
    if (!b) return;
    e.preventDefault();
    favorites.toggle(b.dataset.fav!);
  });
  window.addEventListener('storage', (e) => { if (e.key === KEY) sync(); });
}
