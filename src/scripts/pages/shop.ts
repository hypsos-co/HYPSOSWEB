/** Shop / collection filters + sort (client-side, URL-synced, accessible drawer). */
import { escapeHtml, overlay, qs, qsa } from '../core/dom';
import { fmt } from '../core/runtime';

function init(root: HTMLElement) {
  const form = qs<HTMLFormElement>('[data-filter-form]', root)!;
  const drawer = qs('[data-filters]', root)!;
  const grid = qs('[data-grid]', root)!;
  const cells = qsa<HTMLElement>('[data-f-i]', grid);
  const count = qs('[data-count]', root)!;
  const empty = qs('[data-empty]', root)!;
  const badge = qs('[data-filter-badge]', root)!;
  const active = qs('[data-active-filters]', root)!;
  const sortSel = qs<HTMLSelectElement>('[data-sort]', root)!;
  const applyBtn = qs<HTMLButtonElement>('[data-filter-apply]', root)!;
  const openBtn = qs<HTMLButtonElement>('[data-filter-open]', root)!;
  const ov = overlay(drawer, {
    onOpen: () => openBtn.setAttribute('aria-expanded', 'true'),
    onClose: () => openBtn.setAttribute('aria-expanded', 'false'),
  });
  const parse = (s?: string) => { try { return JSON.parse(s || '[]') as string[]; } catch { return []; } };
  const label = (n: number) => (n === 1 ? root.dataset.countOne! : fmt(root.dataset.countMany!, { n }));

  const state = () => {
    const fd = new FormData(form);
    return {
      size: fd.getAll('size') as string[],
      color: fd.getAll('color') as string[],
      type: fd.getAll('type') as string[],
      price: fd.getAll('price') as string[],
      avail: fd.get('avail') === '1',
    };
  };
  type S = ReturnType<typeof state>;

  const matches = (c: HTMLElement, s: S) => {
    const sizes = parse(s.avail ? c.dataset.fSizeA : c.dataset.fSize);
    const colors = parse(s.avail ? c.dataset.fColorA : c.dataset.fColor);
    if (s.avail && c.dataset.fAvail !== '1') return false;
    if (s.size.length && !s.size.some((x) => sizes.includes(x))) return false;
    if (s.color.length && !s.color.some((x) => colors.includes(x))) return false;
    if (s.type.length && !s.type.includes(c.dataset.fType || '')) return false;
    if (s.price.length) {
      const p = Number(c.dataset.fPrice);
      if (!s.price.some((r) => { const [a, b] = r.split('-'); return p >= Number(a || 0) && (b === '' || b == null || p <= Number(b)); })) return false;
    }
    return true;
  };

  const sortCells = (mode: string) => {
    const by: Record<string, (a: HTMLElement, b: HTMLElement) => number> = {
      featured: (a, b) => Number(a.dataset.fI) - Number(b.dataset.fI),
      newest: (a, b) => (b.dataset.fDate || '').localeCompare(a.dataset.fDate || ''),
      'price-asc': (a, b) => Number(a.dataset.fPrice) - Number(b.dataset.fPrice),
      'price-desc': (a, b) => Number(b.dataset.fPrice) - Number(a.dataset.fPrice),
      name: (a, b) => (a.dataset.fTitle || '').localeCompare(b.dataset.fTitle || ''),
    };
    cells.slice().sort(by[mode] ?? by.featured).forEach((c) => grid.appendChild(c));
  };

  const syncUrl = (s: S) => {
    const u = new URL(location.href);
    ['size', 'color', 'type', 'price', 'avail', 'sort'].forEach((k) => u.searchParams.delete(k));
    s.size.forEach((v) => u.searchParams.append('size', v));
    s.color.forEach((v) => u.searchParams.append('color', v));
    s.type.forEach((v) => u.searchParams.append('type', v));
    s.price.forEach((v) => u.searchParams.append('price', v));
    if (s.avail) u.searchParams.set('avail', '1');
    if (sortSel.value !== 'featured') u.searchParams.set('sort', sortSel.value);
    history.replaceState(history.state, '', u);
  };

  const preview = () => {
    const s = state();
    const n = cells.filter((c) => matches(c, s)).length;
    applyBtn.textContent = fmt(root.dataset.apply!, { n });
    applyBtn.disabled = n === 0;
  };

  const apply = (sync = true) => {
    const s = state();
    let n = 0;
    cells.forEach((c) => { const ok = matches(c, s); c.hidden = !ok; if (ok) n++; });
    sortCells(sortSel.value);
    count.textContent = label(n);
    empty.hidden = n > 0;
    const total = s.size.length + s.color.length + s.type.length + s.price.length + (s.avail ? 1 : 0);
    badge.hidden = total === 0;
    badge.textContent = String(total);
    const chips: string[] = [];
    (['size', 'color', 'type', 'price'] as const).forEach((k) => s[k].forEach((v) => {
      const lab = form.querySelector<HTMLInputElement>(`input[name="${k}"][value="${CSS.escape(v)}"]`)?.nextElementSibling?.textContent || v;
      chips.push(`<button type="button" class="chip" data-remove-filter="${k}" data-value="${escapeHtml(v)}" aria-label="× ${escapeHtml(lab)}">${escapeHtml(lab)} <span aria-hidden="true">×</span></button>`);
    }));
    if (s.avail) chips.push(`<button type="button" class="chip" data-remove-filter="avail" data-value="1">${escapeHtml(form.querySelector('.fswitch span')?.textContent || '')} <span aria-hidden="true">×</span></button>`);
    active.innerHTML = chips.join('');
    preview();
    if (sync) syncUrl(s);
  };

  // restore from URL
  const params = new URL(location.href).searchParams;
  (['size', 'color', 'type', 'price'] as const).forEach((k) => params.getAll(k).forEach((v) => {
    const input = form.querySelector<HTMLInputElement>(`input[name="${k}"][value="${CSS.escape(v)}"]`);
    if (input) input.checked = true;
  }));
  if (params.get('avail') === '1') (form.elements.namedItem('avail') as HTMLInputElement).checked = true;
  const sort = params.get('sort');
  if (sort && [...sortSel.options].some((o) => o.value === sort)) sortSel.value = sort;
  if ([...params.keys()].length) apply(false);

  form.addEventListener('change', () => (window.matchMedia('(min-width: 750px)').matches ? apply() : preview()));
  sortSel.addEventListener('change', () => apply());
  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-filter-open]')) ov.open(openBtn);
    else if (t.closest('[data-filter-close]')) ov.close();
    else if (t.closest('[data-filter-apply]')) { apply(); ov.close(); }
    else if (t.closest('[data-filter-clear]')) { form.reset(); apply(); }
    const rm = t.closest<HTMLElement>('[data-remove-filter]');
    if (rm) {
      const input = form.querySelector<HTMLInputElement>(`input[name="${rm.dataset.removeFilter}"][value="${CSS.escape(rm.dataset.value || '')}"]`);
      if (input) input.checked = false;
      apply();
    }
  });
}

document.querySelectorAll<HTMLElement>('[data-shop]').forEach(init);
