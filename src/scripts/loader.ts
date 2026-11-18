// The one orchestrated moment: a dot matrix resolves into a submersible while the
// counter runs. It is short, it reacts to the pointer, and it never blocks content
// (CSS removes it after six seconds even if this script never runs).
import { easeOutCubic } from '../lib/motion';
import { env, pointer } from './env';

const DURATION = 1500;

export function runLoader(done: () => void): void {
  const root = document.documentElement;
  if (!root.classList.contains('loading')) { done(); return; }
  const canvas = document.getElementById('loader-dots') as HTMLCanvasElement | null;
  const num = document.getElementById('loader-num'), fill = document.getElementById('loader-fill');
  const depth = document.getElementById('loader-depth');
  if (!canvas || !num || !fill || !depth) { root.classList.remove('loading'); done(); return; }
  const ctx = canvas.getContext('2d')!;
  const box = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = box.width * dpr; canvas.height = box.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cell = Math.max(7, Math.min(13, Math.round(box.width / 70)));
  const cols = Math.floor(box.width / cell), rows = Math.floor(box.height / cell);
  const ox = (box.width - cols * cell) / 2, oy = (box.height - rows * cell) / 2;

  // Draw the vehicle once at grid resolution and read it back as a mask.
  const off = document.createElement('canvas');
  off.width = cols; off.height = rows;
  const m = off.getContext('2d')!;
  m.fillStyle = '#fff';
  const cx = cols / 2, cy = rows / 2, R = Math.min(cols * 0.2, rows * 0.36);
  m.beginPath(); m.ellipse(cx, cy, R * 1.6, R * 0.7, 0, 0, Math.PI * 2); m.fill();
  m.beginPath(); m.arc(cx + R * 1.05, cy, R * 0.46, 0, Math.PI * 2); m.fill();
  m.fillRect(cx - R * 1.85, cy - R * 0.98, R * 0.55, R * 0.4);
  m.fillRect(cx - R * 1.85, cy + R * 0.58, R * 0.55, R * 0.4);
  m.fillRect(cx - R * 3.1, cy - 0.5, R * 1.3, 1.2);
  const data = m.getImageData(0, 0, cols, rows).data;
  const mask = new Uint8Array(cols * rows);
  for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3] > 40 ? 1 : 0;

  // Background dots never change unless a fine pointer is near them, so they are
  // painted once into a layer and blitted. Only the vehicle is redrawn each frame.
  const still = document.createElement('canvas');
  still.width = canvas.width; still.height = canvas.height;
  const sctx = still.getContext('2d')!;
  sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  sctx.fillStyle = '#5FE0CC'; sctx.globalAlpha = 0.07;
  const inside: { x: number; y: number; dist: number }[] = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const px = ox + x * cell + cell / 2, py = oy + y * cell + cell / 2;
    if (mask[y * cols + x] === 1) inside.push({ x: px, y: py, dist: Math.hypot(x / cols - 0.5, y / rows - 0.5) / 0.72 });
    else sctx.fillRect(px - cell * 0.09, py - cell * 0.09, cell * 0.18, cell * 0.18);
  }
  const reactive = env.fine;
  const reach = 140;

  const start = performance.now();
  const frame = (now: number) => {
    const e = Math.min(1, (now - start) / DURATION), p = easeOutCubic(e);
    num.textContent = String(Math.round(p * 100)).padStart(3, '0');
    fill.style.width = `${p * 100}%`;
    depth.textContent = `${(p * 120).toFixed(1).padStart(5, '0')} m`;
    ctx.clearRect(0, 0, box.width, box.height);
    ctx.globalAlpha = 1;
    ctx.drawImage(still, 0, 0, box.width, box.height);
    const mx = pointer.x - box.left, my = pointer.y - box.top;
    if (reactive && pointer.seen) {
      // light up the background dots under the pointer
      const c0 = Math.max(0, Math.floor((mx - reach - ox) / cell)), c1 = Math.min(cols - 1, Math.ceil((mx + reach - ox) / cell));
      const r0 = Math.max(0, Math.floor((my - reach - oy) / cell)), r1 = Math.min(rows - 1, Math.ceil((my + reach - oy) / cell));
      ctx.fillStyle = '#F2C9A6';
      for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) {
        if (mask[y * cols + x] === 1) continue;
        const px = ox + x * cell + cell / 2, py = oy + y * cell + cell / 2;
        const dx = px - mx, dy = py - my, d = Math.hypot(dx, dy) || 1;
        if (d >= reach) continue;
        const near = 1 - d / reach, shove = near * near * 10;
        ctx.globalAlpha = Math.min(1, near * 0.6);
        ctx.beginPath(); ctx.arc(px + (dx / d) * shove, py + (dy / d) * shove, cell * 0.09 + near * 1.2, 0, 6.283); ctx.fill();
      }
    }
    for (const dot of inside) {
      const reveal = Math.max(0, Math.min(1, (p - dot.dist * 0.55) / 0.45));
      let near = 0, sx = 0, sy = 0;
      if (reactive && pointer.seen) {
        const dx = dot.x - mx, dy = dot.y - my, d = Math.hypot(dx, dy) || 1;
        if (d < reach) { near = 1 - d / reach; const shove = near * near * 10; sx = (dx / d) * shove; sy = (dy / d) * shove; }
      }
      ctx.fillStyle = reveal > 0.7 ? (near > 0.3 ? '#F2C9A6' : '#FFA94D') : '#2F7F76';
      ctx.globalAlpha = Math.min(1, 0.14 + reveal * 0.86);
      const rad = cell * (0.16 + reveal * 0.18) + near * 1.5;
      ctx.beginPath(); ctx.arc(dot.x + sx, dot.y + sy, rad, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (e < 1) { requestAnimationFrame(frame); return; }
    try { sessionStorage.setItem('dive-seen', '1'); } catch { /* private mode */ }
    window.setTimeout(() => {
      root.classList.add('loaded');
      done();
      window.setTimeout(() => root.classList.remove('loading', 'loaded'), 900);
    }, 220);
  };
  requestAnimationFrame(frame);
}
