import { describe, expect, it } from 'vitest';
import { cantilever, critical, failureLoad, solveLinear, solveTruss, type TrussModel } from './truss';

describe('solveLinear', () => {
  it('solves a 3x3 system that needs pivoting', () => {
    const x = solveLinear([[0, 2, 1], [1, 1, 1], [2, 1, 3]], [7, 6, 13]);
    expect(x[0]).toBeCloseTo(1); expect(x[1]).toBeCloseTo(2); expect(x[2]).toBeCloseTo(3);
  });
  it('rejects a singular system', () => {
    expect(() => solveLinear([[1, 2], [2, 4]], [1, 2])).toThrow(/singular/);
  });
});

describe('solveTruss', () => {
  it('matches the textbook two-bar bracket', () => {
    // Wall pins at (0,0) and (0,3); joint at (4,0) carries 10 N down.
    // Horizontal bar: 13.33 N compression. Sloped bar (3-4-5): 16.67 N tension.
    const m: TrussModel = {
      nodes: [{ x: 0, y: 0 }, { x: 0, y: 3 }, { x: 4, y: 0 }],
      members: [{ a: 0, b: 2 }, { a: 1, b: 2 }],
      supports: [{ node: 0, x: true, y: true }, { node: 1, x: true, y: true }],
      loads: [{ node: 2, fx: 0, fy: -10 }],
    };
    const r = solveTruss(m);
    expect(r.forces[0]).toBeCloseTo(-40 / 3, 6);
    expect(r.forces[1]).toBeCloseTo(50 / 3, 6);
  });

  it('matches a simply supported triangle (pin + roller)', () => {
    // Span 2, apex at (1,1), 10 N down at the apex: rafters -7.071, tie +5.
    const m: TrussModel = {
      nodes: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }],
      members: [{ a: 0, b: 2 }, { a: 1, b: 2 }, { a: 0, b: 1 }],
      supports: [{ node: 0, x: true, y: true }, { node: 1, x: false, y: true }],
      loads: [{ node: 2, fx: 0, fy: -10 }],
    };
    const r = solveTruss(m);
    expect(r.forces[0]).toBeCloseTo(-Math.SQRT2 * 5, 6);
    expect(r.forces[1]).toBeCloseTo(-Math.SQRT2 * 5, 6);
    expect(r.forces[2]).toBeCloseTo(5, 6);
    const ry = r.reactions.reduce((s, x) => s + x.ry, 0);
    expect(ry).toBeCloseTo(10, 6);
  });

  it('refuses an indeterminate truss', () => {
    const m: TrussModel = {
      nodes: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
      members: [{ a: 0, b: 1 }],
      supports: [{ node: 0, x: true, y: true }, { node: 1, x: true, y: true }],
      loads: [],
    };
    expect(() => solveTruss(m)).toThrow(/determinate/);
  });
});

describe('cantilever', () => {
  const tipLoad = (spec: Parameters<typeof cantilever>[0], P: number) => {
    const c = cantilever(spec);
    const tip = c.nodes.length - 1; // last bottom-chord node
    return { c, r: solveTruss({ ...c, loads: [{ node: tip, fx: 0, fy: -P }] }) };
  };

  it('is statically determinate for any panel count', () => {
    for (let n = 1; n <= 8; n++) {
      const c = cantilever({ span: 1, depth: 0.3, panels: n, diagonals: 'howe' });
      expect(c.members.length + 4).toBe(2 * c.nodes.length);
    }
  });

  it('puts P·L/h in the root chord, by the method of sections', () => {
    const { c, r } = tipLoad({ span: 0.29, depth: 0.0725, panels: 4, diagonals: 'howe' }, 20.7);
    const top0 = c.members.findIndex((m) => m.kind === 'top');
    expect(r.forces[top0]).toBeCloseTo(20.7 * 0.29 / 0.0725, 6); // 82.8 N tension
    const bottom0 = c.members.findIndex((m) => m.kind === 'bottom');
    expect(r.forces[bottom0]).toBeCloseTo(-20.7 * (0.29 - 0.0725) / 0.0725, 6);
  });

  it('howe diagonals take compression and pratt diagonals take tension', () => {
    for (const d of ['howe', 'pratt'] as const) {
      const { c, r } = tipLoad({ span: 0.29, depth: 0.0725, panels: 4, diagonals: d }, 10);
      c.members.forEach((m, i) => {
        if (m.kind !== 'diagonal') return;
        if (d === 'howe') expect(r.forces[i]).toBeLessThan(0); else expect(r.forces[i]).toBeGreaterThan(0);
        expect(Math.abs(r.forces[i])).toBeCloseTo(10 * Math.SQRT2, 6); // square panels
      });
    }
  });

  it('reactions balance the applied load', () => {
    const { r } = tipLoad({ span: 0.29, depth: 0.05, panels: 5, diagonals: 'pratt' }, 12);
    expect(r.reactions.reduce((s, x) => s + x.ry, 0)).toBeCloseTo(12, 6);
    expect(r.reactions.reduce((s, x) => s + x.rx, 0)).toBeCloseTo(0, 6);
  });

  it('the defaults reproduce the two known numbers: 20.7 N load, 82.8 N member', () => {
    const { r } = tipLoad({ span: 0.29, depth: 0.0725, panels: 4, diagonals: 'howe' }, 1);
    expect(failureLoad(r.forces, 82.8)).toBeCloseTo(20.7, 6);
    const at = tipLoad({ span: 0.29, depth: 0.0725, panels: 4, diagonals: 'howe' }, 20.7);
    const crit = critical(at.r.forces, 82.8);
    expect(crit.failed).toBe(true);
    expect(critical(tipLoad({ span: 0.29, depth: 0.0725, panels: 4, diagonals: 'howe' }, 20.6).r.forces, 82.8).failed).toBe(false);
  });
});
