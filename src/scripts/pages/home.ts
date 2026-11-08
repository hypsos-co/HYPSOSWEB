/**
 * HOME — scroll scenes (GSAP + ScrollTrigger). Transform/opacity only, scrubbed, never hijacks scroll.
 * Everything here is skipped under prefers-reduced-motion (static, fully readable fallbacks).
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { finePointer, isMobile, qs, qsa, reducedMotion } from '../core/dom';

gsap.registerPlugin(ScrollTrigger);

const html = document.documentElement;
const reduced = reducedMotion();

/* ── brand entry + hero entrance ───────────────────────────────────── */
function intro() {
  const hero = qs('[data-hero]');
  const introOn = html.classList.contains('intro-on');
  if (hero) {
    if (introOn) hero.style.setProperty('--intro-delay', '1.25s');
    requestAnimationFrame(() => hero.classList.add('is-ready'));
  }
  if (!introOn) return;
  const done = () => {
    html.classList.add('intro-done');
    try { sessionStorage.setItem('hypsos-intro', '1'); } catch {}
  };
  const t = window.setTimeout(done, 2300);
  qs('[data-intro-skip]')?.addEventListener('click', () => { window.clearTimeout(t); hero?.style.setProperty('--intro-delay', '0s'); done(); });
  window.addEventListener('keydown', () => { window.clearTimeout(t); done(); }, { once: true });
}

/* ── signature 3D cross (lazy) ─────────────────────────────────────── */
async function cross() {
  const host = qs('[data-cross3d]');
  if (!host) return;
  const mobile = isMobile();
  const lowPower = (navigator as any).hardwareConcurrency && (navigator as any).hardwareConcurrency <= 2;
  if (lowPower) return; // SVG fallback stays
  const idle = (cb: () => void) => ((window as any).requestIdleCallback ? (window as any).requestIdleCallback(cb, { timeout: 1200 }) : setTimeout(cb, 300));
  idle(async () => {
    try {
      const { mountCross } = await import('../sections/cross3d');
      const handle = mountCross(host, { mobile, reduced });
      if (!handle) return;
      if (!reduced) {
        ScrollTrigger.create({
          trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true,
          onUpdate: (self) => handle.setProgress(self.progress),
        });
      }
    } catch (err) {
      console.warn('[cross3d] fallback to SVG', err);
    }
  });
}

/* ── liquid displacement on editorial tiles (desktop) ──────────────── */
function liquid() {
  if (!finePointer() || reduced) return;
  const tiles = qsa('[data-liquid]');
  if (!tiles.length) return;
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.innerHTML = '<filter id="hx-liquid" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter>';
  document.body.appendChild(svg);
  const map = svg.querySelector('feDisplacementMap')!;
  const turb = svg.querySelector('feTurbulence')!;
  const state = { s: 0, f: 0.012 };
  tiles.forEach((tile) => {
    const img = tile.querySelector('img');
    if (!img) return;
    tile.addEventListener('pointerenter', () => {
      img.style.filter = 'url(#hx-liquid)';
      gsap.killTweensOf(state);
      gsap.timeline({
        onUpdate: () => { map.setAttribute('scale', state.s.toFixed(2)); turb.setAttribute('baseFrequency', `${state.f.toFixed(4)} 0.03`); },
        onComplete: () => { img.style.filter = ''; },
      })
        .fromTo(state, { s: 0, f: 0.008 }, { s: 26, f: 0.016, duration: 0.45, ease: 'power2.out' })
        .to(state, { s: 0, f: 0.012, duration: 0.9, ease: 'power3.out' });
    });
  });
}

/* ── scroll scenes ─────────────────────────────────────────────────── */
function scenes() {
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // hero: title drifts, top labels fade
    gsap.to('[data-hero-title]', { yPercent: 22, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true } });

    // statement: lines slide in from alternating sides, tracking tightens
    qsa('[data-st-line]').forEach((el) => {
      const dir = Number(el.dataset.dir) || 1;
      gsap.fromTo(el, { xPercent: dir * 26, letterSpacing: '0.02em' }, {
        xPercent: 0, letterSpacing: '-0.055em', ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 30%', scrub: 0.6 },
      });
    });

    // parallax media
    qsa<HTMLElement>('[data-parallax]').forEach((img) => {
      const amt = Number(img.dataset.parallax) || 8;
      gsap.fromTo(img, { yPercent: -amt / 2 }, { yPercent: amt / 2, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // experimental type: rows drift, glyph rotates, warp follows scroll velocity
    const xt = qs('[data-xtype]');
    if (xt) {
      qsa<HTMLElement>('[data-xt-row]', xt).forEach((row) => {
        const dir = Number(row.dataset.xtRow);
        gsap.to(row, { xPercent: dir * 16, ease: 'none', scrollTrigger: { trigger: xt, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      gsap.fromTo('[data-xt-cross]', { rotate: -90, scale: 0.6 }, { rotate: 270, scale: 1.25, ease: 'none', scrollTrigger: { trigger: xt, start: 'top bottom', end: 'bottom top', scrub: true } });
      const warp = qs('[data-xt-warp]', xt);
      if (warp) {
        const w = { v: 0, t: 0 };
        const st = ScrollTrigger.create({ trigger: xt, start: 'top bottom', end: 'bottom top', onUpdate: (self) => { w.t = Math.min(70, Math.abs(self.getVelocity()) / 30); } });
        const tick = () => {
          if (!st.isActive) return;
          w.t *= 0.9;
          w.v += (w.t - w.v) * 0.12;
          warp.setAttribute('scale', w.v.toFixed(2));
        };
        gsap.ticker.add(tick);
        return () => gsap.ticker.remove(tick);
      }
    }

    // story: the cross rises out of a mask and turns on its axis
    const sc = qs('[data-story-cross]');
    if (sc) {
      gsap.fromTo(sc, { clipPath: 'inset(100% 0 0 0)', rotateY: -60, y: 60 }, {
        clipPath: 'inset(0% 0 0 0)', rotateY: 0, y: 0, ease: 'none',
        scrollTrigger: { trigger: '[data-story]', start: 'top 85%', end: 'center 55%', scrub: 0.8 },
      });
    }
  });

  // featured garment study — pinned on wide screens only
  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
    const feat = qs('[data-feat]');
    if (!feat) return;
    const steps = qsa('[data-feat-step]', feat);
    const ring = qs<SVGElement>('[data-feat-ring]', feat);
    const front = qs('[data-feat-front]', feat);
    const back = qs('[data-feat-back]', feat);
    let cur = -1;
    ScrollTrigger.create({
      trigger: feat,
      start: 'top top',
      end: '+=220%',
      pin: qs('[data-feat-pin]', feat),
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        const s = Math.min(steps.length - 1, Math.floor(p * steps.length));
        if (s !== cur) { cur = s; steps.forEach((el, i) => el.classList.toggle('is-on', i === s)); }
        ring?.style.setProperty('--p-off', String(1 - p));
        const b = Math.max(0, Math.min(1, (p - 0.62) / 0.14));
        if (front) gsap.set(front, { opacity: 1 - b, scale: 1 + 0.08 * Math.min(p / 0.6, 1), rotateY: b * -14 });
        if (back) gsap.set(back, { opacity: b, scale: 1.08 - 0.06 * b, rotateY: (1 - b) * 14 });
      },
    });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

intro();
cross();
liquid();
scenes();
