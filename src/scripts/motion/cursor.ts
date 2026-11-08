/**
 * Contextual cursor: a label ring that follows the pointer over [data-cursor="view|drag|explore|play|add"].
 * Desktop fine-pointer only. The system cursor is never hidden.
 */
import { finePointer, qs, reducedMotion } from '../core/dom';

const LABELS: Record<string, string> = { view: 'View', drag: 'Drag', explore: 'Explore', play: 'Play', add: 'Add', pause: 'Pause' };

export function initCursor() {
  const el = qs('[data-ccursor]');
  if (!el || !finePointer()) return;
  document.documentElement.classList.add('has-ccursor');
  const label = qs('[data-ccursor-label]', el)!;
  let x = 0, y = 0, tx = 0, ty = 0, raf = 0, active = false;
  const k = reducedMotion() ? 1 : 0.2;
  const loop = () => {
    x += (tx - x) * k; y += (ty - y) * k;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    raf = Math.hypot(tx - x, ty - y) > 0.2 ? requestAnimationFrame(loop) : 0;
  };
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    tx = e.clientX; ty = e.clientY;
    if (!active) { x = tx; y = ty; }
    const host = (e.target as HTMLElement).closest<HTMLElement>('[data-cursor]');
    const mode = host?.dataset.cursor ?? '';
    const on = !!mode && mode !== 'none';
    if (on) label.textContent = host!.dataset.cursorLabel || LABELS[mode] || mode;
    el.classList.toggle('is-on', on);
    el.classList.toggle('is-accent', mode === 'add' || mode === 'play');
    active = true;
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  document.addEventListener('pointerdown', () => el.classList.add('is-press'));
  document.addEventListener('pointerup', () => el.classList.remove('is-press'));
  document.documentElement.addEventListener('pointerleave', () => el.classList.remove('is-on'));
}
