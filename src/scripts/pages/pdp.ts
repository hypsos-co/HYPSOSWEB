/** Product page: options → variant, gallery per colour, availability, quantity, add to bag, zoom, size guide. */
import { cart } from '../commerce/cart';
import { findVariant, snapshot, valueAvailable, type CP } from '../commerce/catalog-client';
import { RT, S, fmt, money } from '../core/runtime';
import { qs, qsa, reducedMotion } from '../core/dom';
import { toast } from '../core/toast';
import { storefront } from '../../lib/shopify/storefront';
import { VARIANT_AVAILABILITY } from '../../lib/shopify/queries';

const root = qs('[data-pdp]');
if (root) init(root);

function init(root: HTMLElement) {
  let p: CP;
  try { p = JSON.parse(qs('[data-pdp-json]', root)!.textContent || ''); } catch { return; }
  const form = qs<HTMLFormElement>('[data-pdp-form]', root)!;
  const addBtn = qs<HTMLButtonElement>('[data-pdp-add]', root)!;
  const addLabel = qs('[data-add-label]', addBtn)!;
  const stock = qs('[data-stock]', root)!;
  const msg = qs('[data-pdp-msg]', root)!;
  const priceEl = qs('[data-pdp-price] .price__amount', root);
  const qtyInput = qs<HTMLInputElement>('[data-qty]', root)!;
  const slides = qsa<HTMLElement>('[data-slide]', root);
  const track = qs('[data-gallery-track]', root)!;
  const dots = qs('[data-gallery-dots]', root)!;
  const ci = p.o.findIndex((o) => o.k === 'color');
  const si = p.o.findIndex((o) => o.k === 'size');

  const selected = (): (string | null)[] => p.o.map((_, i) => (form.querySelector<HTMLInputElement>(`input[name="opt-${i}"]:checked`)?.value ?? null));

  // URL ?color= preselect
  const urlColor = new URL(location.href).searchParams.get('color');
  if (ci >= 0 && urlColor) {
    const input = form.querySelector<HTMLInputElement>(`input[name="opt-${ci}"][value="${CSS.escape(urlColor)}"]`);
    if (input) input.checked = true;
  }

  const visibleSlides = () => slides.filter((s) => !s.hidden);

  function renderDots() {
    const vis = visibleSlides();
    dots.innerHTML = vis.map((_, i) => `<button type="button" role="tab" aria-label="${i + 1}/${vis.length}" aria-selected="${i === 0}" data-dot="${i}"></button>`).join('');
  }

  function update(fromUser = false) {
    const sel = selected();
    // option labels + availability per value
    p.o.forEach((o, oi) => {
      const fs = form.querySelector<HTMLElement>(`[data-opt="${oi}"]`);
      if (!fs) return;
      const val = fs.querySelector('[data-opt-value]');
      if (val) val.textContent = sel[oi] ?? '';
      fs.querySelectorAll<HTMLInputElement>('input').forEach((inp) => {
        inp.closest('.pdp__val')?.classList.toggle('is-unavailable', !valueAvailable(p, oi, inp.value, sel));
      });
    });
    // gallery by colour
    if (ci >= 0 && sel[ci]) {
      const color = sel[ci];
      let changed = false;
      slides.forEach((s) => {
        const hide = !!s.dataset.color && s.dataset.color !== color;
        if (s.hidden !== hide) { s.hidden = hide; changed = true; }
      });
      if (changed) { track.scrollTo({ left: 0, behavior: 'auto' }); renderDots(); }
      if (fromUser) {
        const u = new URL(location.href);
        u.searchParams.set('color', color);
        history.replaceState(history.state, '', u);
      }
    }
    const complete = sel.every((v) => v != null);
    const v = complete ? findVariant(p, sel as string[]) : null;
    if (priceEl && v) priceEl.textContent = money(v.p, p.cur);
    // stock
    stock.className = 'pdp__stock t-small';
    if (v) {
      if (!v.a) { stock.textContent = S.common.soldOut; stock.classList.add('is-out'); }
      else if (v.q != null && v.q <= 3) { stock.textContent = fmt(S.product.onlyN, { n: v.q }); stock.classList.add('is-low'); }
      else stock.textContent = S.common.inStock;
    } else stock.textContent = '';
    // qty bounds
    const max = Math.max(1, Math.min(10, v?.q ?? 10));
    qtyInput.max = String(max);
    if (Number(qtyInput.value) > max) qtyInput.value = String(max);
    // CTA
    addBtn.disabled = !!v && !v.a;
    addLabel.textContent = !complete ? addBtn.dataset.labelSelect! : v && !v.a ? addBtn.dataset.labelSoldout! : addBtn.dataset.labelAdd!;
    msg.textContent = '';
    return v;
  }

  form.addEventListener('change', () => update(true));
  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const step = t.closest<HTMLElement>('[data-qty-step]');
    if (step) {
      const n = Math.max(1, Math.min(Number(qtyInput.max) || 10, (Number(qtyInput.value) || 1) + Number(step.dataset.qtyStep)));
      qtyInput.value = String(n);
    }
  });
  qtyInput.addEventListener('change', () => {
    const n = Math.max(1, Math.min(Number(qtyInput.max) || 10, Math.round(Number(qtyInput.value) || 1)));
    qtyInput.value = String(n);
  });

  async function add() {
    const sel = selected();
    const missing = sel.findIndex((v) => v == null);
    if (missing >= 0) {
      msg.textContent = S.product.selectSizeFirst;
      form.querySelector<HTMLInputElement>(`input[name="opt-${missing}"]`)?.focus();
      return;
    }
    const v = findVariant(p, sel as string[]);
    if (!v || !v.a) { msg.textContent = S.cart.unavailable; return; }
    addBtn.classList.add('is-loading');
    try {
      await cart().add([{ merchandiseId: v.id, quantity: Math.max(1, Number(qtyInput.value) || 1), snapshot: snapshot(p, v) }]);
      msg.textContent = '';
    } catch (err) {
      msg.textContent = (err as Error).message || S.common.error;
    } finally {
      addBtn.classList.remove('is-loading');
    }
  }
  addBtn.addEventListener('click', add);
  qs('[data-pdp-bar-add]')?.addEventListener('click', () => {
    if (selected().some((v) => v == null)) { addBtn.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' }); msg.textContent = S.product.selectSizeFirst; return; }
    add();
  });

  /* gallery (mobile carousel) */
  renderDots();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const i = visibleSlides().indexOf(en.target as HTMLElement);
      dots.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-selected', String(j === i)));
    });
  }, { root: track, threshold: 0.6 });
  slides.forEach((s) => io.observe(s));
  const go = (dir: number) => track.scrollBy({ left: dir * track.clientWidth, behavior: reducedMotion() ? 'auto' : 'smooth' });
  qs('[data-gallery-prev]', root)?.addEventListener('click', () => go(-1));
  qs('[data-gallery-next]', root)?.addEventListener('click', () => go(1));
  dots.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-dot]');
    if (b) track.scrollTo({ left: Number(b.dataset.dot) * track.clientWidth, behavior: reducedMotion() ? 'auto' : 'smooth' });
  });
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });

  /* zoom */
  const dlg = qs<HTMLDialogElement>('[data-zoom-dialog]');
  const zimg = qs<HTMLImageElement>('[data-zoom-img]');
  const zstage = qs('[data-zoom-stage]');
  root.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-zoom]');
    if (!b || !dlg || !zimg) return;
    const img = b.querySelector('img')!;
    const largest = img.srcset ? img.srcset.split(',').map((s) => s.trim().split(/\s+/)[0]).pop()! : img.src;
    zimg.src = largest;
    zimg.alt = img.alt;
    dlg.showModal();
  });
  zstage?.addEventListener('pointermove', (e) => {
    const r = zstage.getBoundingClientRect();
    zstage.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`);
    zstage.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`);
  });
  zstage?.addEventListener('click', () => dlg?.close());
  qs('[data-zoom-close]')?.addEventListener('click', () => dlg?.close());

  /* size guide */
  const sg = qs<HTMLDialogElement>('[data-sizeguide]');
  root.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('[data-sizeguide-open]')) sg?.showModal(); });
  qs('[data-sizeguide-close]')?.addEventListener('click', () => sg?.close());
  sg?.addEventListener('click', (e) => { if (e.target === sg) sg.close(); });

  /* sticky mobile bar */
  const bar = qs('[data-pdp-bar]');
  if (bar) {
    const bio = new IntersectionObserver(([en]) => {
      const below = en.boundingClientRect.top < 0;
      const on = !en.isIntersecting && below && window.matchMedia('(max-width: 1099px)').matches;
      bar.classList.toggle('is-on', on);
      bar.setAttribute('aria-hidden', String(!on));
      bar.querySelector('button')!.tabIndex = on ? 0 : -1;
    });
    bio.observe(addBtn);
  }

  update(false);

  /* live availability (Shopify only) */
  if (RT.source === 'shopify' && RT.shopify) {
    storefront(RT.shopify, VARIANT_AVAILABILITY, { handle: p.h, country: 'ES' }).then((d: any) => {
      const nodes = d?.product?.variants?.nodes ?? [];
      nodes.forEach((n: any) => { const v = p.v.find((x) => x.id === n.id); if (v) v.a = !!n.availableForSale; });
      update(false);
    }).catch(() => toast(S.common.error));
  }
}
