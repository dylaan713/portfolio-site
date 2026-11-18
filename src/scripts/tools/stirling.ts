import { cycle, defaultStirling, type Cycle, type StirlingSpec } from '../../lib/stirling';
import { MECH, mechanismSvg, pvSvg, stirlingSummary } from '../../lib/views/stirling-view';
import { env } from '../env';
import { bindRange, out, svgPoint } from './shared';

export function mount(root: HTMLElement): void {
  const spec: StirlingSpec = { ...defaultStirling };
  const svg = root.querySelector<SVGSVGElement>('.stirling-svg')!;
  const mech = svg.querySelector<SVGGElement>('[data-mech]')!;
  const pv = root.querySelector<SVGGElement>('[data-pv]')!;
  const partOut = root.querySelector<HTMLElement>('[data-part-readout]')!;
  let c: Cycle = cycle(spec);
  let theta = 0.9, omega = 0, runSpeed = 0, dragging = false, visible = false, raf = 0;
  let lastAngle = 0, lastTime = 0, history: { a: number; t: number }[] = [];

  function recompute(): void {
    c = cycle(spec);
    const s = stirlingSummary(spec, c);
    out(root, 'carnot', s.carnot); out(root, 'work', s.work); out(root, 'ratio', s.ratio); out(root, 'status', s.status);
    // Illustrative only: more work per cycle spins it faster; reversed work spins it backward.
    const norm = c.work / (spec.meanPressure * spec.sweptPower);
    runSpeed = Math.max(-6, Math.min(6, norm * 16));
    draw();
    wake();
  }
  function draw(): void {
    mech.innerHTML = mechanismSvg(spec, theta);
    pv.innerHTML = pvSvg(c, theta);
  }

  bindRange(root, 's-hot', (v) => { spec.hot = Math.max(v, 1); recompute(); });
  bindRange(root, 's-cold', (v) => { spec.cold = Math.max(v, 1); recompute(); });
  bindRange(root, 's-phase', (v) => { spec.phase = (v * Math.PI) / 180; recompute(); });

  const angleOf = (e: PointerEvent) => { const p = svgPoint(svg, e); return Math.atan2(p.y - MECH.cy, p.x - MECH.cx); };
  svg.addEventListener('pointerdown', (e) => {
    const named = (e.target as Element).closest<SVGElement>('[data-part]');
    if (named) partOut.textContent = named.dataset.part!;
    if (!(e.target as Element).closest('.s-wheel')) return;
    dragging = true; svg.classList.add('grabbing'); svg.setPointerCapture(e.pointerId);
    lastAngle = angleOf(e); lastTime = performance.now(); history = [{ a: 0, t: lastTime }]; omega = 0;
    e.preventDefault(); wake();
  });
  svg.addEventListener('pointermove', (e) => {
    if (dragging) {
      const a = angleOf(e);
      let d = a - lastAngle;
      if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
      theta += d; lastAngle = a;
      const now = performance.now();
      history.push({ a: d, t: now }); if (history.length > 6) history.shift();
      draw();
      return;
    }
    const part = (e.target as Element).closest<SVGElement>('[data-part]');
    partOut.textContent = part ? part.dataset.part! : '';
  });
  const release = () => {
    if (!dragging) return;
    dragging = false; svg.classList.remove('grabbing');
    // Hand the flick's velocity to the flywheel so there is no seam at release.
    const span = (history[history.length - 1].t - history[0].t) / 1000;
    const turned = history.slice(1).reduce((s, h) => s + h.a, 0);
    omega = span > 0.01 ? Math.max(-40, Math.min(40, turned / span)) : 0;
    wake();
  };
  svg.addEventListener('pointerup', release);
  svg.addEventListener('pointercancel', release);
  svg.addEventListener('pointerleave', () => { if (!dragging) partOut.textContent = ''; });

  let prev = performance.now();
  function tick(now: number): void {
    raf = 0;
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    if (!dragging) {
      omega += (runSpeed - omega) * Math.min(1, dt * 1.6);
      theta += omega * dt;
      draw();
    }
    if (visible && (dragging || Math.abs(omega) > 0.02 || Math.abs(runSpeed) > 0.02)) wake();
  }
  function wake(): void { if (!raf && visible && !env.reduce) { prev = performance.now(); raf = requestAnimationFrame(tick); } }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); }).observe(root);
  recompute();
}
