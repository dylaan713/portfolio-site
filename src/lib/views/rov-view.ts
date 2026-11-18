// Pure SVG markup and summary text for the ROV concept study.
import { drag, housing, tetherDrag, thrustPower, trim, ATM, type HousingResult } from '../rov';

export interface RovState {
  depth: number;          // m
  diameterMm: number; wallMm: number; capMm: number; lengthMm: number;
  massKg: number; extraLitres: number;
  speed: number;          // m/s
  areaCm2: number;        // frontal area
}

export const rovDefaults: RovState = {
  depth: 30, diameterMm: 100, wallMm: 6, capMm: 12, lengthMm: 300,
  massKg: 5, extraLitres: 3, speed: 0.5, areaCm2: 500,
};

export const CD = 1.0;            // bluff open-frame vehicle, assumed
export const TETHER_MM = 6;       // typical Ethernet cable

export interface RovSolution {
  h: HousingResult;
  net: number; ballast: number; floats: boolean;
  drag: number; power: number; tether: number;
}

export function solveRov(s: RovState): RovSolution {
  const h = housing({
    depth: s.depth, outerDiameter: s.diameterMm / 1000, wall: s.wallMm / 1000,
    length: s.lengthMm / 1000, capThickness: s.capMm / 1000,
  });
  const t = trim(h.displaced + s.extraLitres / 1000, s.massKg);
  const d = drag(s.speed, s.areaCm2 / 10000, CD);
  return { h, ...t, drag: d, power: thrustPower(d, s.speed), tether: tetherDrag(s.speed, TETHER_MM / 1000, s.depth) };
}

export const RV = { w: 360, h: 300, cx: 180, cy: 150 };
const n = (v: number) => v.toFixed(1);

export function rovSvg(s: RovState, sol: RovSolution): string {
  const failed = sol.h.safety < 1;
  const R = 92;
  const wall = Math.max(3, (s.wallMm / (s.diameterMm / 2)) * R);
  const squeeze = failed ? 0.24 : Math.min(0.06, 0.06 / Math.max(1, sol.h.safety));
  const rx = R * (1 + squeeze), ry = R * (1 - squeeze);
  const load = Math.min(1, s.depth / 300);
  let o = '';
  // pressure arrows
  const count = 16;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const r0 = R + 40 + load * 6, r1 = R + 40 - (10 + load * 22);
    const x0 = RV.cx + Math.cos(a) * r0 * (rx / R), y0 = RV.cy + Math.sin(a) * r0 * (ry / R);
    const x1 = RV.cx + Math.cos(a) * r1 * (rx / R), y1 = RV.cy + Math.sin(a) * r1 * (ry / R);
    o += `<line class="r-arrow" x1="${n(x0)}" y1="${n(y0)}" x2="${n(x1)}" y2="${n(y1)}" style="opacity:${(0.18 + load * 0.75).toFixed(2)}" marker-end="url(#r-head)"/>`;
  }
  o += `<ellipse class="r-tube${failed ? ' r-fail' : ''}" cx="${RV.cx}" cy="${RV.cy}" rx="${n(rx)}" ry="${n(ry)}"/>`;
  o += `<ellipse class="r-bore" cx="${RV.cx}" cy="${RV.cy}" rx="${n(rx - wall)}" ry="${n(ry - wall)}"/>`;
  o += `<rect class="r-board" x="${RV.cx - 34}" y="${RV.cy - 5}" width="68" height="10" rx="2"/>`;
  o += `<circle class="r-part" cx="${RV.cx - 18}" cy="${RV.cy - 16}" r="8"/><rect class="r-part" x="${RV.cx + 4}" y="${RV.cy - 24}" width="22" height="16" rx="2"/>`;
  o += `<text class="r-dim" x="${RV.cx}" y="${RV.h - 10}" text-anchor="middle">tube ${s.diameterMm} mm OD, ${s.wallMm} mm wall</text>`;
  return o;
}

export function rovDefs(): string {
  return `<defs><marker id="r-head" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path class="r-head" d="M0 0 L8 4 L0 8 Z"/></marker></defs>`;
}

const sf = (v: number) => (Number.isFinite(v) ? (v >= 100 ? '99+' : v.toFixed(2)) : 'n/a');
const bar = (v: number) => (Number.isFinite(v) ? Math.min(100, (Math.min(v, 4) / 4) * 100) : 100);

export function rovSummary(s: RovState, sol: RovSolution) {
  const { h } = sol;
  const failed = h.safety < 1;
  return {
    pressure: `${(h.pressure / 1000).toFixed(0)} kPa`,
    atm: `${((h.pressure + ATM) / ATM).toFixed(1)} atm absolute`,
    checks: [
      { name: 'Buckling', value: sf(h.safetyBuckling), pct: bar(h.safetyBuckling), ok: h.safetyBuckling >= 1, governs: h.governs === 'buckling' },
      { name: 'Wall stress', value: sf(h.safetyYield), pct: bar(h.safetyYield), ok: h.safetyYield >= 1, governs: h.governs === 'yield' },
      { name: 'End cap', value: sf(h.safetyCap), pct: bar(h.safetyCap), ok: h.safetyCap >= 1, governs: h.governs === 'end cap' },
    ],
    crush: Number.isFinite(h.crushDepth) ? `${h.crushDepth.toFixed(0)} m` : 'n/a',
    governs: s.depth > 0 ? h.governs : 'nothing yet',
    failed,
    status: s.depth <= 0 ? 'At the surface. Nothing is loaded.'
      : failed ? `Failed by ${h.governs} at ${s.depth.toFixed(0)} m.`
      : `Holding at ${s.depth.toFixed(0)} m. ${h.governs === 'buckling' ? 'Buckling' : h.governs === 'yield' ? 'Wall stress' : 'The end cap'} is the first limit.`,
    net: `${Math.abs(sol.net).toFixed(1)} N ${sol.net > 0.05 ? 'of lift' : sol.net < -0.05 ? 'heavy' : 'neutral'}`,
    ballast: sol.floats ? `${(sol.ballast * 1000).toFixed(0)} g of steel to trim neutral` : 'Needs flotation, not ballast',
    drag: `${sol.drag.toFixed(1)} N`,
    power: `${sol.power.toFixed(1)} W into the water`,
    tether: `${sol.tether.toFixed(1)} N on ${s.depth.toFixed(0)} m of tether`,
  };
}
