// Shared runtime state: what the device can do, where the pointer is, how deep we are.
export const env = {
  reduce: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  fine: window.matchMedia('(hover: hover) and (pointer: fine)').matches,
};

export const pointer = {
  x: window.innerWidth / 2,
  y: window.innerHeight * 0.4,
  speed: 0,          // px per frame, smoothed
  seen: false,       // has the visitor moved a pointer or touched yet
  inside: true,
};

export const world = { depth: 0, target: 0, scrollY: 0, scrollDelta: 0 };

let lastX = pointer.x, lastY = pointer.y;
window.addEventListener('pointermove', (e) => {
  pointer.x = e.clientX; pointer.y = e.clientY; pointer.seen = true; pointer.inside = true;
}, { passive: true });
window.addEventListener('pointerdown', (e) => {
  pointer.x = e.clientX; pointer.y = e.clientY; pointer.seen = true;
}, { passive: true });
document.documentElement.addEventListener('pointerleave', () => { pointer.inside = false; });

export function tickPointer(): void {
  const d = Math.hypot(pointer.x - lastX, pointer.y - lastY);
  pointer.speed += (d - pointer.speed) * 0.25;
  lastX = pointer.x; lastY = pointer.y;
}
