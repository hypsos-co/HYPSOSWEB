/** Cart drawer + header counter + checkout button + any [data-cart-page] renderers. */
import { cart, type CartLine, type CartState } from './cart';
import { RT, S, fmt, money, productUrl } from '../core/runtime';
import { escapeHtml, overlay, qs, qsa } from '../core/dom';
import { toast } from '../core/toast';

export function lineHTML(l: CartLine, big = false) {
  const opts = l.options.filter((o) => o.value && !/default title/i.test(o.value)).map((o) => `${escapeHtml(o.name)}: ${escapeHtml(o.value)}`).join(' · ');
  const max = Math.min(10, l.max ?? 10);
  return `
  <li class="cline${big ? ' cline--big' : ''}" data-line="${escapeHtml(l.id)}">
    <a class="cline__media plinth" href="${productUrl(l.handle)}" tabindex="-1" aria-hidden="true">${l.image ? `<img src="${escapeHtml(l.image.src)}" alt="" width="${l.image.w || 480}" height="${l.image.h || 600}" loading="lazy" decoding="async">` : ''}</a>
    <div class="cline__info">
      <a class="cline__title link-u" href="${productUrl(l.handle)}">${escapeHtml(l.title)}</a>
      <span class="cline__opts t-small t-muted">${opts}</span>
      ${!l.available ? `<span class="t-label t-crimson">${escapeHtml(S.common.soldOut)}</span>` : ''}
      <div class="cline__row">
        <div class="qty" role="group" aria-label="${escapeHtml(S.common.quantity)}">
          <button type="button" class="qty__btn" data-qty="-1" aria-label="${escapeHtml(S.common.decrease)}">−</button>
          <span class="qty__val" aria-live="polite">${l.quantity}</span>
          <button type="button" class="qty__btn" data-qty="1" aria-label="${escapeHtml(S.common.increase)}" ${l.quantity >= max ? 'disabled' : ''}>+</button>
        </div>
        <span class="cline__price">${money(l.price * l.quantity, l.currency)}</span>
      </div>
      <button type="button" class="cline__remove t-label link-u" data-remove>${escapeHtml(S.common.remove)}</button>
    </div>
  </li>`;
}

function countLabel(n: number) {
  return n === 1 ? S.common.item : fmt(S.common.items, { n });
}

export function initCartUI() {
  const c = cart();
  const drawer = qs('[data-cart-drawer]');
  const ov = drawer ? overlay(drawer, { initialFocus: () => qs('[data-cart-close].icon-btn', drawer!) }) : null;

  const render = (s: CartState) => {
    qsa('[data-cart-count]').forEach((el) => {
      const prev = el.textContent;
      el.textContent = String(s.totalQuantity);
      el.classList.toggle('has-items', s.totalQuantity > 0);
      if (prev !== String(s.totalQuantity) && prev !== '0' || (prev === '0' && s.totalQuantity > 0)) {
        el.classList.add('is-bump');
        setTimeout(() => el.classList.remove('is-bump'), 450);
      }
    });
    qsa('[data-cart-open]').forEach((b) => b.setAttribute('aria-label', `${S.cart.title} — ${countLabel(s.totalQuantity)}`));
    qsa('[data-cart-count-label]').forEach((el) => (el.textContent = s.totalQuantity ? String(s.totalQuantity) : ''));
    qsa('[data-cart-lines]').forEach((host) => {
      const big = host.hasAttribute('data-cart-page');
      host.innerHTML = s.lines.length ? `<ul role="list" class="clines">${s.lines.map((l) => lineHTML(l, big)).join('')}</ul>` : '';
    });
    qsa('[data-cart-empty]').forEach((el) => (el.hidden = s.lines.length > 0));
    qsa('[data-cart-foot]').forEach((el) => (el.hidden = s.lines.length === 0));
    qsa('[data-cart-subtotal]').forEach((el) => (el.textContent = money(s.subtotal, s.currency)));
    qsa<HTMLButtonElement>('[data-checkout]').forEach((b) => {
      b.disabled = s.lines.length === 0;
      b.toggleAttribute('data-demo', s.demo);
    });
  };
  c.addEventListener('change', (e) => render((e as CustomEvent<CartState>).detail));
  render(c.state);

  const msg = (text: string) => qsa('[data-cart-msg]').forEach((m) => { m.textContent = text; m.hidden = !text; });

  document.addEventListener('click', async (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-cart-open]')) { e.preventDefault(); ov?.open(t.closest('[data-cart-open]') as HTMLElement); return; }
    if (t.closest('[data-cart-close]')) { ov?.close(); return; }
    const checkout = t.closest<HTMLButtonElement>('[data-checkout]');
    if (checkout) {
      if (c.isDemo || !c.checkout()) msg(S.demo.checkoutDisabled);
      return;
    }
    const lineEl = t.closest<HTMLElement>('[data-line]');
    if (!lineEl) return;
    const id = lineEl.dataset.line!;
    const line = c.state.lines.find((l) => l.id === id);
    if (!line) return;
    const qtyBtn = t.closest<HTMLButtonElement>('[data-qty]');
    const rem = t.closest('[data-remove]');
    if (!qtyBtn && !rem) return;
    lineEl.classList.add('is-busy');
    try {
      if (rem) { await c.remove(id); toast(S.cart.removed); }
      else await c.update(id, line.quantity + Number(qtyBtn!.dataset.qty));
      msg('');
    } catch (err) {
      msg((err as Error).message || S.common.error);
      lineEl.classList.remove('is-busy');
    }
  });

  c.addEventListener('added', (e) => {
    const d = (e as CustomEvent).detail || {};
    // the runway keeps the shopper on the stage ("after add: stay")
    if (d.source === 'runway' || window.matchMedia('(max-width: 749px)').matches) {
      toast(d.look ? S.cart.lookAdded : S.cart.added, { label: S.cart.viewBag, onClick: () => ov?.open() });
    } else ov?.open();
  });
  return { open: () => ov?.open(), close: () => ov?.close() };
}
