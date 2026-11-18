// Pure SVG markup for the truss tool. Used at build time for the no-JS state and
// in the browser on every change, so the two can never disagree.
import { cantilever, critical, failureLoad, solveTruss, type Critical, type Diagonals, type TrussModel } from '../truss';

export interface TrussState {
  spanCm: number; depthCm: number; panels: number; diagonals: Diagonals;
  load: number; strength: number; loadNode: number | null;
}

export interface TrussSolution {
  model: TrussModel; forces: number[]; crit: Critical; failLoad: number; loadNode: number;
}

export function solveState(s: TrussState): TrussSolution {
  const base = cantilever({ span: s.spanCm / 100, depth: s.depthCm / 100, panels: s.panels, diagonals: s.diagonals });
  const tip = base.nodes.length - 1;
  const valid = s.loadNode !== null && s.loadNode > 0 && s.loadNode < base.nodes.length && s.loadNode !== s.panels + 1;
  const loadNode = valid ? (s.loadNode as number) : tip;
  const unit = solveTruss({ ...base, loads: [{ node: loadNode, fx: 0, fy: -1 }] });
  const forces = unit.forces.map((f) => f * s.load);
  return {
    model: { ...base, loads: [{ node: loadNode, fx: 0, fy: -s.load }] },
    forces, crit: critical(forces, s.strength), failLoad: failureLoad(unit.forces, s.strength), loadNode,
  };
}

export const VIEW = { w: 640, h: 360, x0: 62, x1: 588, top: 56, maxDepth: 170 };

export function layout(s: TrussState) {
  const scale = Math.min((VIEW.x1 - VIEW.x0) / s.spanCm, VIEW.maxDepth / s.depthCm);
  const px = (xCm: number) => VIEW.x0 + xCm * scale;
  const py = (yCm: number) => VIEW.top + (s.depthCm - yCm) * scale;
  return { scale, px, py };
}

const f1 = (n: number) => (Math.abs(n) < 0.05 ? '0.0' : n.toFixed(1));

export function trussSvg(s: TrussState, sol: TrussSolution): string {
  const { px, py } = layout(s);
  const { nodes, members } = sol.model;
  const P = (i: number) => ({ x: px(nodes[i].x * 100), y: py(nodes[i].y * 100) });
  const failed = sol.crit.failed;
  let out = '';
  // wall
  const wy0 = py(s.depthCm) - 22, wy1 = py(0) + 22;
  out += `<rect class="t-wall" x="${VIEW.x0 - 22}" y="${wy0}" width="18" height="${wy1 - wy0}" fill="url(#t-hatch)"/>`;
  out += `<line class="t-wall-edge" x1="${VIEW.x0 - 4}" y1="${wy0}" x2="${VIEW.x0 - 4}" y2="${wy1}"/>`;
  // members
  members.forEach((m, i) => {
    const a = P(m.a), b = P(m.b), f = sol.forces[i];
    const ratio = Math.min(1, Math.abs(f) / s.strength);
    const kind = Math.abs(f) < 0.05 ? 'zero' : f > 0 ? 'tension' : 'compression';
    const broke = failed && i === sol.crit.index;
    const cls = `t-member t-${kind}${i === sol.crit.index ? ' t-critical' : ''}${broke ? ' t-broken' : ''}`;
    const label = `${m.kind} member, ${f1(Math.abs(f))} newtons ${kind === 'zero' ? '' : kind}`;
    out += `<line class="${cls}" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke-width="${(2 + ratio * 6).toFixed(2)}"/>`;
    out += `<line class="t-hit" data-member="${i}" data-force="${f.toFixed(3)}" data-kind="${kind}" data-label="${label}" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"/>`;
  });
  // joints
  nodes.forEach((_, i) => {
    const p = P(i);
    const wallNode = i === 0 || i === s.panels + 1;
    const cls = wallNode ? 't-joint t-pinned' : `t-joint t-free${i === sol.loadNode ? ' t-loaded' : ''}`;
    out += `<circle class="${cls}" ${wallNode ? '' : `data-node="${i}"`} cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${wallNode ? 5 : 6}"/>`;
  });
  // critical label
  const cm = members[sol.crit.index];
  if (cm && s.load > 0.05) {
    const a = P(cm.a), b = P(cm.b);
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 12;
    out += `<text class="t-label${failed ? ' t-label-fail' : ''}" x="${mx.toFixed(1)}" y="${my.toFixed(1)}" text-anchor="middle">${f1(Math.abs(sol.crit.force))} N</text>`;
  }
  // load arrow
  const lp = P(sol.loadNode);
  const len = 26 + Math.min(1, s.load / 40) * 70;
  const tipY = lp.y + 10 + len;
  out += `<g class="t-load${failed ? ' t-load-fail' : ''}">`;
  out += `<line x1="${lp.x.toFixed(1)}" y1="${(lp.y + 10).toFixed(1)}" x2="${lp.x.toFixed(1)}" y2="${(tipY - 8).toFixed(1)}"/>`;
  out += `<path d="M${(lp.x - 7).toFixed(1)} ${(tipY - 10).toFixed(1)} L${lp.x.toFixed(1)} ${tipY.toFixed(1)} L${(lp.x + 7).toFixed(1)} ${(tipY - 10).toFixed(1)} Z"/>`;
  out += `<text x="${lp.x.toFixed(1)}" y="${(tipY + 20).toFixed(1)}" text-anchor="middle">${s.load.toFixed(1)} N</text>`;
  out += `<circle class="t-handle" data-handle="load" cx="${lp.x.toFixed(1)}" cy="${tipY.toFixed(1)}" r="20"/>`;
  out += `</g>`;
  return out;
}

export function trussDefs(): string {
  return `<defs><pattern id="t-hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="7" class="t-hatch-line"/></pattern></defs>`;
}

export function trussSummary(s: TrussState, sol: TrussSolution) {
  const m = sol.model.members[sol.crit.index];
  const sign = Math.abs(sol.crit.force) < 0.05 ? 'unloaded' : sol.crit.force > 0 ? 'tension' : 'compression';
  return {
    critical: `${f1(Math.abs(sol.crit.force))} N`,
    criticalKind: m ? `${m.kind} chord`.replace('vertical chord', 'vertical').replace('diagonal chord', 'diagonal') : '',
    sign,
    failLoad: Number.isFinite(sol.failLoad) ? `${sol.failLoad.toFixed(1)} N` : 'none',
    margin: `${Math.round(Math.min(9.99, sol.crit.ratio) * 100)}%`,
    status: sol.crit.failed
      ? `Failed. A ${m?.kind ?? ''} member reached its ${s.strength.toFixed(1)} N strength.`
      : s.load < 0.05 ? 'Unloaded.' : 'Holding. No member has reached its strength.',
    failed: sol.crit.failed,
  };
}
