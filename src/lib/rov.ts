// First-pass concept calculations for a small tethered underwater vehicle.
// Hand-calculation formulas only: hydrostatics, a thin-walled tube under external
// pressure, a flat end cap, buoyancy, and quadratic drag. SI units. No DOM knowledge.
// These are sizing estimates, not a validated design.

export const G = 9.80665;           // m/s^2
export const FRESH = 1000;          // kg/m^3 (a sinkhole is fresh water)
export const ATM = 101325;          // Pa

// Cast acrylic, typical room-temperature values. The allowable is the tensile
// strength, which is the conservative choice for a brittle polymer.
export const ACRYLIC = { E: 3.1e9, poisson: 0.37, allowable: 70e6, density: 1190 };

/** Gauge pressure at depth. */
export function pressureAt(depth: number, density = FRESH): number {
  return density * G * Math.max(0, depth);
}

/** Hoop stress in a thin-walled tube under external pressure (compressive). */
export function hoopStress(pressure: number, outerDiameter: number, wall: number): number {
  const mean = outerDiameter - wall;
  return (pressure * mean) / (2 * wall);
}

/** Elastic buckling pressure of a long thin tube under external pressure (Bresse / Bryan). */
export function bucklingPressure(outerDiameter: number, wall: number, E = ACRYLIC.E, poisson = ACRYLIC.poisson): number {
  const mean = outerDiameter - wall;
  return ((2 * E) / (1 - poisson ** 2)) * (wall / mean) ** 3;
}

/** Peak bending stress in a simply supported flat circular end cap under uniform pressure. */
export function endCapStress(pressure: number, radius: number, thickness: number, poisson = ACRYLIC.poisson): number {
  return (3 * (3 + poisson) * pressure * radius ** 2) / (8 * thickness ** 2);
}

export interface HousingSpec { depth: number; outerDiameter: number; wall: number; length: number; capThickness: number }
export interface HousingResult {
  pressure: number; hoop: number; buckling: number; cap: number;
  safetyYield: number; safetyBuckling: number; safetyCap: number;
  governs: 'buckling' | 'yield' | 'end cap'; safety: number;
  crushDepth: number;      // depth at which the governing safety factor reaches 1
  displaced: number;       // m^3
  buoyancy: number;        // N of lift from the housing volume
}

export function housing(s: HousingSpec, density = FRESH): HousingResult {
  const pressure = pressureAt(s.depth, density);
  const hoop = hoopStress(pressure, s.outerDiameter, s.wall);
  const buckling = bucklingPressure(s.outerDiameter, s.wall);
  const cap = endCapStress(pressure, s.outerDiameter / 2, s.capThickness);
  const safetyYield = hoop > 0 ? ACRYLIC.allowable / hoop : Infinity;
  const safetyBuckling = pressure > 0 ? buckling / pressure : Infinity;
  const safetyCap = cap > 0 ? ACRYLIC.allowable / cap : Infinity;
  const safety = Math.min(safetyYield, safetyBuckling, safetyCap);
  const governs = safety === safetyBuckling ? 'buckling' : safety === safetyYield ? 'yield' : 'end cap';
  const displaced = Math.PI * (s.outerDiameter / 2) ** 2 * s.length;
  // Every check is linear in pressure, so the limiting depth scales with the safety factor.
  const crushDepth = Number.isFinite(safety) ? s.depth * safety : Infinity;
  return {
    pressure, hoop, buckling, cap, safetyYield, safetyBuckling, safetyCap, governs, safety,
    crushDepth, displaced, buoyancy: density * G * displaced,
  };
}

/** Net lift in newtons (positive floats) and the ballast mass, weighed in air, that trims it to neutral. */
export function trim(displacedVolume: number, mass: number, density = FRESH, ballastDensity = 7850) {
  const net = (density * displacedVolume - mass) * G;
  // Ballast displaces water too: effective weight per kg = g (1 - rho_water / rho_ballast).
  const ballast = net > 0 ? net / (G * (1 - density / ballastDensity)) : 0;
  return { net, ballast, floats: net > 0 };
}

/** Quadratic drag on a bluff body. */
export function drag(speed: number, frontalArea: number, cd: number, density = FRESH): number {
  return 0.5 * density * cd * frontalArea * speed ** 2;
}

/** Cross-flow drag on a tether of given diameter and wetted length (cylinder, Cd about 1.2). */
export function tetherDrag(current: number, diameter: number, length: number, density = FRESH, cd = 1.2): number {
  return 0.5 * density * cd * diameter * length * current ** 2;
}

/** Power delivered to the water to hold a speed against a drag force. */
export function thrustPower(force: number, speed: number): number { return force * speed; }
