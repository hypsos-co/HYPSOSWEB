/** Quick add from product cards: [data-qa-variant] buttons inside [data-card]. */
import { cart } from './cart';
import { getProduct, snapshot } from './catalog-client';
import { S } from '../core/runtime';
import { toast } from '../core/toast';

export function initQuickAdd() {
  document.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-qa-variant]');
    if (!btn) {
      const tog = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-qa-toggle]');
      if (tog) {
        e.preventDefault();
        const card = tog.closest<HTMLElement>('[data-card]')!;
        const on = !card.classList.contains('is-qa');
        document.querySelectorAll('[data-card].is-qa').forEach((c) => { c.classList.remove('is-qa'); c.querySelector('[data-qa-toggle]')?.setAttribute('aria-expanded', 'false'); });
        card.classList.toggle('is-qa', on);
        tog.setAttribute('aria-expanded', String(on));
        if (on) (card.querySelector<HTMLButtonElement>('[data-qa-variant]:not([disabled])'))?.focus({ preventScroll: true });
      }
      return;
    }
    e.preventDefault();
    if (btn.disabled || btn.classList.contains('is-loading')) return;
    const card = btn.closest<HTMLElement>('[data-card]');
    const handle = btn.dataset.handle || card?.dataset.card;
    if (!handle) return;
    btn.classList.add('is-loading');
    try {
      const p = await getProduct(handle);
      const v = p?.v.find((x) => x.id === btn.dataset.qaVariant);
      if (!p || !v) throw new Error(S.cart.unavailable);
      await cart().add([{ merchandiseId: v.id, quantity: 1, snapshot: snapshot(p, v) }]);
      card?.classList.remove('is-qa');
      card?.querySelector('[data-qa-toggle]')?.setAttribute('aria-expanded', 'false');
    } catch (err) {
      toast((err as Error).message || S.common.error);
    } finally {
      btn.classList.remove('is-loading');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = document.querySelector<HTMLElement>('[data-card].is-qa');
    if (open) { open.classList.remove('is-qa'); open.querySelector<HTMLElement>('[data-qa-toggle]')?.focus(); }
  });
}
