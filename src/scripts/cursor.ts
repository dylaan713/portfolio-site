// Custom cursor for fine pointers: a ring, a dot and four trailing points, plus the
// magnetic pull and the card tilt. All of it is skipped on touch and reduced motion.
import { stepSpring, type SpringState } from '../lib/motion';
import { env, pointer } from './env';

const HOT = 'a, button, summary, input, label, [data-node], [data-handle], .s-wheel, .globe, .flow-sources li, .pads button, .t-hit';

interface Trail { el: HTMLElement; x: number; y: number; k: number }
interface Magnet { el: HTMLElement; tx: number; ty: number; x: SpringState; y: SpringState; live: boolean }

let ring: HTMLElement | null = null, dot: HTMLElement | null = null;
let rx = 0, ry = 0;
const trails: Trail[] = [];
const magnets: Magnet[] = [];

export function initCursor(): void {
  if (!env.fine || env.reduce) return;
  const root = document.documentElement;
  root.classList.add('cursor', 'cursor-hidden');
  ring = document.createElement('div'); ring.className = 'cursor-ring';
  dot = document.createElement('div'); dot.className = 'cursor-dot';
  document.body.append(ring, dot);
  for (let i = 0; i < 4; i++) {
    const el = document.createElement('div');
    el.className = 'cursor-trail'; el.style.opacity = String(0.4 - i * 0.085);
    document.body.append(el);
    trails.push({ el, x: pointer.x, y: pointer.y, k: 0.24 - i * 0.04 });
  }
  rx = pointer.x; ry = pointer.y;
  window.addEventListener('pointermove', () => root.classList.remove('cursor-hidden'), { once: true, passive: true });
  document.documentElement.addEventListener('pointerleave', () => root.classList.add('cursor-hidden'));
  document.documentElement.addEventListener('pointerenter', () => root.classList.remove('cursor-hidden'));
  document.addEventListener('pointerover', (e) => {
    ring!.classList.toggle('hot', !!(e.target as Element).closest?.(HOT));
  });
  window.addEventListener('pointerdown', () => ring!.classList.add('grab'));
  window.addEventListener('pointerup', () => ring!.classList.remove('grab'));

  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const m: Magnet = { el, tx: 0, ty: 0, x: { value: 0, velocity: 0 }, y: { value: 0, velocity: 0 }, live: false };
    magnets.push(m);
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      m.tx = (e.clientX - (r.left + r.width / 2)) * 0.3;
      m.ty = (e.clientY - (r.top + r.height / 2)) * 0.4;
      m.live = true;
    });
    el.addEventListener('pointerleave', () => { m.tx = 0; m.ty = 0; });
  });

  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      el.style.transition = 'transform 0.12s linear';
      el.style.transform = `perspective(900px) rotateY(${(nx * 6).toFixed(2)}deg) rotateX(${(-ny * 6).toFixed(2)}deg)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)';
      el.style.transform = '';
    });
  });
}

export function tickCursor(dt: number): void {
  if (!ring || !dot) return;
  rx += (pointer.x - rx) * 0.32; ry += (pointer.y - ry) * 0.32;
  ring.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0)`;
  dot.style.transform = `translate3d(${pointer.x}px,${pointer.y}px,0)`;
  let px = pointer.x, py = pointer.y;
  for (const t of trails) {
    t.x += (px - t.x) * t.k; t.y += (py - t.y) * t.k;
    t.el.style.transform = `translate3d(${t.x.toFixed(1)}px,${t.y.toFixed(1)}px,0)`;
    px = t.x; py = t.y;
  }
  for (const m of magnets) {
    if (!m.live) continue;
    // Pull is critically damped; the release has a little bounce because it carries momentum.
    const damping = m.tx === 0 && m.ty === 0 ? 0.55 : 1;
    m.x = stepSpring(m.x, m.tx, dt, 0.32, damping);
    m.y = stepSpring(m.y, m.ty, dt, 0.32, damping);
    m.el.style.transform = `translate(${m.x.value.toFixed(2)}px,${m.y.value.toFixed(2)}px)`;
    if (m.tx === 0 && m.ty === 0 && Math.abs(m.x.value) < 0.05 && Math.abs(m.y.value) < 0.05 && Math.abs(m.x.velocity) < 0.5 && Math.abs(m.y.velocity) < 0.5) {
      m.live = false; m.el.style.transform = '';
    }
  }
}
