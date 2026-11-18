// Pure SVG markup for the Stirling tool: the mechanism at one crank angle, and the
// pressure-volume loop. Shared by the build-time fallback and the browser.
import { positions, type Cycle, type StirlingSpec } from '../stirling';

export const MECH = { w: 640, h: 300, cx: 508, cy: 150, wheel: 84, crank: 34 };
export const PV = { w: 300, h: 220, l: 38, r: 14, t: 14, b: 34 };

const n = (v: number) => v.toFixed(1);

export function mechanismSvg(spec: StirlingSpec, theta: number): string {
  const { displacer, power } = positions(spec, theta);
  const heat = Math.min(1, Math.max(0, (spec.hot - 300) / 600));
  const dx = 58 + displacer * 96;          // displacer left edge
  const pxp = 232 + power * 58;            // power piston left edge
  const pinA = { x: MECH.cx - MECH.crank * Math.cos(theta), y: MECH.cy - MECH.crank * Math.sin(theta) };
  const pinB = { x: MECH.cx - MECH.crank * Math.cos(theta - spec.phase), y: MECH.cy - MECH.crank * Math.sin(theta - spec.phase) };
  let o = '';
  // hot end glow and cold fins
  o += `<rect class="s-hot" x="40" y="58" width="92" height="78" rx="6" style="opacity:${(0.25 + heat * 0.75).toFixed(2)}"/>`;
  for (let i = 0; i < 6; i++) o += `<line class="s-fin" x1="${212 + i * 14}" y1="48" x2="${212 + i * 14}" y2="146"/>`;
  // displacer cylinder
  o += `<rect class="s-cyl" x="46" y="64" width="250" height="66" rx="5"/>`;
  o += `<rect class="s-displacer" data-part="Displacer" x="${n(dx)}" y="70" width="112" height="54" rx="4"/>`;
  o += `<line class="s-rod" x1="${n(dx + 112)}" y1="97" x2="352" y2="97"/>`;
  o += `<line class="s-rod s-conrod" x1="352" y1="97" x2="${n(pinA.x)}" y2="${n(pinA.y)}"/>`;
  // transfer duct and power cylinder
  o += `<path class="s-duct" d="M262 130 V176 H228"/>`;
  o += `<rect class="s-cyl" x="226" y="184" width="104" height="52" rx="5"/>`;
  o += `<rect class="s-piston" data-part="Power piston" x="${n(pxp)}" y="189" width="34" height="42" rx="3"/>`;
  o += `<line class="s-rod" x1="${n(pxp + 34)}" y1="210" x2="372" y2="210"/>`;
  o += `<line class="s-rod s-conrod" x1="372" y1="210" x2="${n(pinB.x)}" y2="${n(pinB.y)}"/>`;
  // flywheel
  o += `<circle class="s-wheel" data-part="Flywheel" cx="${MECH.cx}" cy="${MECH.cy}" r="${MECH.wheel}"/>`;
  o += `<circle class="s-wheel-inner" cx="${MECH.cx}" cy="${MECH.cy}" r="${MECH.wheel - 12}"/>`;
  for (let i = 0; i < 6; i++) {
    const a = theta + (i * Math.PI) / 3;
    o += `<line class="s-spoke" x1="${n(MECH.cx + 12 * Math.cos(a))}" y1="${n(MECH.cy + 12 * Math.sin(a))}" x2="${n(MECH.cx + (MECH.wheel - 12) * Math.cos(a))}" y2="${n(MECH.cy + (MECH.wheel - 12) * Math.sin(a))}"/>`;
  }
  o += `<circle class="s-hub" cx="${MECH.cx}" cy="${MECH.cy}" r="9"/>`;
  o += `<circle class="s-pin" data-part="Crank" cx="${n(pinA.x)}" cy="${n(pinA.y)}" r="5"/>`;
  o += `<circle class="s-pin" cx="${n(pinB.x)}" cy="${n(pinB.y)}" r="5"/>`;
  o += `<text class="s-tag s-tag-hot" x="86" y="158" text-anchor="middle">hot ${Math.round(spec.hot)} K</text>`;
  o += `<text class="s-tag s-tag-cold" x="248" y="38" text-anchor="middle">cold ${Math.round(spec.cold)} K</text>`;
  return o;
}

export function pvGeometry(c: Cycle) {
  let vMin = Infinity, vMax = -Infinity, pMin = Infinity, pMax = -Infinity;
  for (const p of c.points) {
    vMin = Math.min(vMin, p.volume); vMax = Math.max(vMax, p.volume);
    pMin = Math.min(pMin, p.pressure); pMax = Math.max(pMax, p.pressure);
  }
  const padP = (pMax - pMin) * 0.12 || 0.1;
  pMin -= padP; pMax += padP;
  const x = (v: number) => PV.l + ((v - vMin) / (vMax - vMin || 1)) * (PV.w - PV.l - PV.r);
  const y = (p: number) => PV.h - PV.b - ((p - pMin) / (pMax - pMin || 1)) * (PV.h - PV.t - PV.b);
  return { x, y };
}

export function pvSvg(c: Cycle, theta: number): string {
  const g = pvGeometry(c);
  const step = Math.max(1, Math.floor(c.points.length / 180));
  let d = '';
  for (let i = 0; i < c.points.length; i += step) {
    const p = c.points[i];
    d += `${i === 0 ? 'M' : 'L'}${n(g.x(p.volume))} ${n(g.y(p.pressure))}`;
  }
  d += 'Z';
  const idx = Math.round((((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI) * (c.points.length - 1));
  const cur = c.points[idx];
  let o = '';
  o += `<line class="pv-axis" x1="${PV.l}" y1="${PV.t}" x2="${PV.l}" y2="${PV.h - PV.b}"/>`;
  o += `<line class="pv-axis" x1="${PV.l}" y1="${PV.h - PV.b}" x2="${PV.w - PV.r}" y2="${PV.h - PV.b}"/>`;
  o += `<text class="pv-text" x="${PV.l - 10}" y="${PV.t + 4}" text-anchor="end">p</text>`;
  o += `<text class="pv-text" x="${PV.w - PV.r}" y="${PV.h - PV.b + 20}" text-anchor="end">V</text>`;
  o += `<path class="pv-loop${c.work > 1e-9 ? '' : ' pv-flat'}" d="${d}"/>`;
  o += `<circle class="pv-dot" cx="${n(g.x(cur.volume))}" cy="${n(g.y(cur.pressure))}" r="5"/>`;
  return o;
}

export function stirlingSummary(spec: StirlingSpec, c: Cycle) {
  const norm = c.work / (spec.meanPressure * spec.sweptPower);
  return {
    carnot: `${(c.carnot * 100).toFixed(1)}%`,
    ratio: c.pressureRatio.toFixed(2),
    work: norm.toFixed(3),
    phase: `${Math.round((spec.phase * 180) / Math.PI)}°`,
    runs: c.work > 1e-6,
    status: c.work > 1e-6 ? 'Net work out. The loop runs clockwise.' : c.work < -1e-6 ? 'Net work in. This is a heat pump.' : 'No net work. The loop has collapsed to a line.',
  };
}
