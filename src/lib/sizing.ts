// Sizing a rectangular section to a stiffness limit and a strength limit, then
// reporting mass and stock cost. Euler-Bernoulli beam theory, small deflections,
// solid rectangular sections. SI units inside; no DOM knowledge.

export interface Material {
  id: string; name: string;
  E: number;        // Young's modulus, Pa
  yield: number;    // yield strength, Pa
  density: number;  // kg/m^3
  costPerKg: number; // USD, rough stock price for comparison only
}

// Handbook room-temperature values. Costs are rough stock prices, for comparison only.
export const materials: Material[] = [
  { id: 'al6061', name: 'Aluminum 6061-T6', E: 68.9e9, yield: 276e6, density: 2700, costPerKg: 6 },
  { id: 'abs', name: 'ABS plastic', E: 2.3e9, yield: 40e6, density: 1050, costPerKg: 3 },
  { id: 'ti64', name: 'Ti-6Al-4V', E: 113.8e9, yield: 880e6, density: 4430, costPerKg: 60 },
  { id: 'steel', name: 'Mild steel', E: 200e9, yield: 250e6, density: 7850, costPerKg: 2 },
];

export type Support = 'simple-center' | 'cantilever-end';
export interface Part {
  id: string; name: string; support: Support;
  length: number;   // m
  width: number;    // m
  loadShare: number; // fraction of the design load this part carries
  count: number;
}

export interface Sized {
  thickness: number;       // m, the larger of the two requirements
  governs: 'stiffness' | 'strength';
  tStiffness: number; tStrength: number;
  mass: number;            // kg, all copies
  cost: number;            // USD, all copies
  deflection: number;      // m at the chosen thickness
  stress: number;          // Pa at the chosen thickness
}

export const LBF = 4.4482216152605;   // newtons per pound-force
export const LB = 0.45359237;         // kilograms per pound

export function sizePart(part: Part, mat: Material, designLoad: number, deflectionRatio: number, safety: number): Sized {
  const W = designLoad * part.loadShare, L = part.length, b = part.width;
  const limit = L / deflectionRatio;
  // deflection = W L^3 / (k E I), I = b t^3 / 12; bending moment M = W L / m
  const k = part.support === 'simple-center' ? 48 : 3;
  const m = part.support === 'simple-center' ? 4 : 1;
  const tStiffness = Math.cbrt((12 * W * L ** 3) / (k * mat.E * b * limit));
  const M = (W * L) / m;
  const tStrength = Math.sqrt((6 * M * safety) / (b * mat.yield));
  const thickness = Math.max(tStiffness, tStrength);
  const I = (b * thickness ** 3) / 12;
  const mass = mat.density * b * thickness * L * part.count;
  return {
    thickness, tStiffness, tStrength,
    governs: tStiffness >= tStrength ? 'stiffness' : 'strength',
    mass, cost: mass * mat.costPerKg,
    deflection: (W * L ** 3) / (k * mat.E * I),
    stress: (6 * M) / (b * thickness ** 2),
  };
}

export interface Totals { mass: number; cost: number; withinMass: boolean; withinCost: boolean }
export function totals(sized: Sized[], massLimit: number, costLimit: number): Totals {
  const mass = sized.reduce((s, x) => s + x.mass, 0);
  const cost = sized.reduce((s, x) => s + x.cost, 0);
  return { mass, cost, withinMass: mass <= massLimit, withinCost: cost <= costLimit };
}
