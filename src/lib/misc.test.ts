import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { contrast, ground, hexToRgb, ink, luminance, panelSolid } from './palette';
import { depthAt, formatDepth, skyFraction, smoothstep, waterFraction } from './depth';
import { project, settled, stepSpring } from './motion';
import { daysUntil, nextTarget } from './training';

describe('palette', () => {
  it('parses hex and computes WCAG luminance', () => {
    expect(hexToRgb('#FF8000')).toEqual([255, 128, 0]);
    expect(luminance('#FFFFFF')).toBeCloseTo(1, 6);
    expect(contrast('#FFFFFF', '#000000')).toBeCloseTo(21, 6);
  });

  it('every text colour holds AA (4.5:1) on every ground, including the lightest', () => {
    for (const [inkName, fg] of Object.entries(ink)) {
      if (inkName === 'fail') continue;
      for (const [groundName, bg] of Object.entries(ground)) {
        expect(contrast(fg, bg), `${inkName} on ${groundName}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('the failure colour, which is only ever drawn inside a tool panel, holds AA there', () => {
    expect(contrast(ink.fail, panelSolid)).toBeGreaterThanOrEqual(4.5);
    for (const fg of Object.values(ink)) expect(contrast(fg, panelSolid)).toBeGreaterThanOrEqual(4.5);
  });

  it('tokens.css carries exactly these values', () => {
    const css = readFileSync('src/styles/tokens.css', 'utf8').toUpperCase();
    for (const [name, hex] of Object.entries(ground)) expect(css, `--g-${name}`).toContain(`--G-${name.toUpperCase()}: ${hex}`);
    for (const [name, hex] of Object.entries(ink)) expect(css, `--${name}`).toContain(`--${name.toUpperCase()}: ${hex}`);
    expect(css).toContain(`--PANEL-SOLID: ${panelSolid}`);
  });
});

describe('depth', () => {
  const stops = [{ at: 0, depth: 0 }, { at: 1000, depth: -120 }, { at: 2000, depth: 0 }, { at: 3000, depth: 400000 }];
  it('holds the end values outside the range and eases between stops', () => {
    expect(depthAt(stops, -50)).toBe(0);
    expect(depthAt(stops, 5000)).toBe(400000);
    expect(depthAt(stops, 500)).toBeCloseTo(-60, 6);
    expect(depthAt(stops, 1000)).toBe(-120);
    expect(depthAt(stops, 250)).toBeCloseTo(-120 * smoothstep(0.25), 6);
    expect(depthAt([], 10)).toBe(0);
  });
  it('fractions run 0..1 on their own side of the surface', () => {
    expect(waterFraction(-60, -120)).toBeCloseTo(0.5); expect(waterFraction(50, -120)).toBe(0);
    expect(waterFraction(-500, -120)).toBe(1);
    expect(skyFraction(-10, 400000)).toBe(0); expect(skyFraction(400000, 400000)).toBeCloseTo(1);
    expect(skyFraction(30000, 400000)).toBeGreaterThan(0.7);
  });
  it('formats as a zero-padded instrument reading', () => {
    expect(formatDepth(0)).toBe('+000.0 m');
    expect(formatDepth(-18)).toBe('−018.0 m');
    expect(formatDepth(-120.04)).toBe('−120.0 m');
    expect(formatDepth(400000)).toBe('+400.0 km');
    expect(formatDepth(30000)).toBe('+030.0 km');
  });
});

describe('motion', () => {
  it('a critically damped spring reaches the target without overshooting', () => {
    let s = { value: 0, velocity: 0 }, peak = 0;
    for (let i = 0; i < 240; i++) { s = stepSpring(s, 1, 1 / 60, 0.4, 1); peak = Math.max(peak, s.value); }
    expect(peak).toBeLessThanOrEqual(1.0005);
    expect(settled(s, 1)).toBe(true);
  });
  it('an under-damped spring overshoots, and a long frame stays stable', () => {
    let s = { value: 0, velocity: 0 }, peak = 0;
    for (let i = 0; i < 240; i++) { s = stepSpring(s, 1, 1 / 60, 0.4, 0.5); peak = Math.max(peak, s.value); }
    expect(peak).toBeGreaterThan(1.05);
    const big = stepSpring({ value: 0, velocity: 0 }, 1, 0.5, 0.4, 1);
    expect(Number.isFinite(big.value)).toBe(true); expect(Math.abs(big.value - 1)).toBeLessThan(0.2);
  });
  it('re-targeting keeps the current velocity', () => {
    const mid = stepSpring({ value: 0, velocity: 0 }, 1, 0.1, 0.4, 1);
    const turned = stepSpring(mid, 0, 1 / 600, 0.4, 1);
    expect(turned.velocity).toBeGreaterThan(0);
  });
  it('projects a flick forward', () => {
    expect(project(1000)).toBeCloseTo(499, 0);
    expect(project(-1000)).toBeCloseTo(-499, 0);
  });
});

describe('training', () => {
  const rule = { minReps: 8, maxReps: 12, increment: 5 };
  it('adds a rep until the top of the range, then adds weight', () => {
    expect(nextTarget({ weight: 135, reps: 8 }, rule)).toEqual({ weight: 135, reps: 9, addedWeight: false });
    expect(nextTarget({ weight: 135, reps: 12 }, rule)).toEqual({ weight: 140, reps: 8, addedWeight: true });
  });
  it('counts whole days to race day and goes negative afterwards', () => {
    const race = new Date(2027, 1, 7);
    expect(daysUntil(race, new Date(2027, 1, 6, 23, 59))).toBe(1);
    expect(daysUntil(race, new Date(2027, 1, 7, 9))).toBe(0);
    expect(daysUntil(race, new Date(2026, 10, 13))).toBe(86);
    expect(daysUntil(race, new Date(2027, 1, 9))).toBe(-2);
  });
});
