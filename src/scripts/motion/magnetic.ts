/** Subtle magnetic pull on [data-magnetic] (desktop only, transform-only). */
import { finePointer, qsa, reducedMotion } from '../core/dom';

export function initMagnetic(root: ParentNode = document) {
  if (!finePointer() || reducedMotion()) return;
  qsa<HTMLElement>('[data-magnetic]', root).forEach((el) => {
    const strength = Number(el.dataset.magnetic) || 0.25;
    el.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1)';
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
    });
    el.addEventListener('pointerleave', () => (el.style.transform = ''));
  });
}
