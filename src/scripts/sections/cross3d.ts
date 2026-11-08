/**
 * HYPSOS CROSS — signature 3D object (Three.js, lazy-loaded).
 * Geometry is extruded directly from the official CROSS_LOGO.ai path (never redrawn).
 * Material: physically-based "ice chrome" (base #B8DEF5) lit by an ice key light and a
 * crimson (#E20A21) rim light — metallic reflections stay physical, no extra UI colour.
 * Falls back to the SVG cross when WebGL is unavailable or reduced motion is requested.
 */
import {
  ACESFilmicToneMapping, Box3, DirectionalLight, ExtrudeGeometry, Group, Mesh, MeshPhysicalMaterial,
  PerspectiveCamera, PMREMGenerator, PointLight, Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import logos from '../../data/generated/logos.json';

export interface CrossHandle {
  setProgress(p: number): void;
  destroy(): void;
}

export function mountCross(host: HTMLElement, { mobile = false, reduced = false } = {}): CrossHandle | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x090303, 0);
  const canvas = renderer.domElement;
  canvas.className = 'cross3d__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;

  // geometry from the official path
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${logos.cross.viewBox}"><path d="${logos.cross.d}"/></svg>`;
  const data = new SVGLoader().parse(svg);
  const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p));
  const geo = new ExtrudeGeometry(shapes, {
    depth: 30,
    bevelEnabled: true,
    bevelThickness: 7,
    bevelSize: 3.2,
    bevelSegments: mobile ? 3 : 6,
    curveSegments: mobile ? 12 : 22,
  });
  geo.center();
  geo.rotateX(Math.PI); // SVG y-down → three y-up, keeps winding
  const mat = new MeshPhysicalMaterial({
    color: 0xb8def5,
    metalness: 1,
    roughness: 0.2,
    clearcoat: 0.8,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.25,
  });
  const mesh = new Mesh(geo, mat);
  const group = new Group();
  group.add(mesh);
  scene.add(group);

  const key = new DirectionalLight(0xb8def5, 2.2);
  key.position.set(-300, 420, 520);
  scene.add(key);
  const rim = new PointLight(0xe20a21, 9, 0, 0);
  rim.position.set(380, -120, -260);
  scene.add(rim);
  const rim2 = new PointLight(0xe20a21, 5, 0, 0);
  rim2.position.set(-420, 260, 120);
  scene.add(rim2);

  const box = new Box3().setFromObject(mesh);
  const size = box.getSize(new Vector3());
  const camera = new PerspectiveCamera(32, 1, 1, 6000);

  const fit = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const fill = mobile ? 0.6 : 0.62;
    const fovR = (camera.fov * Math.PI) / 180;
    const distH = size.y / 2 / Math.tan(fovR / 2) / fill;
    const distW = size.x / 2 / Math.tan(fovR / 2) / camera.aspect / (mobile ? 0.82 : 0.7);
    camera.position.set(0, 0, Math.max(distH, distW));
    camera.updateProjectionMatrix();
    render();
  };

  // state
  const pointer = { x: 0, y: 0 };
  const rot = { x: -0.08, y: -0.5 };
  let progress = 0;
  let raf = 0;
  let visible = true;
  let t0 = performance.now();
  let firstFrame = false;

  function render() {
    renderer.render(scene, camera);
    if (!firstFrame) { firstFrame = true; host.classList.add('is-3d'); }
  }

  function frame(now: number) {
    raf = 0;
    const t = (now - t0) / 1000;
    const idleY = Math.sin(t * 0.35) * 0.55;
    const idleX = Math.sin(t * 0.27) * 0.08;
    const ty = idleY + pointer.x * 0.6 + progress * Math.PI * 1.1;
    const tx = idleX - pointer.y * 0.28 + progress * 0.25;
    rot.x += (tx - rot.x) * 0.06;
    rot.y += (ty - rot.y) * 0.06;
    group.rotation.set(rot.x, rot.y, 0);
    const s = 1 + progress * 0.35;
    group.scale.setScalar(s);
    group.position.y = Math.sin(t * 0.8) * 6 + progress * 40;
    rim.position.x = 380 * Math.cos(t * 0.4);
    rim.position.z = -260 + 200 * Math.sin(t * 0.4);
    render();
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  const start = () => { if (!raf && !reduced) raf = requestAnimationFrame(frame); };

  const onPointer = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  if (!mobile && !reduced) window.addEventListener('pointermove', onPointer, { passive: true });

  const ro = new ResizeObserver(fit);
  ro.observe(host);
  const io = new IntersectionObserver((en) => {
    visible = en[0].isIntersecting;
    if (visible) start();
  });
  io.observe(host);
  const onVis = () => { if (!document.hidden) start(); };
  document.addEventListener('visibilitychange', onVis);

  fit();
  if (reduced) { group.rotation.set(-0.08, -0.5, 0); render(); }
  else start();

  return {
    setProgress(p: number) {
      progress = p;
      if (reduced) render();
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVis);
      geo.dispose(); mat.dispose(); env.dispose(); pmrem.dispose(); renderer.dispose();
      canvas.remove();
    },
  };
}
