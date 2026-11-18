import { describe, expect, it } from 'vitest';
import { cycle, defaultStirling, positions, regeneratorTemp, volumes } from './stirling';

describe('stirling (Schmidt analysis)', () => {
  it('volumes stay positive and total swings by the power piston stroke', () => {
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < 360; i++) {
      const v = volumes(defaultStirling, (i * Math.PI) / 180);
      expect(v.hot).toBeGreaterThan(0); expect(v.cold).toBeGreaterThan(0);
      min = Math.min(min, v.total); max = Math.max(max, v.total);
    }
    expect(max - min).toBeCloseTo(defaultStirling.sweptPower, 3);
  });

  it('regenerator temperature is the log mean, and the limit is continuous', () => {
    expect(regeneratorTemp(600, 300)).toBeCloseTo(300 / Math.log(2), 9);
    expect(regeneratorTemp(400, 400)).toBe(400);
  });

  it('mean pressure matches the requested charge', () => {
    const c = cycle(defaultStirling);
    const mean = c.points.slice(0, -1).reduce((s, p) => s + p.pressure, 0) / (c.points.length - 1);
    expect(mean).toBeCloseTo(defaultStirling.meanPressure, 6);
  });

  it('an ideal Schmidt cycle reaches the Carnot efficiency', () => {
    for (const [hot, cold] of [[600, 300], [900, 300], [450, 320]]) {
      const c = cycle({ ...defaultStirling, hot, cold }, 2880);
      expect(c.work).toBeGreaterThan(0);
      expect(c.efficiency).toBeCloseTo(1 - cold / hot, 3);
      expect(c.carnot).toBeCloseTo(1 - cold / hot, 12);
    }
  });

  it('no temperature difference, no work', () => {
    expect(Math.abs(cycle({ ...defaultStirling, hot: 300, cold: 300 }).work)).toBeLessThan(1e-9);
  });

  it('no phase lead, no work; reversing the phase reverses the work', () => {
    expect(Math.abs(cycle({ ...defaultStirling, phase: 0 }).work)).toBeLessThan(1e-9);
    const f = cycle(defaultStirling).work;
    const r = cycle({ ...defaultStirling, phase: -Math.PI / 2 }).work;
    expect(r).toBeCloseTo(-f, 6);
  });

  it('more dead volume lowers the pressure ratio', () => {
    const tight = cycle({ ...defaultStirling, deadHot: 0.05, deadCold: 0.05, regenerator: 0.05 });
    const loose = cycle({ ...defaultStirling, deadHot: 0.5, deadCold: 0.5, regenerator: 0.5 });
    expect(tight.pressureRatio).toBeGreaterThan(loose.pressureRatio);
  });

  it('positions run 0..1 and the displacer leads by the phase angle', () => {
    expect(positions(defaultStirling, 0).displacer).toBeCloseTo(0);
    expect(positions(defaultStirling, Math.PI).displacer).toBeCloseTo(1);
    expect(positions(defaultStirling, Math.PI / 2).power).toBeCloseTo(0);
  });
});
