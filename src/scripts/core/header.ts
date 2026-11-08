/** Header: scroll states, SHOP mega menu (hover intent + click + keyboard), mobile menu. */
import { finePointer, overlay, qs, qsa } from './dom';

export function initHeader() {
  const hdr = qs('[data-header]');
  if (!hdr) return;
  const html = document.documentElement;

  /* scroll states */
  let lastY = window.scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    hdr.classList.toggle('is-scrolled', y > 40);
    html.classList.toggle('is-scrolled-far', y > window.innerHeight * 0.9);
    if (!html.classList.contains('is-locked')) {
      const down = y > lastY + 4;
      const up = y < lastY - 4;
      if (down && y > 380) hdr.classList.add('is-hidden');
      else if (up || y < 120) hdr.classList.remove('is-hidden');
    }
    lastY = y;
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* mega menu */
  const trigger = qs<HTMLButtonElement>('[data-mega-trigger="shop"]', hdr);
  const panel = qs('[data-mega="shop"]', hdr);
  const scrim = qs('[data-mega-scrim]', hdr);
  if (trigger && panel && scrim) {
    let openT = 0, closeT = 0;
    const setOpen = (on: boolean) => {
      window.clearTimeout(openT); window.clearTimeout(closeT);
      if (on === panel.classList.contains('is-open')) return;
      trigger.setAttribute('aria-expanded', String(on));
      hdr.classList.toggle('is-mega', on);
      if (on) {
        panel.hidden = false; scrim.hidden = false;
        void panel.offsetWidth;
        panel.classList.add('is-open'); scrim.classList.add('is-open');
      } else {
        panel.classList.remove('is-open'); scrim.classList.remove('is-open');
        closeT = window.setTimeout(() => { panel.hidden = true; scrim.hidden = true; }, 800);
      }
    };
    trigger.addEventListener('click', () => setOpen(!panel.classList.contains('is-open')));
    if (finePointer()) {
      const enter = () => { window.clearTimeout(closeT); openT = window.setTimeout(() => setOpen(true), 90); };
      const leave = () => { window.clearTimeout(openT); closeT = window.setTimeout(() => setOpen(false), 220); };
      trigger.addEventListener('pointerenter', enter);
      trigger.addEventListener('pointerleave', leave);
      panel.addEventListener('pointerenter', () => window.clearTimeout(closeT));
      panel.addEventListener('pointerleave', leave);
    }
    scrim.addEventListener('click', () => setOpen(false));
    hdr.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) { setOpen(false); trigger.focus(); }
    });
    panel.addEventListener('focusout', (e) => {
      const to = e.relatedTarget as Node | null;
      if (to && !panel.contains(to) && to !== trigger) setOpen(false);
    });
  }

  /* mobile menu */
  const burger = qs<HTMLButtonElement>('[data-menu-toggle]');
  const menu = qs('[data-mobile-menu]');
  if (burger && menu) {
    const ov = overlay(menu, {
      extraFocus: [burger],
      initialFocus: () => menu.querySelector('a'),
      onOpen: () => { burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', burger.dataset.labelClose!); hdr.classList.add('is-menu'); },
      onClose: () => { burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', burger.dataset.labelOpen!); hdr.classList.remove('is-menu'); },
    });
    burger.addEventListener('click', () => ov.toggle(burger));
    // the burger lives in the header (outside the overlay): keep Esc + focus reachable
    burger.addEventListener('keydown', (e) => { if (e.key === 'Escape') ov.close(); });
    qsa('a', menu).forEach((a) => a.addEventListener('click', () => ov.close()));
    window.matchMedia('(min-width: 1100px)').addEventListener('change', (m) => { if (m.matches) ov.close(); });
  }
}
