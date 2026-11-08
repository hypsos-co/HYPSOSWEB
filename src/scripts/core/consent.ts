/**
 * Cookie consent manager (AEPD-aligned): accept / reject / configure, granular categories,
 * stored choice, withdraw & change at any time (footer "Cookie settings").
 * Non-essential scripts are NEVER loaded before consent:
 *   <script type="text/plain" data-consent="analytics" data-src="…"></script>
 * plus PUBLIC_ANALYTICS_SRC (loaded only when analytics is granted).
 */
import { store } from './storage';
import { RT, S } from './runtime';
import { toast } from './toast';

export type Category = 'preferences' | 'analytics' | 'marketing';
interface Record_ { v: number; ts: string; choices: Record<Category, boolean> }

const KEY = 'hypsos-consent';
const VERSION = 1;
const listeners = new Set<(c: Record<Category, boolean>) => void>();

const MAX_AGE = 1000 * 60 * 60 * 24 * 395; // ask again after ~13 months (AEPD guidance)
function read(): Record_ | null {
  const r = store.get<Record_ | null>(KEY, null);
  if (!r || r.v !== VERSION) return null;
  const age = Date.now() - Date.parse(r.ts);
  return Number.isFinite(age) && age > MAX_AGE ? null : r;
}

export function hasConsent(cat: Category) {
  return !!read()?.choices[cat];
}
export function onConsent(cb: (c: Record<Category, boolean>) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function activate(choices: Record<Category, boolean>) {
  document.querySelectorAll<HTMLScriptElement>('script[type="text/plain"][data-consent]').forEach((s) => {
    const cat = s.dataset.consent as Category;
    if (!choices[cat] || s.dataset.loaded) return;
    const n = document.createElement('script');
    if (s.dataset.src) n.src = s.dataset.src;
    else n.textContent = s.textContent;
    n.async = true;
    s.dataset.loaded = '1';
    s.after(n);
  });
  if (choices.analytics && RT.analytics && !document.querySelector('script[data-hypsos-analytics]')) {
    const n = document.createElement('script');
    n.src = RT.analytics;
    n.async = true;
    n.dataset.hypsosAnalytics = '1';
    document.head.appendChild(n);
  }
}

function save(choices: Record<Category, boolean>) {
  const prev = read();
  store.set(KEY, { v: VERSION, ts: new Date().toISOString(), choices });
  if (!choices.preferences) store.remove('hypsos-recent-searches');
  listeners.forEach((l) => l(choices));
  // consent withdrawn for something already running → reload so those scripts stop
  const revoked = prev && (['analytics', 'marketing'] as Category[]).some((c) => prev.choices[c] && !choices[c]);
  if (revoked) window.location.reload();
  else activate(choices);
}

export function initConsent() {
  const banner = document.querySelector<HTMLElement>('[data-consent]');
  const dlg = document.querySelector<HTMLDialogElement>('[data-consent-dialog]');
  const form = document.querySelector<HTMLFormElement>('[data-consent-form]');
  if (!banner || !dlg || !form) return;
  const existing = read();
  const html = document.documentElement;
  const showBanner = (on: boolean) => {
    banner.hidden = !on;
    html.classList.toggle('has-consent-open', on);
  };
  if (existing) activate(existing.choices);
  else showBanner(true);

  const all = (v: boolean) => ({ preferences: v, analytics: v, marketing: v });
  const fill = () => {
    const c = read()?.choices ?? all(false);
    (['preferences', 'analytics', 'marketing'] as Category[]).forEach((k) => {
      const input = form.elements.namedItem(k) as HTMLInputElement | null;
      if (input) input.checked = !!c[k];
    });
  };
  const done = (choices: Record<Category, boolean>) => {
    save(choices);
    showBanner(false);
    if (dlg.open) dlg.close();
    toast(S.cookies?.saved ?? 'OK');
  };
  const openDialog = () => { fill(); if (!dlg.open) dlg.showModal(); };

  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-consent-accept]')) done(all(true));
    else if (t.closest('[data-consent-reject]')) done(all(false));
    else if (t.closest('[data-consent-configure]') || t.closest('[data-consent-open]')) openDialog();
    else if (t.closest('[data-consent-save]')) {
      const get = (k: string) => !!(form.elements.namedItem(k) as HTMLInputElement | null)?.checked;
      done({ preferences: get('preferences'), analytics: get('analytics'), marketing: get('marketing') });
    } else if (t.closest('[data-consent-dismiss]')) dlg.close();
  });
  dlg.addEventListener('click', (e) => {
    if (e.target !== dlg) return;
    const r = dlg.getBoundingClientRect();
    const { clientX: x, clientY: y } = e as MouseEvent;
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) dlg.close();
  });
}
