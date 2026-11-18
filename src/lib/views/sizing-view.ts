// State, solution and summary for the sizing tool.
import { LB, LBF, materials, sizePart, totals, type Part, type Sized } from '../sizing';

export const parts: Part[] = [
  { id: 'deck', name: 'Deck panel', support: 'simple-center', length: 0.9, width: 0.4, loadShare: 1, count: 1 },
  { id: 'rail', name: 'Side rails', support: 'simple-center', length: 0.9, width: 0.04, loadShare: 0.5, count: 2 },
  { id: 'arm', name: 'Hitch arm', support: 'cantilever-end', length: 0.3, width: 0.05, loadShare: 1, count: 1 },
];

export interface SizingState {
  choice: Record<string, string>;   // part id -> material id
  deflectionRatio: number;          // span / deflection
  safety: number;
  massLimitLb: number; costLimit: number;
}

export const sizingDefaults: SizingState = {
  choice: { deck: 'al6061', rail: 'al6061', arm: 'steel' },
  deflectionRatio: 180, safety: 2, massLimitLb: 30, costLimit: 150,
};

export const DESIGN_LOAD_LB = 75;

export interface SizingRow { part: Part; material: string; sized: Sized; thicknessMm: string; massLb: string; cost: string; governs: string }

export function solveSizing(s: SizingState) {
  const W = DESIGN_LOAD_LB * LBF;
  const rows: SizingRow[] = parts.map((part) => {
    const mat = materials.find((m) => m.id === s.choice[part.id]) ?? materials[0];
    const sized = sizePart(part, mat, W, s.deflectionRatio, s.safety);
    return {
      part, material: mat.name, sized,
      thicknessMm: (sized.thickness * 1000).toFixed(1),
      massLb: (sized.mass / LB).toFixed(2),
      cost: sized.cost.toFixed(2),
      governs: sized.governs,
    };
  });
  const t = totals(rows.map((r) => r.sized), s.massLimitLb * LB, s.costLimit);
  return {
    rows,
    massLb: t.mass / LB, cost: t.cost,
    withinMass: t.withinMass, withinCost: t.withinCost,
    massPct: Math.min(100, (t.mass / LB / s.massLimitLb) * 100),
    costPct: Math.min(100, (t.cost / s.costLimit) * 100),
    status: t.withinMass && t.withinCost ? 'Closes. Inside both limits.'
      : !t.withinMass && !t.withinCost ? 'Over on weight and on cost.'
      : !t.withinMass ? 'Over on weight.' : 'Over on cost.',
    ok: t.withinMass && t.withinCost,
  };
}
