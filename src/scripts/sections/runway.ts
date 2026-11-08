/**
 * <runway-section> — HYPSOS "Try the look".
 * Desktop (≥750px): 3D ring carousel (critically-damped spring, depth blur, perspective toward a horizon).
 * Phone (≤749px): classic diagonal line with staggered per-body springs and "walk-out" trips.
 * Autoplay with progress ticks, drag/swipe/trackpad/keyboard, contextual Drag/View cursor,
 * "View look" popup (FLIP) with numbered pins linked to the "In this look" panel,
 * size pickers (inline on desktop, bottom sheet on phones) and "add full look" → real cart.
 */
import { cart, type AddItem } from '../commerce/cart';
import { S } from '../core/runtime';
import { toast } from '../core/toast';

const K = 95;
const C = 2 * Math.sqrt(K); // critically damped
const TAU = Math.PI * 2;
const RING = { start: 1.15 };
const PHONE = { ax: 0.3, ay: 22, sx: 0.32, sy: 22, sr: 0.76, ex: 0.55, d: 4 };
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const pad = (n: number) => String(n).padStart(2, '0');
const mod = (a: number, n: number) => ((a % n) + n) % n;

interface Body { el: HTMLElement; a: number; w: number; x: number; v: number; g: number; goalPrev: number; trip: boolean; from: number; settled: boolean; blur: number }

class RunwaySection extends HTMLElement {
  private stage!: HTMLElement;
  private actors!: HTMLElement;
  private heroes: HTMLElement[] = [];
  private panels: HTMLElement[] = [];
  private ticks: HTMLButtonElement[] = [];
  private bodies: Body[] = [];
  private live!: HTMLElement;
  private piecesLabel!: HTMLElement;
  private lb!: HTMLElement;
  private lbStage!: HTMLElement;
  private cursorEl: HTMLElement | null = null;
  private autoBtn!: HTMLButtonElement;
  private host: HTMLElement | null = null;

  private n = 0;
  private N = 0;
  private index = 0;
  private target = 0;
  private cur = 0;
  private vel = 0;
  private mode: 'ring' | 'classic' = 'ring';
  private mobile = false;
  private W = 0;
  private H = 0;
  private fs = 1;
  private unit = 120;
  private vh = 0;
  private vw = 0;
  private still = false;
  private raf = 0;
  private lastT = 0;
  private visible = false;
  private first = true;
  private reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  private playing = false;
  private timer = 0;
  private speed = 5000;
  private panelHover = false;
  private zoomed = false;
  private engaged = false;
  private dragging = false;
  private drag: { x: number; y: number; t: number; id: number; samples: { x: number; time: number }[]; active: boolean; dead: boolean } | null = null;
  private suppressUntil = 0;
  private wheelAcc = 0;
  private wheelLock = 0;
  private lbAt = '';
  private cursor = { x: 0, y: 0, tx: 0, ty: 0, raf: 0, on: false };
  private cleanups: (() => void)[] = [];
  private io: IntersectionObserver | null = null;
  private ro: ResizeObserver | null = null;
  private resizeT = 0;

  connectedCallback() {
    if (this.n) return;
    this.stage = this.querySelector('[data-rw-stage]')!;
    this.actors = this.querySelector('[data-rw-actors]')!;
    this.heroes = Array.from(this.querySelectorAll<HTMLElement>('[data-rw-hero]'));
    this.panels = Array.from(this.querySelectorAll<HTMLElement>('[data-rw-panel]'));
    this.ticks = Array.from(this.querySelectorAll<HTMLButtonElement>('[data-rw-tick]'));
    this.live = this.querySelector('[data-rw-live]')!;
    this.piecesLabel = this.querySelector('[data-rw-pieces]')!;
    this.lb = this.querySelector('[data-rw-lb]')!;
    this.lbStage = this.querySelector('[data-rw-lb-stage]')!;
    this.autoBtn = this.querySelector('[data-rw-auto]')!;
    this.speed = Number(this.dataset.speed) || 5000;
    this.style.setProperty('--rw-speed', `${this.speed / 1000}s`);

    const originals = Array.from(this.actors.querySelectorAll<HTMLElement>('[data-rw-model]'));
    this.n = originals.length;
    if (!this.n) return;
    this.N = this.n * Math.ceil(8 / this.n);
    for (let a = this.n; a < this.N; a++) {
      const c = originals[a % this.n].cloneNode(true) as HTMLElement;
      c.dataset.rwClone = '';
      c.dataset.index = String(a);
      c.querySelectorAll('img').forEach((i) => (i.loading = 'lazy'));
      this.actors.appendChild(c);
    }
    const start = this.reduced ? 0 : RING.start;
    this.bodies = Array.from(this.actors.querySelectorAll<HTMLElement>('[data-rw-model]')).map((el, a) => {
      const goal = mod(a, this.N);
      return { el, a, w: 0, x: goal + start, v: 0, g: goal + start, goalPrev: goal, trip: false, from: 0, settled: false, blur: -1 };
    });
    this.cur = -start;
    this.target = 0;

    this.decodeImages();
    this.prepPickers();
    this.measure();
    this.setIndex(0, true);
    this.bind();
    this.probeFeet();
    this.introReveal();
    if (this.dataset.autoplay === 'true' && !this.reduced) this.play(true);
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.raf);
    cancelAnimationFrame(this.cursor.raf);
    clearTimeout(this.timer);
    this.io?.disconnect();
    this.ro?.disconnect();
    this.cleanups.forEach((f) => f());
    this.cleanups = [];
    if (this.host) { this.dockAll(); this.host.remove(); this.host = null; }
  }

  /* ── setup ─────────────────────────────────────────────────────── */
  private decodeImages() {
    this.querySelectorAll<HTMLImageElement>('img[data-model-image]').forEach((img) => this.decodeOne(img));
  }
  private decodeOne(img: HTMLImageElement) {
    const done = () => img.classList.add('is-decoded');
    if (img.decode) img.decode().then(done).catch(() => { if (img.naturalWidth) done(); else img.addEventListener('load', done, { once: true }); });
    else if (img.complete) done();
    else img.addEventListener('load', done, { once: true });
  }

  private prepPickers() {
    this.querySelectorAll<HTMLElement>('[data-rw-card]').forEach((card) => {
      const picker = card.querySelector<HTMLElement>('[data-rw-picker]');
      if (picker) (picker as any)._card = card;
      (card as any)._picker = picker;
      const checked = picker?.querySelector<HTMLInputElement>('input[data-rw-option]:checked');
      if (checked) {
        const v = this.variants(card).find((x) => x.o[0] === checked.value);
        if (v) card.dataset.selected = v.id;
      }
    });
  }

  private bind() {
    const on = <K extends keyof WindowEventMap>(t: Window | Document | HTMLElement, ev: string, fn: any, opts?: any) => {
      t.addEventListener(ev, fn, opts);
      this.cleanups.push(() => t.removeEventListener(ev, fn, opts));
    };
    on(this, 'click', this.onClick);
    on(this, 'click', this.onClickCapture, true);
    on(this, 'change', this.onChange);
    on(this, 'keydown', this.onKey);
    on(this.stage, 'pointerdown', this.onDown);
    on(window, 'pointermove', this.onMove, { passive: true });
    on(window, 'pointerup', this.onUp);
    on(window, 'pointercancel', this.onUp);
    on(this.stage, 'wheel', this.onWheel, { passive: false });
    on(window, 'resize', () => { clearTimeout(this.resizeT); this.resizeT = window.setTimeout(() => this.measure(), 120); });
    on(document, 'visibilitychange', () => { if (!document.hidden) { this.kick(); this.restartBar(); } });

    const panel = this.querySelector<HTMLElement>('.rw__panel')!;
    on(panel, 'pointerenter', (e: PointerEvent) => { if (e.pointerType === 'mouse') this.panelHover = true; });
    on(panel, 'pointerleave', (e: PointerEvent) => { if (e.pointerType === 'mouse') { this.panelHover = false; this.restartBar(); } });
    on(panel, 'pointerover', (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-rw-card]');
      if (card) this.hot(Number(card.dataset.rwCard), false);
    });
    on(panel, 'pointerout', (e: PointerEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-rw-card]');
      if (card && !card.contains(e.relatedTarget as Node)) this.clearHot();
    });

    this.io = new IntersectionObserver((entries) => {
      this.visible = entries[0].isIntersecting;
      if (this.visible) { this.kick(); this.restartBar(); }
    }, { threshold: 0 });
    this.io.observe(this);
    this.ro = new ResizeObserver(() => { clearTimeout(this.resizeT); this.resizeT = window.setTimeout(() => this.measure(), 60); });
    this.ro.observe(this.stage);
    this.initCursor(on);
  }

  private introReveal() {
    this.classList.add('rw--js');
    if (this.reduced) { this.classList.add('is-revealed'); return; }
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      requestAnimationFrame(() => requestAnimationFrame(() => this.classList.add('is-revealed')));
    }, { threshold: 0, rootMargin: '0px 0px -22% 0px' });
    io.observe(this);
    this.cleanups.push(() => io.disconnect());
  }

  /* ── layout ────────────────────────────────────────────────────── */
  private measure() {
    const mobile = window.innerWidth <= 749;
    if (mobile !== this.mobile) {
      this.mobile = mobile;
      if (!mobile) this.dockAll();
      this.bodies.forEach((b) => { b.blur = -1; });
    }
    this.mode = mobile ? 'classic' : 'ring';
    let frameH: number;
    if (mobile) {
      if (!this.vh || window.innerWidth !== this.vw || Math.abs(window.innerHeight - this.vh) >= 160) { this.vh = window.innerHeight; this.vw = window.innerWidth; }
      frameH = this.vh * clamp(109, 50, 120) / 100;
    } else frameH = Math.max(600, window.innerHeight);
    this.style.setProperty('--rw-frame-h', `${Math.round(frameH)}px`);

    const r = this.stage.getBoundingClientRect();
    this.W = r.width;
    this.H = r.height;
    const ring = this.mode === 'ring';
    this.fs = ring ? 1.08 : 1;
    const modelH = ring ? Math.max(200, Math.round((this.H - 34 - 18) / 1.08)) : Math.max(200, Math.round(this.H - (mobile ? 24 : 36) - 18));
    const hx = ring ? 0.5 * this.W : (mobile ? PHONE.ax : 0.4) * this.W;
    const hy = ring ? 34 : mobile ? PHONE.ay : 36;
    this.stage.style.setProperty('--rw-model-h', `${modelH}px`);
    this.stage.style.setProperty('--rw-hx', `${hx}px`);
    this.stage.style.setProperty('--rw-hy', `${hy}px`);
    this.stage.style.setProperty('--rw-fs', String(this.fs));
    this.style.setProperty('--rw-ax', `${((hx / (this.W || 1)) * 100).toFixed(2)}%`);
    this.bodies.forEach((b) => (b.w = b.el.offsetWidth || modelH * 0.5625));
    this.unit = ring ? Math.max(mobile ? 90 : 120, 0.3 * this.W) : Math.max(90, this.W * 0.32 * 1.6);
    this.renderAll();
  }

  private put(b: Body, x: number, bottom: number, scale: number, opacity: number, blur: number, z: number) {
    const half = (b.w * scale) / 2;
    if (x + half < -4 || x - half > this.W + 4) opacity = 0;
    const s = b.el.style;
    s.transform = `translate3d(${x.toFixed(2)}px, ${(-bottom).toFixed(2)}px, 0) translateX(-50%) scale(${scale.toFixed(4)})`;
    s.opacity = opacity.toFixed(3);
    s.zIndex = String(z);
    s.visibility = opacity < 0.01 ? 'hidden' : 'visible';
    s.pointerEvents = opacity < 0.5 ? 'none' : 'auto';
    const bl = Math.round(blur * 10) / 10;
    if (bl !== b.blur) { b.blur = bl; s.filter = bl <= 0.05 ? '' : `blur(${bl}px)`; }
  }

  private renderAll() {
    if (!this.W) return;
    if (this.mode === 'ring') this.renderRing();
    else this.renderClassic();
  }

  private renderRing() {
    const { W, H, fs, N } = this;
    const cx = 0.5 * W;
    const R = (this.mobile ? 0.72 : 0.62) * W;
    const P = (this.mobile ? 1.9 : 1.65) * W;
    const floor = H - 34;
    const horizon = 0.36 * H;
    const step = TAU / N;
    for (const b of this.bodies) {
      let phi = mod((b.a - this.cur) * step, TAU);
      if (phi > Math.PI) phi -= TAU;
      const z = R * (1 - Math.cos(phi));
      const persp = P / (P + z);
      const sl = Math.abs(phi) / step;
      const scale = persp * (1 + (fs - 1) * clamp(1 - sl, 0, 1));
      const x = cx + R * Math.sin(phi) * persp;
      const feet = horizon + (floor - horizon) * persp;
      const blur = sl <= 1 ? 1.8 * sl : Math.min(1.8 + (sl - 1) * 2, 6.5);
      let op = clamp((Math.cos(phi) + 0.55) / 0.3, 0, 1);
      if (this.still && sl < 0.02) op = 0;
      this.put(b, x, H - feet, scale, op, blur, Math.round(scale * 1000));
    }
  }

  private renderClassic() {
    const { W } = this;
    for (const b of this.bodies) {
      const goal = mod(b.a - this.target, this.N);
      let k = b.x;
      let e = -1;
      if (b.trip) {
        const span = Math.abs(goal - b.from) || 1;
        const u = clamp(Math.abs(b.x - b.from) / span, 0, 1);
        if (goal > b.from) { if (u < 0.5) e = 2 * u * 1.4; else k = goal + 2 * (1 - u); }
        else { if (u < 0.5) k = b.from + 2 * u; else e = 2 * (1 - u) * 1.4; }
      } else if (k < 0) e = Math.min(-k, 1.4);
      if (e >= 0) {
        this.put(b, W * (PHONE.ax - PHONE.ex * e), PHONE.ay - 22 * e, 1 + 0.14 * e, Math.max(0, 1 - 1.05 * e), 4 * Math.min(e, 1), 1100);
      } else {
        let op = k <= PHONE.d - 1 ? 1 - 0.13 * k : Math.max(0, 0.61 * (PHONE.d - k));
        if (this.still && Math.abs(k) < 0.02) op = 0;
        this.put(b, W * (PHONE.ax + PHONE.sx * k), PHONE.ay + PHONE.sy * k, Math.pow(PHONE.sr, k), op, Math.min(0.9 * Math.max(k, 0), 3.2), 1000 - Math.round(10 * k));
      }
    }
  }

  /* ── loop ──────────────────────────────────────────────────────── */
  private kick() {
    if (this.raf || !this.visible || document.hidden) return;
    this.lastT = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  private tick = (t: number) => {
    this.raf = 0;
    const dt = this.lastT ? Math.min(0.034, (t - this.lastT) / 1000) : 1 / 60;
    this.lastT = t;
    let moving = false;
    if (this.mode === 'ring') {
      if (this.reduced) { this.cur = this.target; this.vel = 0; }
      else {
        const h = dt / 3;
        for (let i = 0; i < 3; i++) {
          const acc = -K * (this.cur - this.target) - C * this.vel;
          this.vel += acc * h;
          this.cur += this.vel * h;
        }
      }
      if (Math.abs(this.cur - this.target) <= 0.0005 && Math.abs(this.vel) <= 0.0005) { this.cur = this.target; this.vel = 0; }
      else moving = true;
    } else {
      for (const b of this.bodies) {
        const goal = mod(b.a - this.target, this.N);
        if (Math.abs(goal - b.goalPrev) > this.N / 2) { b.trip = true; b.from = b.x; b.g = goal; }
        b.goalPrev = goal;
        if (this.reduced) { b.x = b.g = goal; b.v = 0; b.trip = false; continue; }
        const tau = this.dragging ? 0.016 : b.trip ? 0.1 : 0.03 + 0.04 * Math.min(goal, 4);
        b.g += (goal - b.g) * (1 - Math.exp(-dt / tau));
        const h = dt / 3;
        for (let i = 0; i < 3; i++) {
          const acc = -K * (b.x - b.g) - C * b.v;
          b.v += acc * h;
          b.x += b.v * h;
        }
        if (b.trip && Math.abs(b.x - goal) < 0.02) b.trip = false;
        const settled = Math.abs(b.x - b.g) < 0.0006 && Math.abs(b.v) < 0.0006 && Math.abs(b.g - goal) < 0.0006;
        if (settled) { b.x = b.g = goal; b.v = 0; b.trip = false; } else moving = true;
      }
      this.cur = this.target;
    }
    if (moving || this.dragging) {
      this.setStill(false);
      this.renderAll();
      this.raf = requestAnimationFrame(this.tick);
    } else {
      this.lastT = 0;
      this.setStill(true);
      this.renderAll();
    }
  };

  private setStill(on: boolean) {
    if (on === this.still) return;
    this.still = on;
    this.classList.toggle('rw--still', on);
  }

  /* ── index / navigation ────────────────────────────────────────── */
  private rank(b: Body) {
    const T = Math.round(this.target);
    if (this.mode === 'ring') {
      let k = mod(b.a - T, this.N);
      if (k > this.N / 2) k -= this.N;
      return k;
    }
    return mod(b.a - T, this.N);
  }

  private setIndex(i: number, silent = false) {
    i = mod(i, this.n);
    const lim = this.mode === 'ring' ? 2 : 3;
    for (const b of this.bodies) {
      const k = this.rank(b);
      const reach = k !== 0 && Math.abs(k) <= lim;
      const hit = b.el.querySelector<HTMLButtonElement>('.rw__hit');
      if (hit) hit.tabIndex = reach ? 0 : -1;
      if (reach) b.el.removeAttribute('aria-hidden'); else b.el.setAttribute('aria-hidden', 'true');
    }
    if (i === this.index && !this.first) { this.kick(); return; }
    const prev = this.index;
    this.index = i;
    this.closePopup();
    if (this.mobile) this.dockAll();
    this.style.setProperty('--rw-progress', ((i + 1) / this.n).toFixed(3));
    this.heroes.forEach((h, j) => {
      h.classList.toggle('is-on', j === i);
      h.classList.toggle('was', j === prev && j !== i);
      h.setAttribute('aria-hidden', String(j !== i));
      const z = h.querySelector<HTMLButtonElement>('[data-rw-zoom]');
      if (z) z.tabIndex = j === i ? 0 : -1;
    });
    if (!silent && !this.first) {
      if (!this.reduced) { this.stage.classList.remove('is-sweep'); void this.stage.offsetWidth; this.stage.classList.add('is-sweep'); }
      this.live.textContent = this.heroes[i]?.dataset.label ?? '';
    }
    this.ticks.forEach((t, j) => {
      t.setAttribute('aria-current', String(j === i));
      t.classList.toggle('is-past', j < i);
    });
    this.panels.forEach((p, j) => {
      p.hidden = j !== i;
      if (!this.first) p.classList.remove('is-in');
    });
    const panel = this.panels[i];
    if (panel && !this.first) { void panel.offsetWidth; panel.classList.add('is-in'); }
    const tpl = panel?.querySelector('template[data-rw-pieces-text]') as HTMLTemplateElement | null;
    if (tpl && this.piecesLabel) {
      this.piecesLabel.textContent = tpl.innerHTML.trim();
      if (!this.first) { this.piecesLabel.classList.remove('is-swap'); void this.piecesLabel.offsetWidth; this.piecesLabel.classList.add('is-swap'); }
    }
    this.clearHot();
    this.first = false;
    this.restartBar();
    this.kick();
  }

  private moveTo(T: number) {
    this.target = T;
    this.setStill(false);
    this.setIndex(mod(T, this.n));
    this.kick();
  }
  next = () => this.moveTo(Math.round(this.target) + 1);
  prev = () => this.moveTo(Math.round(this.target) - 1);
  go(i: number) {
    let d = mod(i - this.index, this.n);
    if (d > this.n / 2) d -= this.n;
    this.moveTo(Math.round(this.target) + d);
  }

  /* ── autoplay ──────────────────────────────────────────────────── */
  private play(on: boolean) {
    this.playing = on;
    this.classList.toggle('is-playing', on);
    this.autoBtn.classList.toggle('is-playing', on);
    this.autoBtn.setAttribute('aria-pressed', String(on));
    this.restartBar();
  }
  private restartBar() {
    clearTimeout(this.timer);
    this.ticks.forEach((t) => t.classList.remove('is-run'));
    if (!this.playing) return;
    const t = this.ticks[this.index];
    if (t) { void t.offsetWidth; t.classList.add('is-run'); }
    this.timer = window.setTimeout(() => {
      if (this.playing && this.visible && !this.dragging && !document.hidden && !this.panelHover && !this.zoomed && !this.engaged) this.next();
      else this.restartBar();
    }, this.speed);
  }
  private engage() {
    this.engaged = true;
    if (this.playing) this.play(false);
  }

  /* ── pointer / wheel / keys ────────────────────────────────────── */
  private onDown = (e: PointerEvent) => {
    if (this.zoomed) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    this.drag = { x: e.clientX, y: e.clientY, t: this.target, id: e.pointerId, samples: [{ x: e.clientX, time: e.timeStamp }], active: false, dead: false };
  };
  private onMove = (e: PointerEvent) => {
    const d = this.drag;
    if (!d || e.pointerId !== d.id || d.dead) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) { this.onUp(e); return; }
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.active) {
      if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) { d.dead = true; return; }
      if (Math.abs(dx) > 8 && Math.abs(dx) > 1.2 * Math.abs(dy)) {
        d.active = true;
        this.dragging = true;
        this.classList.add('is-dragging');
        try { this.stage.setPointerCapture(e.pointerId); } catch {}
      } else return;
    }
    d.samples.push({ x: e.clientX, time: e.timeStamp });
    if (d.samples.length > 6) d.samples.shift();
    this.target = d.t - dx / this.unit;
    this.setStill(false);
    this.kick();
  };
  private onUp = (e: PointerEvent) => {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    this.drag = null;
    if (!d.active) return;
    this.dragging = false;
    this.classList.remove('is-dragging');
    this.suppressUntil = performance.now() + 60;
    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    const vx = (last.x - first.x) / Math.max(1, last.time - first.time);
    const dx = e.clientX - d.x;
    const from = Math.round(d.t);
    const sign = -1;
    if (this.mobile) {
      if (Math.abs(dx) > 30 || Math.abs(vx) > 0.3) this.moveTo(from + sign * (dx > 0 ? 1 : -1));
      else this.moveTo(from);
      return;
    }
    let i = Math.round(this.target + (sign * vx * 160) / this.unit);
    if (i === from && Math.abs(vx) > 0.3) i = from + (vx < 0 ? 1 : -1);
    i = clamp(i, from - 2, from + 2);
    this.moveTo(i);
  };
  private onWheel = (e: WheelEvent) => {
    if (this.zoomed || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    if (performance.now() < this.wheelLock) return;
    this.wheelAcc += e.deltaX;
    if (Math.abs(this.wheelAcc) > 45) {
      if (this.wheelAcc > 0) this.next(); else this.prev();
      this.wheelAcc = 0;
      this.wheelLock = performance.now() + 520;
    }
  };
  private onKey = (e: KeyboardEvent) => {
    if (e.target === this.stage && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      e.preventDefault();
      if (e.key === 'ArrowRight') this.next(); else this.prev();
      return;
    }
    if (e.key === 'Escape') {
      const open = this.openPickerCard();
      if (open && this.mobile) { this.closePicker(open); open.querySelector<HTMLElement>('[data-rw-add]')?.focus(); return; }
      if (this.zoomed) this.closePopup();
    }
  };

  /* ── clicks ────────────────────────────────────────────────────── */
  private onClickCapture = (e: MouseEvent) => {
    if (performance.now() < this.suppressUntil) { e.stopPropagation(); e.preventDefault(); }
  };
  private onClick = (e: MouseEvent) => {
    const t = e.target as HTMLElement;
    const inPanel = !!t.closest('.rw__panel') || !!t.closest('.rw-sheet-host');
    if (inPanel && t.closest('button, a, input, select, label')) this.engage();
    if (t.closest('[data-rw-pick-close]')) { const c = this.openPickerCard(); if (c) this.closePicker(c); return; }
    if (t.closest('[data-rw-zoom-close]')) { this.closePopup(); return; }
    if (this.zoomed && (t === this.lbStage || t === this.lb)) { this.closePopup(); return; }
    if (t.closest('[data-rw-zoom]')) { this.openPopup(); return; }
    if (t.closest('[data-rw-next]')) { this.next(); return; }
    if (t.closest('[data-rw-prev]')) { this.prev(); return; }
    const tick = t.closest<HTMLElement>('[data-rw-tick]');
    if (tick) { this.go(Number(tick.dataset.rwTick)); return; }
    if (t.closest('[data-rw-auto]')) { if (!this.playing) this.engaged = false; this.play(!this.playing); return; }
    const pin = t.closest<HTMLElement>('[data-rw-pin]');
    if (pin) { this.engage(); this.hot(Number(pin.dataset.rwPin), true); return; }
    const go = t.closest<HTMLElement>('[data-rw-go]');
    if (go) {
      const body = this.bodies.find((b) => b.el.contains(go));
      if (!body) return;
      const k = this.rank(body);
      if (k !== 0 && Math.abs(k) < 6) this.moveTo(Math.round(this.target) + k);
      else if (k === 0) this.openPopup();
      return;
    }
    const confirm = t.closest<HTMLElement>('[data-rw-confirm]');
    if (confirm) { const card = (confirm.closest('[data-rw-picker]') as any)?._card as HTMLElement; if (card) { card.dataset.touched = '1'; this.addCards([card]); } return; }
    const add = t.closest<HTMLButtonElement>('[data-rw-add]');
    if (add) { this.onPlus(add.closest<HTMLElement>('[data-rw-card]')!); return; }
    const all = t.closest<HTMLButtonElement>('[data-rw-all]');
    if (all) { this.addAll(all.closest<HTMLElement>('[data-rw-panel]')!, all); return; }
  };

  private onChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.matches('[data-rw-option]')) return;
    this.engage();
    const card = (input.closest('[data-rw-picker]') as any)?._card as HTMLElement;
    if (card) this.optionChanged(card, true);
  };

  /* ── hot linking (pins ↔ rows) ─────────────────────────────────── */
  private clearHot() {
    this.querySelectorAll('.is-hot').forEach((x) => x.classList.remove('is-hot'));
  }
  private hot(n: number, scroll: boolean) {
    this.clearHot();
    const pinRoot = this.zoomed ? this.lbStage : this.heroes[this.index];
    pinRoot?.querySelector(`[data-rw-pin="${n}"]`)?.classList.add('is-hot');
    const card = this.panels[this.index]?.querySelector<HTMLElement>(`[data-rw-card="${n}"]`);
    if (!card) return;
    card.classList.add('is-hot');
    if (scroll) this.reveal(card);
  }
  private reveal(card: HTMLElement) {
    const list = card.closest<HTMLElement>('.rw__items')!;
    const behavior: ScrollBehavior = this.reduced ? 'auto' : 'smooth';
    if (list.scrollWidth > list.clientWidth + 2) {
      list.scrollTo({ left: card.getBoundingClientRect().left - list.getBoundingClientRect().left + list.scrollLeft - 20, behavior });
    } else if (list.scrollHeight > list.clientHeight + 2) {
      list.scrollTo({ top: card.offsetTop - list.offsetTop - 12, behavior });
    } else {
      const r = card.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight - 140) window.scrollBy({ top: r.top - 0.3 * window.innerHeight, behavior });
    }
  }

  /* ── popup ─────────────────────────────────────────────────────── */
  private openPopup() {
    if (this.zoomed) return;
    this.engage();
    this.clearHot();
    const hero = this.heroes[this.index];
    const morph = hero?.querySelector<HTMLElement>('.rw__morph');
    if (!hero || !morph) return;
    const wrap = document.createElement('div');
    wrap.className = 'rw__lb-model';
    Array.from(morph.children).forEach((c) => wrap.appendChild(c.cloneNode(true)));
    wrap.querySelector('[data-rw-zoom]')?.remove();
    wrap.querySelectorAll<HTMLButtonElement>('[data-rw-pin]').forEach((p) => (p.tabIndex = 0));
    const foot = hero.style.getPropertyValue('--rw-foot');
    if (foot) wrap.style.setProperty('--rw-foot', foot);
    this.lbStage.replaceChildren(wrap);
    const word = this.dataset.word || 'Look';
    this.querySelector('[data-rw-lb-kicker]')!.textContent = `${word} ${pad(this.index + 1)}`;
    this.querySelector('[data-rw-lb-name]')!.textContent = hero.dataset.name ?? '';
    const sr = this.lbStage.getBoundingClientRect();
    const h = Math.max(160, Math.min(sr.height, sr.width / 0.5625));
    wrap.style.setProperty('--rw-model-h', `${h}px`);
    wrap.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
      img.loading = 'eager';
      img.sizes = `${Math.round(h * 0.5625)}px`;
      this.decodeOne(img);
    });
    this.zoomed = true;
    this.classList.add('rw--zoom');
    this.lb.setAttribute('aria-hidden', 'false');
    if (!this.reduced) {
      const a = hero.querySelector('.rw__figure')!.getBoundingClientRect();
      const b = wrap.querySelector('.rw__figure')!.getBoundingClientRect();
      const at = `translate3d(${a.left - b.left}px, ${a.bottom - b.bottom}px, 0) scale(${a.height / (b.height || 1)})`;
      this.lbAt = at;
      wrap.style.transition = 'none';
      wrap.style.transformOrigin = '0 100%';
      wrap.style.transform = at;
      void wrap.offsetWidth;
      wrap.style.transition = '';
      wrap.style.transform = '';
    }
    this.querySelector<HTMLElement>('[data-rw-zoom-close]')?.focus({ preventScroll: true });
  }
  private closePopup() {
    if (!this.zoomed) return;
    this.zoomed = false;
    const wrap = this.lbStage.firstElementChild as HTMLElement | null;
    if (wrap && this.lbAt && !this.reduced) wrap.style.transform = this.lbAt;
    const hadFocus = this.lb.contains(document.activeElement);
    this.classList.remove('rw--zoom');
    this.lb.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => { if (!this.zoomed) this.lbStage.replaceChildren(); }, this.reduced ? 0 : 950);
    if (hadFocus) this.stage.focus({ preventScroll: true });
    this.clearHot();
  }

  /* ── pickers ───────────────────────────────────────────────────── */
  private variants(card: HTMLElement): { id: string; a: boolean; q: number | null; o: string[]; p: number }[] {
    const el = card.querySelector('script[data-rw-variants]') ?? ((card as any)._picker as HTMLElement | null)?.querySelector('script[data-rw-variants]');
    try { return JSON.parse(el?.textContent || '[]'); } catch { return []; }
  }
  private openPickerCard(): HTMLElement | null {
    const p = this.host?.querySelector<HTMLElement>('[data-rw-picker]');
    if (p) return (p as any)._card;
    return this.querySelector<HTMLElement>('[data-rw-card].is-picking');
  }
  private onPlus(card: HTMLElement) {
    if (!card || card.classList.contains('is-added') || card.dataset.soldout) return;
    this.engage();
    if (card.dataset.variantId) { this.addCards([card]); return; }
    if (card.classList.contains('is-picking')) this.closePicker(card);
    else this.openPicker(card);
  }
  private ensureHost() {
    if (this.host) return this.host;
    const host = document.createElement('div');
    host.className = 'rw-sheet-host';
    const cs = getComputedStyle(this);
    ['--rw-panel', '--rw-text', '--rw-muted', '--rw-line', '--rw-accent', '--rw-on-accent', '--rw-btn-bg', '--rw-btn-fg', '--rw-pill-radius', '--rw-bar-r', '--rw-pt-size', '--rw-price', '--rw-opt', '--rw-ease', '--rw-ease-sheet', '--rw-ease-spring'].forEach((v) => host.style.setProperty(v, cs.getPropertyValue(v)));
    host.innerHTML = '<button class="rw__pick-scrim" type="button" data-rw-pick-close tabindex="-1" aria-hidden="true"></button>';
    host.addEventListener('click', this.onClick);
    host.addEventListener('change', this.onChange);
    host.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { const c = this.openPickerCard(); if (c) { this.closePicker(c); c.querySelector<HTMLElement>('[data-rw-add]')?.focus(); } }
    });
    document.body.appendChild(host);
    this.host = host;
    return host;
  }
  private openPicker(card: HTMLElement) {
    const picker = (card as any)._picker as HTMLElement | null;
    if (!picker) return;
    if (this.mobile) {
      this.dockAll();
      const host = this.ensureHost();
      host.appendChild(picker);
      picker.hidden = false;
      void host.offsetWidth;
      host.classList.add('is-open');
      this.classList.add('rw--picking');
    } else {
      picker.hidden = false;
      this.reveal(card);
    }
    card.classList.add('is-picking');
    card.querySelector('[data-rw-add]')?.setAttribute('aria-expanded', 'true');
    this.optionChanged(card, false);
    (picker.querySelector<HTMLInputElement>('input[data-rw-option]:checked') ?? picker.querySelector<HTMLInputElement>('input[data-rw-option]'))?.focus({ preventScroll: true });
  }
  private closePicker(card: HTMLElement) {
    const picker = (card as any)._picker as HTMLElement | null;
    if (!picker) return;
    picker.hidden = true;
    if (picker.parentElement !== card) card.appendChild(picker);
    card.classList.remove('is-picking');
    const add = card.querySelector('[data-rw-add]');
    if (add && add.hasAttribute('aria-expanded')) add.setAttribute('aria-expanded', 'false');
    if (this.host && !this.host.querySelector('[data-rw-picker]')) { this.host.classList.remove('is-open'); this.classList.remove('rw--picking'); }
  }
  private dockAll() {
    this.querySelectorAll<HTMLElement>('[data-rw-card].is-picking').forEach((c) => this.closePicker(c));
    this.host?.querySelectorAll<HTMLElement>('[data-rw-picker]').forEach((p) => { const c = (p as any)._card; if (c) this.closePicker(c); });
  }
  private optionChanged(card: HTMLElement, user: boolean) {
    const picker = (card as any)._picker as HTMLElement | null;
    if (!picker) return;
    const vs = this.variants(card);
    const sel = picker.querySelector<HTMLInputElement>('input[data-rw-option]:checked')?.value;
    picker.querySelectorAll<HTMLInputElement>('input[data-rw-option]').forEach((inp) => {
      inp.closest('.rw__pill')?.classList.toggle('is-unavailable', !vs.some((v) => v.a && v.o[0] === inp.value));
    });
    const match = vs.find((v) => v.o[0] === sel && v.a);
    const confirm = picker.querySelector<HTMLButtonElement>('[data-rw-confirm]');
    const label = picker.querySelector<HTMLElement>('[data-rw-confirm-label]');
    if (confirm) confirm.disabled = !match;
    if (label) label.textContent = match ? label.dataset.add! : label.dataset.soldout!;
    if (match) card.dataset.selected = match.id; else delete card.dataset.selected;
    if (user) card.dataset.touched = '1';
  }

  /* ── bag ───────────────────────────────────────────────────────── */
  private items(cards: HTMLElement[]): AddItem[] {
    return cards.map((card) => {
      const id = card.dataset.variantId || card.dataset.selected!;
      const v = this.variants(card).find((x) => x.id === id);
      if (!v || !v.a) throw new Error(S.cart?.unavailable ?? 'Unavailable');
      let names: string[] = [];
      try { names = JSON.parse(card.dataset.optionNames || '[]'); } catch {}
      const ci = Number(card.dataset.ci), si = Number(card.dataset.si);
      const options: { name: string; value: string }[] = [];
      if (ci >= 0 && card.dataset.color) options.push({ name: names[ci], value: card.dataset.color });
      if (si >= 0) options.push({ name: names[si], value: v.o[0] });
      return {
        merchandiseId: v.id,
        quantity: 1,
        snapshot: {
          handle: card.dataset.handle!,
          title: card.dataset.title!,
          variantTitle: options.map((o) => o.value).join(' / '),
          options,
          price: v.p,
          currency: card.dataset.currency || 'EUR',
          image: card.dataset.image ? { src: card.dataset.image, w: 480, h: 600 } : null,
          available: v.a,
          max: v.q,
        },
      };
    });
  }
  private async addCards(cards: HTMLElement[], cta?: HTMLButtonElement) {
    const panel = cards[0]?.closest<HTMLElement>('[data-rw-panel]');
    const msg = panel?.querySelector<HTMLElement>('[data-rw-msg]');
    let items: AddItem[];
    try { items = this.items(cards); } catch (err) { if (msg) msg.textContent = (err as Error).message; return false; }
    cards.forEach((c) => c.classList.add('is-loading'));
    cta?.classList.add('is-loading');
    try {
      await cart().add(items, { source: 'runway', look: cards.length > 1 });
      cards.forEach((c) => this.markAdded(c));
      if (panel) this.checkComplete(panel);
      return true;
    } catch (err) {
      cards.forEach((c) => c.classList.remove('is-loading'));
      if (msg) msg.textContent = (err as Error).message || this.dataset.msgError || '';
      return false;
    } finally {
      cta?.classList.remove('is-loading');
    }
  }
  private markAdded(card: HTMLElement) {
    card.classList.remove('is-loading');
    card.classList.add('is-added');
    this.closePicker(card);
    const add = card.querySelector<HTMLElement>('[data-rw-add]');
    if (add) { add.setAttribute('aria-label', add.dataset.addedLabel || ''); add.removeAttribute('aria-expanded'); }
    if (this.mobile && !this.reduced && 'vibrate' in navigator) { try { navigator.vibrate(12); } catch {} }
  }
  private checkComplete(panel: HTMLElement) {
    const cards = Array.from(panel.querySelectorAll<HTMLElement>('[data-rw-card]')).filter((c) => !c.dataset.soldout);
    if (cards.length >= 2 && cards.every((c) => c.classList.contains('is-added'))) {
      panel.classList.add('is-complete');
      const msg = panel.querySelector<HTMLElement>('[data-rw-msg]');
      if (msg) msg.textContent = '';
    }
  }
  private async addAll(panel: HTMLElement, cta: HTMLButtonElement) {
    if (panel.classList.contains('is-complete') || cta.classList.contains('is-loading')) return;
    this.engage();
    const msg = panel.querySelector<HTMLElement>('[data-rw-msg]')!;
    msg.textContent = '';
    const cards = Array.from(panel.querySelectorAll<HTMLElement>('[data-rw-card]')).filter((c) => !c.classList.contains('is-added') && !c.dataset.soldout);
    const ready = cards.filter((c) => c.dataset.variantId || (c.dataset.touched && c.dataset.selected));
    const pending = cards.filter((c) => !ready.includes(c));
    if (ready.length) await this.addCards(ready, cta);
    if (pending.length) {
      (this.mobile ? pending.slice(0, 1) : pending).forEach((c) => { if (!c.classList.contains('is-picking')) this.openPicker(c); });
      if (!this.mobile) this.reveal(pending[0]);
      msg.textContent = (this.dataset.msgChoose || '').replace('[items]', pending.map((c) => c.dataset.title).join(', '));
    }
  }

  /* ── stage cursor ──────────────────────────────────────────────── */
  private initCursor(on: (t: any, ev: string, fn: any, opts?: any) => void) {
    const el = this.querySelector<HTMLElement>('[data-rw-cursor]');
    if (!el) return;
    if (!this.fine) { el.remove(); return; }
    this.cursorEl = el;
    const k = this.reduced ? 1 : 0.18;
    const loop = () => {
      const c = this.cursor;
      c.x += (c.tx - c.x) * k;
      c.y += (c.ty - c.y) * k;
      el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
      c.raf = Math.hypot(c.tx - c.x, c.ty - c.y) > 0.2 ? requestAnimationFrame(loop) : 0;
    };
    on(this.stage, 'pointermove', (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = this.stage.getBoundingClientRect();
      const c = this.cursor;
      c.tx = e.clientX - r.left;
      c.ty = e.clientY - r.top;
      if (!c.on) { c.x = c.tx; c.y = c.ty; c.on = true; el.classList.add('is-on'); }
      const t = e.target as HTMLElement;
      el.classList.toggle('is-view', !this.dragging && !!t.closest('.rw__hero.is-on .rw__zoom'));
      el.classList.toggle('is-link', !this.dragging && !!t.closest('.rw__pin, .rw__hit'));
      if (!c.raf) c.raf = requestAnimationFrame(loop);
    });
    on(this.stage, 'pointerleave', () => {
      this.cursor.on = false;
      el.classList.remove('is-on', 'is-link', 'is-view');
    });
  }

  /* ── feet detection (real model cut-outs only: data-probe) ─────── */
  private probeFeet() {
    this.heroes.forEach((hero, i) => {
      const src = hero.dataset.probe;
      if (!src) return;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const w = 48;
          const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w));
          const cv = document.createElement('canvas');
          cv.width = w; cv.height = h;
          const ctx = cv.getContext('2d', { willReadFrequently: true })!;
          ctx.drawImage(img, 0, 0, w, h);
          const data = ctx.getImageData(0, 0, w, h).data;
          let last = -1;
          for (let y = h - 1; y >= 0 && last < 0; y--) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 40) { last = y; break; }
          if (last < 0) return;
          const foot = clamp((h - 1 - last) / h, 0, 0.4).toFixed(4);
          hero.style.setProperty('--rw-foot', foot);
          this.bodies.filter((b) => b.a % this.n === i).forEach((b) => b.el.style.setProperty('--rw-foot', foot));
        } catch { /* tainted canvas → keep 0 */ }
      };
      img.src = src;
    });
  }
}

if (!customElements.get('runway-section')) customElements.define('runway-section', RunwaySection);
