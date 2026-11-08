/** Search overlay + shared matcher (also used by /search page). */
import { loadCatalog, type CP } from './catalog-client';
import { RT, S, fmt, money, productUrl } from '../core/runtime';
import { escapeHtml, overlay, qs } from '../core/dom';
import { store } from '../core/storage';
import { hasConsent } from '../core/consent';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const SYN: Record<string, string[]> = {
  camiseta: ['tee', 't-shirt'], tshirt: ['tee'], camisola: ['tee'],
  sudadera: ['hoodie', 'crewneck', 'sweat'], capucha: ['hoodie'], moletom: ['hoodie', 'sweat'], sweat: ['hoodie', 'crewneck'],
  pantalon: ['pant'], pantalones: ['pant', 'short'], calcas: ['pant'], calca: ['pant'], pants: ['pant'],
  short: ['short'], calcoes: ['short'], bermuda: ['short'],
  gorro: ['beanie'], hat: ['beanie'], accesorios: ['beanie'], acessorios: ['beanie'],
  negro: ['black', 'negro', 'preto'], black: ['negro', 'preto'], preto: ['black', 'negro'],
  rojo: ['red', 'vermelho'], red: ['rojo', 'vermelho'], vermelho: ['red', 'rojo'],
  nuevo: ['new'], novo: ['new'], novedades: ['new'],
};

export function searchProducts(list: CP[], q: string): CP[] {
  const tokens = norm(q).split(/\s+/).filter((t) => t.length > 0);
  if (!tokens.length) return [];
  const scored = list.map((p) => {
    const hay = {
      title: norm(p.t),
      type: norm(`${p.ty} ${p.c}`),
      extra: norm(`${p.tags.join(' ')} ${p.o.flatMap((o) => o.v).join(' ')} ${p.n ? 'new' : ''}`),
    };
    let score = 0;
    for (const tok of tokens) {
      const alts = [tok, ...(SYN[tok] ?? [])];
      let best = 0;
      for (const a of alts) {
        if (hay.title.startsWith(a)) best = Math.max(best, 6);
        else if (hay.title.includes(a)) best = Math.max(best, 4);
        else if (hay.type.includes(a)) best = Math.max(best, 3);
        else if (hay.extra.includes(a)) best = Math.max(best, 2);
      }
      if (!best) return { p, score: 0 };
      score += best;
    }
    return { p, score: score + (p.a ? 0.5 : 0) };
  });
  return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).map((s) => s.p);
}

export function resultHTML(p: CP) {
  const im = p.i[0];
  const src = im?.ss ? im.ss.split(',')[0].trim().split(/\s+/)[0] : im?.s;
  return `<li><a class="sres" href="${productUrl(p.h)}" data-cursor="view">
    <span class="sres__media plinth">${src ? `<img src="${escapeHtml(src)}" alt="" width="480" height="600" loading="lazy" decoding="async">` : ''}</span>
    <span class="sres__t">${escapeHtml(p.t)}</span>
    <span class="sres__m t-small t-muted">${escapeHtml(p.ty)} · ${p.a ? money(p.p, p.cur) : escapeHtml(S.common.soldOut)}</span>
  </a></li>`;
}

const RECENT = 'hypsos-recent-searches';
export function rememberSearch(q: string) {
  if (!hasConsent('preferences') || !q.trim()) return;
  const l = store.get<string[]>(RECENT, []).filter((x) => x !== q);
  store.set(RECENT, [q, ...l].slice(0, 6));
}

export function initSearch() {
  const root = qs('[data-search]');
  if (!root) return;
  const input = qs<HTMLInputElement>('[data-search-input]', root)!;
  const grid = qs('[data-search-grid]', root)!;
  const heading = qs('[data-search-heading]', root)!;
  const empty = qs('[data-search-empty]', root)!;
  const emptyText = qs('[data-search-empty-text]', root)!;
  const status = qs('[data-search-status]', root)!;
  const all = qs<HTMLAnchorElement>('[data-search-all]', root)!;
  const recentWrap = qs('[data-search-recent-wrap]', root)!;
  const recentList = qs('[data-search-recent]', root)!;
  const ov = overlay(root, { initialFocus: () => input });

  const renderRecent = () => {
    const l = hasConsent('preferences') ? store.get<string[]>(RECENT, []) : [];
    recentWrap.hidden = !l.length;
    recentList.innerHTML = l.map((q) => `<li><button type="button" class="link-u" data-search-term="${escapeHtml(q)}">${escapeHtml(q)}</button></li>`).join('');
  };
  const suggestions = async () => {
    const list = await loadCatalog().catch(() => []);
    heading.textContent = S.search.suggestions;
    grid.innerHTML = list.filter((p) => p.n).concat(list.filter((p) => !p.n)).slice(0, 4).map(resultHTML).join('');
    empty.hidden = true; all.hidden = true;
  };
  let seq = 0;
  const run = async () => {
    const q = input.value.trim();
    const my = ++seq;
    if (!q) return suggestions();
    let list: CP[] = [];
    try { list = await loadCatalog(); } catch { heading.textContent = S.common.error; return; }
    if (my !== seq) return;
    const res = searchProducts(list, q);
    heading.textContent = fmt(S.search.resultsFor, { q });
    grid.innerHTML = res.slice(0, 8).map(resultHTML).join('');
    empty.hidden = res.length > 0;
    emptyText.textContent = fmt(S.search.noResults, { q });
    all.hidden = res.length === 0;
    all.href = `${RT.paths.search}?q=${encodeURIComponent(q)}`;
    status.textContent = res.length ? `${res.length} ${S.search.results}` : fmt(S.search.noResults, { q });
  };
  let deb = 0;
  input.addEventListener('input', () => { window.clearTimeout(deb); deb = window.setTimeout(run, 120); });
  qs('[data-search-form]', root)!.addEventListener('submit', () => rememberSearch(input.value.trim()));

  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const opener = t.closest<HTMLElement>('[data-search-open]');
    if (opener) { e.preventDefault(); renderRecent(); run(); ov.open(opener); return; }
    if (!root.contains(t)) return;
    if (t.closest('[data-search-close]')) ov.close();
    const term = t.closest<HTMLElement>('[data-search-term]');
    if (term) { input.value = term.dataset.searchTerm!; run(); input.focus(); }
    if (t.closest('[data-search-clear]')) { store.remove(RECENT); renderRecent(); }
    if (t.closest('.sres')) rememberSearch(input.value.trim());
  });
  document.addEventListener('keydown', (e) => {
    const typing = /input|textarea|select/i.test((e.target as HTMLElement).tagName) || (e.target as HTMLElement).isContentEditable;
    if (!typing && (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'))) {
      e.preventDefault(); renderRecent(); run(); ov.open();
    }
  });
}
