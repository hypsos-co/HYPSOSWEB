export const qs = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
export const qsa = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
export const isMobile = () => window.matchMedia('(max-width: 749px)').matches;

export function escapeHtml(s: string) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/* ── scroll lock (stackable) ─────────────────────────────────────────── */
let locks = 0;
let savedY = 0;
export function lockScroll() {
  if (locks++ === 0) {
    savedY = window.scrollY;
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.classList.add('is-locked');
    document.body.style.paddingRight = sbw ? `${sbw}px` : '';
    document.body.style.overflow = 'hidden';
  }
}
export function unlockScroll() {
  if (locks === 0) return;
  if (--locks === 0) {
    document.documentElement.classList.remove('is-locked');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    if (Math.abs(window.scrollY - savedY) > 2) window.scrollTo(0, savedY);
  }
}

/* ── focus trap ──────────────────────────────────────────────────────── */
const FOCUSABLE = 'a[href],area[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
export function focusables(root: Element) {
  return qsa<HTMLElement>(FOCUSABLE, root).filter((el) => !el.hasAttribute('hidden') && el.offsetParent !== null && el.getAttribute('aria-hidden') !== 'true');
}
export function trapFocus(root: HTMLElement, extra: HTMLElement[] = []) {
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const f = [...extra, ...focusables(root)];
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  const targets = [root, ...extra];
  targets.forEach((t) => t.addEventListener('keydown', onKey));
  return () => targets.forEach((t) => t.removeEventListener('keydown', onKey));
}

/** Generic overlay controller (show/hide with transition + focus management). */
export function overlay(el: HTMLElement, { openClass = 'is-open', onOpen, onClose, initialFocus, extraFocus = [] }: { openClass?: string; onOpen?: () => void; onClose?: () => void; initialFocus?: () => HTMLElement | null; extraFocus?: HTMLElement[] } = {}) {
  let release: (() => void) | null = null;
  let returnTo: HTMLElement | null = null;
  let hideTimer = 0;
  const isOpen = () => el.classList.contains(openClass);
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  function open(trigger?: HTMLElement | null) {
    if (isOpen()) return;
    window.clearTimeout(hideTimer);
    returnTo = trigger ?? (document.activeElement as HTMLElement);
    el.hidden = false;
    void el.offsetWidth;
    el.classList.add(openClass);
    lockScroll();
    release = trapFocus(el, extraFocus);
    el.addEventListener('keydown', onKey);
    onOpen?.();
    requestAnimationFrame(() => (initialFocus?.() ?? focusables(el)[0])?.focus({ preventScroll: true }));
  }
  function close() {
    if (!isOpen()) return;
    el.classList.remove(openClass);
    release?.();
    el.removeEventListener('keydown', onKey);
    unlockScroll();
    onClose?.();
    hideTimer = window.setTimeout(() => { if (!isOpen()) el.hidden = true; }, reducedMotion() ? 0 : 800);
    returnTo?.focus?.({ preventScroll: true });
  }
  return { open, close, toggle: (t?: HTMLElement) => (isOpen() ? close() : open(t)), isOpen };
}
