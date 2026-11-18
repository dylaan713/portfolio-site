import { describe, expect, it } from 'vitest';
import { ACRYLIC, bucklingPressure, drag, endCapStress, G, hoopStress, housing, pressureAt, tetherDrag, thrustPower, trim } from './rov';

describe('rov concept calculations', () => {
  it('fresh water adds about one atmosphere every 10.3 m', () => {
    expect(pressureAt(100)).toBeCloseTo(980665, 6);
    expect(pressureAt(10.33) / 101325).toBeCloseTo(1, 2);
    expect(pressureAt(-5)).toBe(0);
  });

  it('hoop stress follows p·D_mean / 2t', () => {
    expect(hoopStress(1e6, 0.105, 0.005)).toBeCloseTo(1e6 * 0.1 / 0.01, 6); // 10 MPa
  });

  it('buckling pressure follows 2E/(1-nu^2)·(t/D)^3 and rises eightfold when the wall doubles', () => {
    const p = bucklingPressure(0.105, 0.005);
    expect(p).toBeCloseTo((2 * ACRYLIC.E) / (1 - ACRYLIC.poisson ** 2) * (0.005 / 0.1) ** 3, 6);
    const thin = bucklingPressure(0.1 + 0.002, 0.002), thick = bucklingPressure(0.1 + 0.004, 0.004);
    expect(thick / thin).toBeCloseTo(8, 6);
  });

  it('end cap stress scales with (r/t)^2', () => {
    expect(endCapStress(1e6, 0.05, 0.01) / endCapStress(1e6, 0.05, 0.02)).toBeCloseTo(4, 9);
  });

  it('a thin acrylic tube buckles long before the material yields', () => {
    const h = housing({ depth: 100, outerDiameter: 0.105, wall: 0.005, length: 0.3, capThickness: 0.012 });
    expect(h.safetyYield).toBeGreaterThan(5);
    expect(h.safetyBuckling).toBeLessThan(1);
    expect(h.governs).toBe('buckling');
    expect(h.crushDepth).toBeCloseTo(100 * h.safetyBuckling, 9);
  });

  it('the safety factor is exactly 1 at the crush depth', () => {
    const spec = { depth: 40, outerDiameter: 0.11, wall: 0.006, length: 0.3, capThickness: 0.012 };
    const at = housing({ ...spec, depth: housing(spec).crushDepth });
    expect(at.safety).toBeCloseTo(1, 9);
  });

  it('at the surface nothing is loaded', () => {
    const h = housing({ depth: 0, outerDiameter: 0.1, wall: 0.005, length: 0.3, capThickness: 0.01 });
    expect(h.safety).toBe(Infinity); expect(h.pressure).toBe(0);
  });

  it('buoyancy is the weight of displaced water, and ballast accounts for its own displacement', () => {
    const h = housing({ depth: 10, outerDiameter: 0.1, wall: 0.005, length: 0.3, capThickness: 0.01 });
    expect(h.buoyancy).toBeCloseTo(1000 * G * Math.PI * 0.05 ** 2 * 0.3, 9);
    const t = trim(0.004, 3);                 // 4 L displaced, 3 kg vehicle: 1 kg of lift
    expect(t.net).toBeCloseTo(G, 9); expect(t.floats).toBe(true);
    expect(t.ballast).toBeCloseTo(1 / (1 - 1000 / 7850), 9);
    expect(trim(0.002, 3).ballast).toBe(0);
  });

  it('drag is quadratic in speed and power is cubic', () => {
    expect(drag(0.5, 0.04, 1)).toBeCloseTo(5, 9);
    expect(drag(1, 0.04, 1) / drag(0.5, 0.04, 1)).toBeCloseTo(4, 9);
    expect(thrustPower(drag(1, 0.04, 1), 1) / thrustPower(drag(0.5, 0.04, 1), 0.5)).toBeCloseTo(8, 9);
    expect(tetherDrag(0.2, 0.006, 30)).toBeCloseTo(0.5 * 1000 * 1.2 * 0.006 * 30 * 0.04, 9);
  });
});
