// Ideal Schmidt (isothermal) analysis of a gamma-type Stirling engine.
// Assumptions: ideal gas, uniform instantaneous pressure, isothermal hot and cold
// spaces, perfect regeneration, sinusoidal volume variation. No DOM knowledge.
// Volumes in any consistent unit; temperatures in kelvin; angles in radians.

export interface StirlingSpec {
  sweptDisplacer: number;   // swept volume of the displacer (expansion side)
  sweptPower: number;       // swept volume of the power piston
  deadHot: number;
  deadCold: number;
  regenerator: number;
  hot: number;              // K
  cold: number;             // K
  phase: number;            // displacer leads the power piston by this angle
  meanPressure: number;     // sets the charge mass
}

export const defaultStirling: StirlingSpec = {
  sweptDisplacer: 1, sweptPower: 1, deadHot: 0.15, deadCold: 0.15, regenerator: 0.2,
  hot: 600, cold: 300, phase: Math.PI / 2, meanPressure: 1,
};

export interface Volumes { hot: number; cold: number; total: number }

export function volumes(s: StirlingSpec, theta: number): Volumes {
  const hot = (s.sweptDisplacer / 2) * (1 - Math.cos(theta)) + s.deadHot;
  const cold = (s.sweptDisplacer / 2) * (1 + Math.cos(theta))
    + (s.sweptPower / 2) * (1 - Math.cos(theta - s.phase)) + s.deadCold;
  return { hot, cold, total: hot + cold + s.regenerator };
}

/** Effective regenerator temperature for a linear temperature profile. */
export function regeneratorTemp(hot: number, cold: number): number {
  return Math.abs(hot - cold) < 1e-9 ? hot : (hot - cold) / Math.log(hot / cold);
}

/** Pressure per unit of (mass × gas constant). */
function pressureFactor(s: StirlingSpec, theta: number): number {
  const v = volumes(s, theta);
  return 1 / (v.hot / s.hot + s.regenerator / regeneratorTemp(s.hot, s.cold) + v.cold / s.cold);
}

export interface CyclePoint { theta: number; volume: number; pressure: number; hot: number; cold: number }
export interface Cycle {
  points: CyclePoint[];
  work: number;           // net indicated work per cycle (pressure × volume units)
  heatIn: number;         // work done by the hot space = heat taken in, for an ideal cycle
  efficiency: number;     // work / heatIn
  carnot: number;         // 1 − Tc/Th
  pressureRatio: number;  // max / min
  massR: number;          // charge implied by the mean pressure
}

export function cycle(s: StirlingSpec, steps = 720): Cycle {
  let sum = 0;
  for (let i = 0; i < steps; i++) sum += pressureFactor(s, (i / steps) * 2 * Math.PI);
  const massR = s.meanPressure / (sum / steps);
  const points: CyclePoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * 2 * Math.PI;
    const v = volumes(s, theta);
    points.push({ theta, volume: v.total, pressure: massR * pressureFactor(s, theta), hot: v.hot, cold: v.cold });
  }
  let work = 0, heatIn = 0, pMax = -Infinity, pMin = Infinity;
  for (let i = 0; i < steps; i++) {
    const a = points[i], b = points[i + 1];
    const p = (a.pressure + b.pressure) / 2;
    work += p * (b.volume - a.volume);
    heatIn += p * (b.hot - a.hot);
    pMax = Math.max(pMax, a.pressure); pMin = Math.min(pMin, a.pressure);
  }
  return {
    points, work, heatIn,
    efficiency: Math.abs(heatIn) > 1e-12 ? work / heatIn : 0,
    carnot: 1 - s.cold / s.hot,
    pressureRatio: pMax / pMin,
    massR,
  };
}

/** Piston positions as fractions of stroke (0..1), for drawing the mechanism. */
export function positions(s: StirlingSpec, theta: number): { displacer: number; power: number } {
  return { displacer: (1 - Math.cos(theta)) / 2, power: (1 - Math.cos(theta - s.phase)) / 2 };
}
