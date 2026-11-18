import { sizingDefaults, solveSizing, type SizingState } from '../../lib/views/sizing-view';
import { bindRange, out } from './shared';

export function mount(root: HTMLElement): void {
  const state: SizingState = { ...sizingDefaults, choice: { ...sizingDefaults.choice } };

  function render(): void {
    const sol = solveSizing(state);
    for (const r of sol.rows) {
      const el = root.querySelector<HTMLElement>(`[data-part="${r.part.id}"]`)!;
      out(el, 't', r.thicknessMm); out(el, 'g', r.governs); out(el, 'm', r.massLb); out(el, 'c', r.cost);
      el.querySelector<HTMLElement>('[data-thick]')!.style.height = `${Math.min(44, Math.max(3, r.sized.thickness * 1000 * 1.1)).toFixed(1)}px`;
    }
    out(root, 'mass', sol.massLb.toFixed(2)); out(root, 'cost', sol.cost.toFixed(2)); out(root, 'status', sol.status);
    const mass = root.querySelector<HTMLElement>('[data-meter="mass"]')!, cost = root.querySelector<HTMLElement>('[data-meter="cost"]')!;
    mass.classList.toggle('over', !sol.withinMass); cost.classList.toggle('over', !sol.withinCost);
    mass.querySelector<HTMLElement>('.meter-fill')!.style.width = `${sol.massPct.toFixed(1)}%`;
    cost.querySelector<HTMLElement>('.meter-fill')!.style.width = `${sol.costPct.toFixed(1)}%`;
    root.querySelector('[data-out="status"]')!.classList.toggle('bad', !sol.ok);
  }

  root.querySelectorAll<HTMLInputElement>('.mat input').forEach((input) => {
    input.addEventListener('change', () => {
      if (!input.checked) return;
      state.choice[input.name.replace('m-', '')] = input.value; render();
    });
  });
  bindRange(root, 'z-defl', (v) => { state.deflectionRatio = v; render(); }, (v) => `${v.toFixed(0)}`);
  bindRange(root, 'z-sf', (v) => { state.safety = v; render(); });
  bindRange(root, 'z-mass', (v) => { state.massLimitLb = v; render(); });
  bindRange(root, 'z-cost', (v) => { state.costLimit = v; render(); }, (v) => `$${v.toFixed(0)}`);
  render();
}
