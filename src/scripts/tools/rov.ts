import { rovDefaults, rovSummary, rovSvg, solveRov, type RovState } from '../../lib/views/rov-view';
import { bindRange, out } from './shared';

export function mount(root: HTMLElement): void {
  const state: RovState = { ...rovDefaults };
  const g = root.querySelector<SVGGElement>('[data-rov]')!;
  const verdict = root.querySelector<HTMLElement>('[data-out="status"]')!;

  function render(): void {
    const sol = solveRov(state);
    const s = rovSummary(state, sol);
    g.innerHTML = rovSvg(state, sol);
    out(root, 'pressure', s.pressure); out(root, 'atm', s.atm); out(root, 'status', s.status); out(root, 'crush', s.crush);
    out(root, 'net', s.net); out(root, 'ballast', s.ballast); out(root, 'drag', s.drag); out(root, 'power', s.power); out(root, 'tether', s.tether);
    verdict.classList.toggle('bad', s.failed);
    s.checks.forEach((c, k) => {
      const li = root.querySelector<HTMLElement>(`[data-check="${k}"]`)!;
      li.classList.toggle('bad', !c.ok); li.classList.toggle('governs', c.governs && state.depth > 0);
      out(li, 'v', c.value);
      li.querySelector<HTMLElement>('.meter-fill')!.style.width = `${c.pct.toFixed(1)}%`;
    });
  }

  bindRange(root, 'r-depth', (v) => { state.depth = v; render(); });
  bindRange(root, 'r-dia', (v) => { state.diameterMm = v; render(); });
  bindRange(root, 'r-wall', (v) => { state.wallMm = v; render(); });
  bindRange(root, 'r-cap', (v) => { state.capMm = v; render(); });
  bindRange(root, 'r-mass', (v) => { state.massKg = v; render(); });
  bindRange(root, 'r-extra', (v) => { state.extraLitres = v; render(); });
  bindRange(root, 'r-speed', (v) => { state.speed = v; render(); });
  render();
}
