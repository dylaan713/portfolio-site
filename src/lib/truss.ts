// Method of joints for statically determinate, pin-jointed plane trusses.
// Equilibrium at every joint is assembled into one linear system (member forces
// plus support reactions as unknowns) and solved by Gaussian elimination.
// No DOM knowledge. Forces are positive in tension.

export interface TNode { x: number; y: number }
export interface TMember { a: number; b: number; kind?: MemberKind }
export interface TSupport { node: number; x: boolean; y: boolean }
export interface TLoad { node: number; fx: number; fy: number }
export type MemberKind = 'top' | 'bottom' | 'vertical' | 'diagonal';
export interface TrussModel { nodes: TNode[]; members: TMember[]; supports: TSupport[]; loads: TLoad[] }
export interface Reaction { node: number; rx: number; ry: number }
export interface TrussResult { forces: number[]; reactions: Reaction[] }

/** Solve A·x = b in place with partial pivoting. Throws if singular. */
export function solveLinear(A: number[][], b: number[]): number[] {
  const n = b.length;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (Math.abs(A[p][c]) < 1e-10) throw new Error('singular: the truss is a mechanism or badly supported');
    if (p !== c) { [A[p], A[c]] = [A[c], A[p]]; [b[p], b[c]] = [b[c], b[p]]; }
    for (let r = c + 1; r < n; r++) {
      const f = A[r][c] / A[c][c];
      if (f === 0) continue;
      for (let k = c; k < n; k++) A[r][k] -= f * A[c][k];
      b[r] -= f * b[c];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r];
    for (let k = r + 1; k < n; k++) s -= A[r][k] * x[k];
    x[r] = s / A[r][r];
  }
  return x;
}

export function solveTruss(model: TrussModel): TrussResult {
  const { nodes, members, supports, loads } = model;
  const reactionSlots: { node: number; dir: 'x' | 'y' }[] = [];
  for (const s of supports) {
    if (s.x) reactionSlots.push({ node: s.node, dir: 'x' });
    if (s.y) reactionSlots.push({ node: s.node, dir: 'y' });
  }
  const unknowns = members.length + reactionSlots.length;
  const equations = nodes.length * 2;
  if (unknowns !== equations) {
    throw new Error(`not statically determinate: ${members.length} members + ${reactionSlots.length} reactions != 2 x ${nodes.length} joints`);
  }
  const A: number[][] = Array.from({ length: equations }, () => new Array<number>(unknowns).fill(0));
  const b = new Array<number>(equations).fill(0);
  members.forEach((m, j) => {
    const dx = nodes[m.b].x - nodes[m.a].x;
    const dy = nodes[m.b].y - nodes[m.a].y;
    const len = Math.hypot(dx, dy);
    if (len === 0) throw new Error('zero-length member');
    const ux = dx / len, uy = dy / len;
    // A member in tension pulls each joint toward the other end.
    A[2 * m.a][j] += ux; A[2 * m.a + 1][j] += uy;
    A[2 * m.b][j] -= ux; A[2 * m.b + 1][j] -= uy;
  });
  reactionSlots.forEach((r, k) => {
    A[2 * r.node + (r.dir === 'x' ? 0 : 1)][members.length + k] = 1;
  });
  for (const l of loads) { b[2 * l.node] -= l.fx; b[2 * l.node + 1] -= l.fy; }
  const x = solveLinear(A, b);
  const reactions = new Map<number, Reaction>();
  reactionSlots.forEach((r, k) => {
    const cur = reactions.get(r.node) ?? { node: r.node, rx: 0, ry: 0 };
    if (r.dir === 'x') cur.rx = x[members.length + k]; else cur.ry = x[members.length + k];
    reactions.set(r.node, cur);
  });
  return { forces: x.slice(0, members.length), reactions: [...reactions.values()] };
}

export type Diagonals = 'howe' | 'pratt';
export interface CantileverSpec { span: number; depth: number; panels: number; diagonals: Diagonals }

/**
 * A cantilever truss fixed to a wall at x = 0. Node order: top chord left to right
 * (0..panels), then bottom chord left to right. Under a downward load the 'howe'
 * diagonals carry compression and the 'pratt' diagonals carry tension.
 */
export function cantilever(spec: CantileverSpec): Pick<TrussModel, 'nodes' | 'members' | 'supports'> {
  const { span, depth, panels, diagonals } = spec;
  if (panels < 1 || !Number.isInteger(panels)) throw new Error('panels must be a positive integer');
  if (span <= 0 || depth <= 0) throw new Error('span and depth must be positive');
  const w = span / panels;
  const nodes: TNode[] = [];
  for (let i = 0; i <= panels; i++) nodes.push({ x: i * w, y: depth });
  for (let i = 0; i <= panels; i++) nodes.push({ x: i * w, y: 0 });
  const T = (i: number) => i, B = (i: number) => panels + 1 + i;
  const members: TMember[] = [];
  for (let i = 0; i < panels; i++) members.push({ a: T(i), b: T(i + 1), kind: 'top' });
  for (let i = 0; i < panels; i++) members.push({ a: B(i), b: B(i + 1), kind: 'bottom' });
  for (let i = 1; i <= panels; i++) members.push({ a: T(i), b: B(i), kind: 'vertical' });
  for (let i = 0; i < panels; i++) {
    members.push(diagonals === 'howe'
      ? { a: B(i), b: T(i + 1), kind: 'diagonal' }
      : { a: T(i), b: B(i + 1), kind: 'diagonal' });
  }
  const supports: TSupport[] = [{ node: T(0), x: true, y: true }, { node: B(0), x: true, y: true }];
  return { nodes, members, supports };
}

export interface Critical { index: number; force: number; ratio: number; failed: boolean }

/** The member closest to its limit. Buckling is not modeled: both signs use one strength. */
export function critical(forces: number[], strength: number): Critical {
  let index = 0;
  forces.forEach((f, i) => { if (Math.abs(f) > Math.abs(forces[index]) + 1e-12) index = i; });
  const force = forces[index] ?? 0;
  const ratio = strength > 0 ? Math.abs(force) / strength : Infinity;
  return { index, force, ratio, failed: ratio >= 1 - 1e-9 };
}

/** Load at which the critical member reaches its strength, for a given unit-load solution. */
export function failureLoad(unitForces: number[], strength: number): number {
  const max = Math.max(...unitForces.map((f) => Math.abs(f)));
  return max > 0 ? strength / max : Infinity;
}
