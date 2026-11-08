/**
 * Reveal system — IntersectionObserver + CSS (no layout thrash, no scroll hijack).
 *  data-reveal="fade|mask|mask-x|scale"  → element transitions in (base.css)
 *  data-split                              → words rise from a mask, staggered
 *  style="--d:.2s"                         → extra delay
 */
import { qsa, reducedMotion } from '../core/dom';

export function splitWords(el: HTMLElement) {
  if (el.dataset.splitDone) return;
  const text = el.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  el.setAttribute('aria-label', text);
  const inner = document.createElement('span');
  inner.setAttribute('aria-hidden', 'true');
  // preserve explicit <br> line breaks
  const parts = el.innerHTML.split(/<br\s*\/?>/i).map((h) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = h;
    return (tmp.textContent || '').trim();
  });
  let i = 0;
  inner.innerHTML = parts
    .map((line) => line.split(' ').filter(Boolean).map((w) => `<span class="split-line"><span style="--i:${i++}">${w.replace(/</g, '&lt;')}</span></span>`).join(' '))
    .join('<br>');
  el.textContent = '';
  el.appendChild(inner);
  el.dataset.splitDone = '1';
}

export function initReveal(root: ParentNode = document) {
  const els = qsa<HTMLElement>('[data-reveal],[data-split]', root);
  qsa<HTMLElement>('[data-split]', root).forEach(splitWords);
  if (reducedMotion() || !('IntersectionObserver' in window)) {
    els.forEach((e) => e.classList.add('is-in'));
    return;
  }
  // clip-path on the target makes IntersectionObserver report no intersection,
  // so masked elements are observed through their parent.
  const map = new Map<Element, HTMLElement[]>();
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      (map.get(en.target) ?? []).forEach((el) => el.classList.add('is-in'));
      io.unobserve(en.target);
    }),
    { rootMargin: '0px 0px -12% 0px', threshold: 0.01 },
  );
  els.forEach((e) => {
    const masked = (e.dataset.reveal || '').startsWith('mask');
    const target = masked && e.parentElement ? e.parentElement : e;
    if (!map.has(target)) map.set(target, []);
    map.get(target)!.push(e);
    io.observe(target);
  });
}
