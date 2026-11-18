import { describe, expect, it } from 'vitest';
import { LBF, materials, sizePart, totals, type Part } from './sizing';

const al = materials.find((m) => m.id === 'al6061')!;
const abs = materials.find((m) => m.id === 'abs')!;
const ti = materials.find((m) => m.id === 'ti64')!;
const deck: Part = { id: 'deck', name: 'Deck', support: 'simple-center', length: 0.9, width: 0.4, loadShare: 1, count: 1 };
const arm: Part = { id: 'arm', name: 'Arm', support: 'cantilever-end', length: 0.3, width: 0.05, loadShare: 1, count: 1 };
const W = 75 * LBF;

describe('sizing', () => {
  it('75 lbf is 333.6 N', () => { expect(W).toBeCloseTo(333.617, 2); });

  it('the chosen thickness meets both limits, and one of them exactly', () => {
    for (const mat of materials) for (const part of [deck, arm]) {
      const s = sizePart(part, mat, W, 180, 2);
      expect(s.deflection).toBeLessThanOrEqual(part.length / 180 + 1e-12);
      expect(s.stress * 2).toBeLessThanOrEqual(mat.yield + 1e-3);
      const atStiffness = Math.abs(s.deflection - part.length / 180) < 1e-9;
      const atStrength = Math.abs(s.stress * 2 - mat.yield) < 1e-3;
      expect(atStiffness || atStrength).toBe(true);
    }
  });

  it('matches a hand calculation for the aluminum deck', () => {
    // t = cbrt(12 W L^3 / (48 E b L/180))
    const t = Math.cbrt((12 * W * 0.9 ** 3) / (48 * 68.9e9 * 0.4 * (0.9 / 180)));
    const s = sizePart(deck, al, W, 180, 2);
    expect(s.tStiffness).toBeCloseTo(t, 12);
    expect(s.governs).toBe('stiffness');
    expect(s.mass).toBeCloseTo(2700 * 0.4 * s.thickness * 0.9, 9);
  });

  it('a floppy material needs a much thicker section for the same stiffness', () => {
    const a = sizePart(deck, al, W, 180, 2), p = sizePart(deck, abs, W, 180, 2);
    expect(p.thickness / a.thickness).toBeCloseTo(Math.cbrt(al.E / abs.E), 6);
  });

  it('titanium is lighter on strength-governed parts but costs far more', () => {
    const a = sizePart(arm, al, W, 3, 2), t = sizePart(arm, ti, W, 3, 2);
    expect(a.governs).toBe('strength'); expect(t.governs).toBe('strength');
    expect(t.cost).toBeGreaterThan(a.cost * 3);
  });

  it('count multiplies mass and cost; totals compare against limits', () => {
    const one = sizePart({ ...deck, count: 1 }, al, W, 180, 2);
    const two = sizePart({ ...deck, count: 2 }, al, W, 180, 2);
    expect(two.mass).toBeCloseTo(one.mass * 2, 12);
    const t = totals([one, two], one.mass * 3 + 1, 1);
    expect(t.mass).toBeCloseTo(one.mass * 3, 12);
    expect(t.withinMass).toBe(true); expect(t.withinCost).toBe(false);
  });
});
