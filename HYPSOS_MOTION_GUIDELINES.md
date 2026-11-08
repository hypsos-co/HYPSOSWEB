# HYPSOS — Motion Guidelines

Motion has intention: it **elevates** (things rise, reveal upward, turn toward the viewer). Never decoration for its own sake, never scroll-jacking.

Stack: **CSS transitions/keyframes** (default) · **IntersectionObserver** (reveals) · **GSAP 3 + ScrollTrigger** (scrubbed scenes, home only) · **Three.js** (3D cross, lazy) · **SVG filters** (displacement) · **cross-document View Transitions** (page changes). No smooth-scroll library: native scroll is preserved.

## 1. Tokens (`src/styles/tokens.css`)

| Token | Value | Use |
|---|---|---|
| `--motion-fast` | 180ms | Colour/border feedback |
| `--motion-medium` | 400ms | Buttons, chips, small UI |
| `--motion-slow` | 750ms | Drawers, menus, mask reveals |
| `--motion-editorial` | 1100ms | Editorial reveals, headline rises |
| `--ease-standard` | `cubic-bezier(.22,1,.36,1)` | Default — long silky deceleration |
| `--ease-smooth` | `cubic-bezier(.65,0,.35,1)` | Symmetric (sweeps, bars) |
| `--ease-expressive` | `cubic-bezier(.76,0,.24,1)` | Curtains, clip-path wipes, drawers |
| `--ease-spring` | `cubic-bezier(.34,1.56,.64,1)` | Pins, chips, toggles (overshoot) |
| `--ease-sheet` | `cubic-bezier(.32,.72,0,1)` | Bottom sheets |

## 2. Library

| Effect | How | Where |
|---|---|---|
| Word mask rise | `data-split` → words in masks, staggered (`motion/reveal.ts`) | Section titles |
| Fade / scale / mask reveals | `data-reveal="fade|scale|mask|mask-x"`, `--d` delay | Cards, tiles, frames |
| Brand entry | Cross wipes up, wordmark wipes right, crimson bar, panel lifts (≤ 2.2s, once per session, skippable, Esc/any key skips) | `home/BrandEntry.astro` |
| Hero entrance | Title words rise from masks; labels/CTA fade-rise | `home/Hero.astro` |
| Hero scroll | Title drifts down & fades; 3D cross turns ~200° and scales | `pages/home.ts` |
| Statement | Lines slide in from alternating sides while tracking tightens (scrub) | Manifesto |
| Parallax | `data-parallax="±n"` yPercent scrub inside masked tiles | Collection |
| Liquid displacement | `feTurbulence + feDisplacementMap` pulse on hover (desktop) | Collection tiles (`data-liquid`) |
| Pinned garment study | Section pinned for 220% scroll: steps switch, progress ring, front → back crossfade with rotateY | Featured (≥ 900px) |
| Experimental type | Rows drift in opposite directions; warp intensity follows scroll **velocity**; central cross rotates 360° | XType (Crimson section) |
| Story cross | Rises out of a mask and turns on its axis | Story |
| Marquee | CSS infinite translate, pauses on hover | Bands |
| Page transitions | `@view-transition` — old page lifts & fades, new page wipes up | All pages |
| Microinteractions | Light sweep on buttons, arrow nudge, magnetic CTAs (`data-magnetic`), heart pop, chip press, count bump, toast spring | Global |

## 3. The HYPSOS Cross (3D)

`src/scripts/sections/cross3d.ts`

- Geometry: `ExtrudeGeometry` of the **official path** (`logos.json`), bevelled; proportions untouched.
- Material: `MeshPhysicalMaterial` metal (base `#B8DEF5`, roughness .2, clearcoat) with `RoomEnvironment` reflections; **ice** key light + two **crimson** rim lights orbiting slowly. Physical reflections only — no extra UI colour.
- Behaviour: idle sway, pointer tilt (desktop), scroll progress (rotation + scale), floating bob.
- Performance: lazy `import()` on idle; DPR ≤ 1.75 (1.5 mobile); fewer bevel/curve segments on mobile; render loop pauses off-screen and on hidden tabs; skipped on ≤ 2-core devices.
- Fallback: SVG cross with crimson glow (no WebGL, reduced motion renders one static frame).

## 4. Runway ("Try the look") — `<runway-section>`

- **Desktop ring**: 12 bodies (6 looks + clones) on a 3D ring; perspective toward a horizon at 36% height; depth blur (≤ 6.5px); critically damped spring (K 95, C = 2√K) with 3 sub-steps; render loop only while visible.
- **Phone line**: diagonal queue (scale .76^k); each body follows with its own spring and a staggered lag; bodies that wrap "walk out" past the camera and re-enter from the back.
- **Hand-off**: the front body hides when the ring is still and an identical hero (with zoom target) takes its place — invisible swap.
- **Autoplay**: 5s per look, CSS progress fill on the active tick; pauses on panel hover, popup, drag, hidden tab; stops for good once the shopper engages with products.
- **Inputs**: drag/swipe (momentum on desktop, one look per swipe on phones), trackpad horizontal wheel, ← → keys, ticks, arrows, clicking a queued body.
- **Popup**: FLIP grow from the runway position (.95s), pins spring in (stagger 110ms), double halo ripple, glass tooltip; pins ↔ panel rows hot-link both ways.
- **Panel**: row entrance (blur-rise + curtain + media zoom-out), size picker drop, check draw + burst on add, full-look glow on completion.
- **Cursor**: Drag/View ring that follows the pointer with inertia; shrinks to a dot over pins; spreads "DRAG" while dragging. The system cursor stays visible.

## 5. Contextual cursor (global)

`[data-cursor="view|drag|explore|play|add"]` shows a labelled Ice ring (Crimson for add/play) following the pointer with inertia. Desktop fine pointers only; hidden while overlays are open; never hides the system cursor.

## 6. Mobile behaviour

No hover-dependent information; quick add is a visible + button; pinned scenes are unpinned and stacked; runway switches to the line mode with a docked product carousel and bottom sheets; galleries become swipe carousels with dots; lighter WebGL.

## 7. Fallbacks & reduced motion

`prefers-reduced-motion: reduce` → no intro, no scrubbed scenes, no displacement, no autoplay, springs jump to targets, reveals shown immediately, 3D cross renders one static frame, view transitions off, all animation durations neutralised in `base.css`. Content and controls remain fully usable.

## 8. Performance rules

Animate `transform`, `opacity`, `clip-path` and filters on small elements only; scrub with `ScrollTrigger` (`scrub: true`), never set layout properties per frame; pause rAF loops off-screen (IntersectionObserver) and on `visibilitychange`; clean up timelines/observers on disconnect (runway, cross); lazy-load Three.js; images carry width/height to avoid layout shift.
