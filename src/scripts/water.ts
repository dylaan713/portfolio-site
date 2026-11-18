// The column behind the page: water below the surface, sky and stars above it.
// The pointer is a lamp. It lights the water, pushes particulate aside and, at
// depth, makes disturbed plankton flash.
import { ground, hexToRgb, mix, type Rgb } from '../lib/palette';
import { skyFraction, waterFraction } from '../lib/depth';
import { env, pointer, world } from './env';

const FLOOR = -120, CEILING = 400000;
const C = {
  sunlit: hexToRgb(ground.sunlit), water: hexToRgb(ground.water), deep: hexToRgb(ground.deep),
  abyss: hexToRgb(ground.abyss), space: hexToRgb(ground.space),
  dusk: [9, 24, 52] as Rgb,
};
const css = (c: Rgb, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

interface Mote { x: number; y: number; r: number; v: number; a: number; p: number; ox: number; oy: number; glow: number; z: number }

let canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D;
// The smooth layers (ground, shafts, limb, lamp) are painted into a small buffer and
// scaled up; only the particles are drawn at full resolution. Sixteen times fewer
// pixels to fill per frame, and no visible difference in a gradient.
let buffer: HTMLCanvasElement, bctx: CanvasRenderingContext2D;
const SOFT = 4;
let W = 0, H = 0, motes: Mote[] = [];
let lampX = 0, lampY = 0;

export function initWater(el: HTMLCanvasElement): void {
  canvas = el;
  ctx = el.getContext('2d', { alpha: false })!;
  buffer = document.createElement('canvas');
  bctx = buffer.getContext('2d', { alpha: false })!;
  resizeWater();
  lampX = W / 2; lampY = H * 0.4;
}

export function resizeWater(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, env.fine ? 2 : 1.5);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'low';
  buffer.width = Math.ceil(W / SOFT); buffer.height = Math.ceil(H / SOFT);
  const count = Math.min(env.fine ? 150 : 70, Math.round((W * H) / 11000));
  motes = Array.from({ length: count }, () => ({
    x: Math.random() * W, y: Math.random() * H, z: 0.35 + Math.random() * 0.65,
    r: Math.random() * 1.5 + 0.4, v: Math.random() * 0.22 + 0.04, a: Math.random() * 0.45 + 0.12,
    p: Math.random() * 6.283, ox: 0, oy: 0, glow: 0,
  }));
}

export function drawWater(time: number): void {
  const depth = world.depth;
  const wf = waterFraction(depth, FLOOR);
  const sf = skyFraction(depth, CEILING);
  const t = time / 1000;

  // ground
  let top: Rgb, bottom: Rgb;
  const dark = Math.pow(wf, 0.6);
  if (depth <= 0) { top = mix(C.sunlit, C.deep, dark); bottom = mix(C.water, C.abyss, dark); }
  else { top = mix(C.water, C.space, sf); bottom = mix(C.sunlit, sf > 0.6 ? C.space : C.dusk, Math.min(1, sf * 1.15)); }
  const b = bctx;
  b.setTransform(1 / SOFT, 0, 0, 1 / SOFT, 0, 0);
  let limb: { cy: number; R: number; k: number } | null = null;
  const g = b.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, css(top)); g.addColorStop(1, css(bottom));
  b.fillStyle = g; b.fillRect(0, 0, W, H);

  // light shafts near the surface
  const shafts = depth <= 0 ? Math.max(0, 1 - wf / 0.55) : Math.max(0, 1 - sf * 6);
  if (shafts > 0.01) {
    b.save(); b.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const drift = env.reduce ? 0 : Math.sin(t / 5 + i * 1.7) * 0.035;
      const sx = ((i * 0.19 + 0.06 + drift + 1) % 1) * W;
      const sg = b.createLinearGradient(sx, 0, sx + W * 0.12, H);
      sg.addColorStop(0, `rgba(160,240,220,${(0.05 * shafts).toFixed(3)})`);
      sg.addColorStop(0.55, `rgba(160,240,220,${(0.018 * shafts).toFixed(3)})`);
      sg.addColorStop(1, 'rgba(160,240,220,0)');
      b.fillStyle = sg;
      b.beginPath();
      b.moveTo(sx - W * 0.03, 0); b.lineTo(sx + W * 0.05, 0);
      b.lineTo(sx + W * 0.24, H); b.lineTo(sx + W * 0.04, H);
      b.closePath(); b.fill();
    }
    b.restore();
  }

  // the planet's limb, once we are high enough to see it
  if (sf > 0.86) {
    const k = (sf - 0.86) / 0.14;
    const R = W * 1.5, cy = H + R - H * 0.14 * k;
    b.save();
    const halo = b.createRadialGradient(W / 2, cy, R * 0.985, W / 2, cy, R * 1.06);
    halo.addColorStop(0, `rgba(95,224,204,${(0.5 * k).toFixed(3)})`);
    halo.addColorStop(0.35, `rgba(90,150,255,${(0.22 * k).toFixed(3)})`);
    halo.addColorStop(1, 'rgba(90,150,255,0)');
    b.fillStyle = halo; b.beginPath(); b.arc(W / 2, cy, R * 1.06, 0, 6.283); b.fill();
    b.restore();
    limb = { cy, R, k };
  }

  // the lamp
  const follow = env.reduce ? 1 : 0.1;
  const tx = pointer.seen ? pointer.x : W * 0.5, ty = pointer.seen ? pointer.y : H * 0.42;
  lampX += (tx - lampX) * follow; lampY += (ty - lampY) * follow;
  const lampR = Math.min(W, H) * (depth > 0 ? 0.3 : 0.44);
  const lampOn = pointer.seen && (env.fine ? pointer.inside : true);
  if (lampOn) {
    b.save(); b.globalCompositeOperation = 'lighter';
    const warm = depth > 0 && sf > 0.3 ? '150,185,255' : '255,190,125';
    const power = depth > 0 ? 0.05 + (1 - sf) * 0.05 : 0.09 + wf * 0.09;
    const lg = b.createRadialGradient(lampX, lampY, 0, lampX, lampY, lampR);
    lg.addColorStop(0, `rgba(${warm},${power.toFixed(3)})`);
    lg.addColorStop(0.5, `rgba(${warm},${(power * 0.3).toFixed(3)})`);
    lg.addColorStop(1, `rgba(${warm},0)`);
    b.fillStyle = lg; b.beginPath(); b.arc(lampX, lampY, lampR, 0, 6.283); b.fill();
    b.restore();
  }

  ctx.drawImage(buffer, 0, 0, W, H);
  if (limb) {
    ctx.fillStyle = css(C.abyss, 1); ctx.beginPath(); ctx.arc(W / 2, limb.cy, limb.R, 0, 6.283); ctx.fill();
    ctx.strokeStyle = `rgba(255,201,150,${(0.55 * limb.k).toFixed(3)})`; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(W / 2, limb.cy, limb.R, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
  }

  // particulate below, stars above
  const inWater = depth <= 0;
  const starAlpha = inWater ? 0 : Math.min(1, Math.max(0, (sf - 0.35) / 0.4));
  const snowAlpha = inWater ? 1 : Math.max(0, 1 - sf * 5);
  const stir = Math.min(1, pointer.speed / 22);
  const push = lampR * 0.4;
  for (const o of motes) {
    if (!env.reduce) {
      if (snowAlpha > 0) { o.y -= o.v * o.z; o.x += Math.sin(t * 0.4 + o.p) * 0.06; }
      o.y -= world.scrollDelta * 0.22 * o.z;
      if (o.y < -6) { o.y += H + 12; o.x = Math.random() * W; }
      if (o.y > H + 6) { o.y -= H + 12; o.x = Math.random() * W; }
    }
    const dx = o.x - lampX, dy = o.y - lampY, d = Math.hypot(dx, dy) || 1;
    if (lampOn && d < push && snowAlpha > 0 && !env.reduce) {
      const f = 1 - d / push;
      o.ox += ((dx / d) * f * 18 - o.ox) * 0.08; o.oy += ((dy / d) * f * 18 - o.oy) * 0.08;
      if (wf > 0.4 && stir > 0.2) o.glow = Math.min(1, o.glow + f * stir * 0.5);
    } else { o.ox *= 0.93; o.oy *= 0.93; }
    o.glow *= 0.955;
    const lit = lampOn && d < lampR ? 1 - d / lampR : 0;
    const x = o.x + o.ox, y = o.y + o.oy;

    if (snowAlpha > 0.01) {
      const a = (o.a * (0.28 + wf * 0.5) + lit * lit * 0.7) * snowAlpha * o.z;
      if (o.glow > 0.04) {
        ctx.fillStyle = `rgba(95,224,204,${(o.glow * 0.22).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x, y, o.r * 5, 0, 6.283); ctx.fill();
        ctx.fillStyle = `rgba(190,255,240,${Math.min(1, a + o.glow).toFixed(3)})`;
      } else {
        ctx.fillStyle = `rgba(${lit > 0.3 ? '255,226,196' : '205,238,228'},${Math.min(1, a).toFixed(3)})`;
      }
      ctx.beginPath(); ctx.arc(x, y, o.r * (1 + lit * 0.7), 0, 6.283); ctx.fill();
    }
    if (starAlpha > 0.01) {
      const tw = env.reduce ? 0.8 : 0.55 + Math.sin(t * 1.4 + o.p) * 0.35;
      ctx.fillStyle = `rgba(226,236,255,${(o.a * 1.5 * tw * starAlpha + lit * 0.35).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 0.6 * o.z + lit * 0.6, 0, 6.283); ctx.fill();
    }
  }
}
