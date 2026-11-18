// Small motion primitives: a spring that can be re-targeted mid-flight, momentum
// projection, and a couple of easing curves. No DOM knowledge.

export interface SpringState { value: number; velocity: number }

/**
 * Advance a damped spring by dt seconds toward target. `response` is roughly the
 * time to reach the target; `damping` 1 is critically damped, below 1 overshoots.
 * Semi-implicit Euler, sub-stepped so a long frame cannot blow it up.
 */
export function stepSpring(s: SpringState, target: number, dt: number, response = 0.4, damping = 1): SpringState {
  const omega = (2 * Math.PI) / Math.max(0.05, response);
  let { value, velocity } = s;
  const steps = Math.max(1, Math.ceil(dt / 0.004));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    const accel = -omega * omega * (value - target) - 2 * damping * omega * velocity;
    velocity += accel * h;
    value += velocity * h;
  }
  return { value, velocity };
}

export function settled(s: SpringState, target: number, eps = 0.001): boolean {
  return Math.abs(s.value - target) < eps && Math.abs(s.velocity) < eps;
}

/** Where a flick comes to rest, from release velocity in units per second. */
export function project(velocity: number, deceleration = 0.998): number {
  return ((velocity / 1000) * deceleration) / (1 - deceleration);
}

export const easeOutCubic = (t: number) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * Math.max(0, t)));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
