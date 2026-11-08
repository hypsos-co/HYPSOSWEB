import { escapeHtml } from './dom';

export function toast(message: string, action?: { label: string; onClick?: () => void; href?: string }, ms = 3200) {
  const host = document.querySelector<HTMLElement>('[data-toasts]');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="toast__mark" aria-hidden="true"></span><span>${escapeHtml(message)}</span>`;
  if (action) {
    const a = document.createElement(action.href ? 'a' : 'button');
    a.textContent = action.label;
    if (action.href) (a as HTMLAnchorElement).href = action.href;
    else (a as HTMLButtonElement).type = 'button';
    a.addEventListener('click', () => { action.onClick?.(); dismiss(); });
    el.appendChild(a);
  }
  host.querySelectorAll<HTMLElement>('.toast').forEach((t) => { if (t.dataset.msg === message) t.remove(); });
  el.dataset.msg = message;
  while (host.children.length > 2) host.firstElementChild?.remove();
  host.appendChild(el);
  let timer = window.setTimeout(dismiss, ms);
  el.addEventListener('pointerenter', () => window.clearTimeout(timer));
  el.addEventListener('pointerleave', () => { timer = window.setTimeout(dismiss, 1200); });
  function dismiss() {
    el.classList.add('is-out');
    window.setTimeout(() => el.remove(), 400);
  }
}
