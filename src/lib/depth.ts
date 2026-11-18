// Altitude as a function of scroll position. Each section declares the altitude at
// its centre; between centres the reading eases from one to the next.

export interface Stop { at: number; depth: number }   // at: document y of the section centre

export function smoothstep(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

export function depthAt(stops: Stop[], y: number): number {
  if (stops.length === 0) return 0;
  if (y <= stops[0].at) return stops[0].depth;
  const last = stops[stops.length - 1];
  if (y >= last.at) return last.depth;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (y >= a.at && y <= b.at) {
      const span = b.at - a.at;
      return span <= 0 ? b.depth : a.depth + (b.depth - a.depth) * smoothstep((y - a.at) / span);
    }
  }
  return last.depth;
}

/** 0 at or above the surface, 1 at the deepest water. */
export function waterFraction(depth: number, floor: number): number {
  return depth >= 0 ? 0 : Math.min(1, -depth / Math.abs(floor));
}

/** 0 at or below the surface, 1 in orbit. Log scale, because altitude spans five decades. */
export function skyFraction(depth: number, ceiling: number): number {
  if (depth <= 0) return 0;
  return Math.min(1, Math.log10(1 + depth) / Math.log10(1 + ceiling));
}

export function formatDepth(depth: number): string {
  const sign = depth < -0.05 ? '−' : '+';
  const abs = Math.abs(depth);
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1).padStart(5, '0')} km`;
  return `${sign}${abs.toFixed(1).padStart(5, '0')} m`;
}
