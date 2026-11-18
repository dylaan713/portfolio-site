import { layout, solveState, trussSummary, trussSvg, type TrussState } from '../../lib/views/truss-view';
import { env } from '../env';
import { bindRange, out, setRange, svgPoint } from './shared';

export function mount(root: HTMLElement): void {
  const body = root.querySelector<HTMLElement>('.tool-body')!;
  const defaults = JSON.parse(body.dataset.defaults!) as Omit<TrussState, 'loadNode'>;
  const tested = Number(body.dataset.tested);
  const state: TrussState = { ...defaults, loadNode: null };
  const svg = root.querySelector<SVGSVGElement>('.truss-svg')!;
  const g = svg.querySelector<SVGGElement>('[data-truss]')!;
  const readout = root.querySelector<HTMLElement>('[data-member-readout]')!;
  const verdict = root.querySelector<HTMLElement>('[data-out="status"]')!;
  let wasFailed = false, dragging = false, grabOffset = 0;

  function render(): void {
    const sol = solveState(state);
    g.innerHTML = trussSvg(state, sol);
    const s = trussSummary(state, sol);
    out(root, 'critical', s.critical);
    out(root, 'criticalKind', `${s.criticalKind}, ${s.sign}`);
    out(root, 'failLoad', s.failLoad);
    out(root, 'margin', `${s.margin} of strength used`);
    out(root, 'status', s.status);
    verdict.classList.toggle('bad', s.failed);
    if (s.failed && !wasFailed && !env.reduce) {
      svg.classList.remove('shake'); void svg.getBoundingClientRect(); svg.classList.add('shake');
      navigator.vibrate?.(30);
    }
    wasFailed = s.failed;
  }

  const load = bindRange(root, 't-load', (v) => { state.load = v; render(); });
  const strength = bindRange(root, 't-strength', (v) => { state.strength = v; render(); });
  const depth = bindRange(root, 't-depth', (v) => { state.depthCm = v; render(); });
  // Keyboard route to moving the load: bottom-chord joints counted out from the wall.
  const nodeRange = bindRange(root, 't-node', (v) => { state.loadNode = state.panels + 1 + v; render(); });
  const syncNodeRange = () => {
    nodeRange.max = String(state.panels);
    const bottom = state.loadNode === null ? state.panels : state.loadNode - (state.panels + 1);
    if (bottom >= 1 && bottom <= state.panels) {
      nodeRange.value = String(bottom);
      const o = root.querySelector('#t-node-out'); if (o) o.textContent = String(bottom);
    }
  };
  const panels = bindRange(root, 't-panels', (v) => { state.panels = v; state.loadNode = null; syncNodeRange(); render(); });
  const radios = [...root.querySelectorAll<HTMLInputElement>('input[name="t-diag"]')];
  radios.forEach((r) => r.addEventListener('change', () => { if (r.checked) { state.diagonals = r.value as TrussState['diagonals']; render(); } }));

  // Drag the arrow: the load follows the pointer 1:1, keeping the offset from where it was grabbed.
  const arrowTop = () => {
    const sol = solveState(state);
    return layout(state).py(sol.model.nodes[sol.loadNode].y * 100) + 10;
  };
  const loadFromY = (y: number) => Math.min(40, Math.max(0, ((y - arrowTop() - 26) / 70) * 40));
  svg.addEventListener('pointerdown', (e) => {
    const t = e.target as Element;
    if (t.closest('[data-handle]')) {
      dragging = true; svg.setPointerCapture(e.pointerId);
      grabOffset = svgPoint(svg, e).y - (arrowTop() + 26 + (state.load / 40) * 70);
      e.preventDefault();
      return;
    }
    const node = t.closest<SVGElement>('[data-node]');
    if (node) { state.loadNode = Number(node.dataset.node); syncNodeRange(); render(); return; }
    const member = t.closest<SVGElement>('[data-member]');
    if (member) readout.textContent = member.dataset.label ?? '';
  });
  svg.addEventListener('pointermove', (e) => {
    if (dragging) { setRange(load, Math.round(loadFromY(svgPoint(svg, e).y - grabOffset) * 10) / 10); return; }
    const hit = (e.target as Element).closest<SVGElement>('[data-member]');
    readout.textContent = hit ? `${hit.dataset.label}` : '';
  });
  const end = () => { dragging = false; };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
  svg.addEventListener('pointerleave', (e) => { if (!dragging && e.pointerType === 'mouse') readout.textContent = ''; });

  root.querySelector('[data-action="tested"]')?.addEventListener('click', () => {
    // Ramp to the tested load so the failure is seen arriving, not just shown.
    const from = Number(load.value), start = performance.now(), dur = env.reduce ? 1 : 900;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setRange(load, Math.round((from + (tested - from) * p) * 10) / 10);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  root.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
    state.loadNode = null; syncNodeRange();
    setRange(strength, defaults.strength); setRange(depth, defaults.depthCm); setRange(panels, defaults.panels);
    radios.forEach((r) => { r.checked = r.value === defaults.diagonals; });
    state.diagonals = defaults.diagonals;
    state.loadNode = null; syncNodeRange();
    setRange(load, defaults.load);
  });
  render();
}
