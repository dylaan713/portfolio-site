// Boot: the water column, the depth reading, arrivals, counters, the hero type that
// leans toward the pointer, and lazy loading of each tool as its section approaches.
import Lenis from 'lenis';
import { depthAt, formatDepth, type Stop } from '../lib/depth';
import { easeOutExpo } from '../lib/motion';
import { env, pointer, tickPointer, world } from './env';
import { drawWater, initWater, resizeWater } from './water';
import { runLoader } from './loader';
import { initCursor, tickCursor } from './cursor';

const root = document.documentElement;
const $ = <T extends Element>(sel: string, el: ParentNode = document) => el.querySelector<T>(sel);
const $$ = <T extends Element>(sel: string, el: ParentNode = document) => [...el.querySelectorAll<T>(sel)];

/* ---------- depth ---------- */
const marked = $$<HTMLElement>('[data-depth]');
let stops: Stop[] = [];
function measure(): void {
  stops = marked.map((el) => {
    const r = el.getBoundingClientRect();
    return { at: r.top + window.scrollY + Math.min(r.height / 2, window.innerHeight * 0.9), depth: Number(el.dataset.depth) };
  });
}
const depthOut = $('#depth-out'), railMark = $<HTMLElement>('#rail-mark'), railTicks = $('#rail-ticks');
if (railTicks) for (let i = 0; i < 25; i++) { const t = document.createElement('i'); if (i % 4 === 0) t.className = 'major'; railTicks.append(t); }
let lastReading = '';
function showDepth(): void {
  const text = formatDepth(world.depth);
  if (text !== lastReading && depthOut) { depthOut.textContent = text; lastReading = text; }
  if (railMark) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const f = max > 0 ? window.scrollY / max : 0;
    railMark.style.transform = `translateY(${(f * (railMark.parentElement!.clientHeight - 2)).toFixed(1)}px)`;
  }
}

/* ---------- headings split into words ---------- */
for (const h of $$<HTMLElement>('[data-split]')) {
  const words = (h.textContent ?? '').trim().split(/\s+/);
  h.textContent = '';
  words.forEach((w, i) => {
    const outer = document.createElement('span'); outer.className = 'w';
    const inner = document.createElement('i'); inner.textContent = w; inner.style.setProperty('--i', String(i));
    outer.append(inner); h.append(outer);
    if (i < words.length - 1) h.append(' ');
  });
}

/* ---------- arrivals and counters ---------- */
function formatCount(el: HTMLElement, v: number): string {
  const d = Number(el.dataset.decimals ?? 0);
  return 'comma' in el.dataset ? Math.round(v).toLocaleString('en-US') : v.toFixed(d);
}
function count(el: HTMLElement): void {
  const target = Number(el.dataset.count);
  const start = performance.now(), dur = 1500;
  const step = (now: number) => {
    const p = Math.min(1, (now - start) / dur);
    el.textContent = formatCount(el, target * easeOutExpo(p));
    if (p < 1) requestAnimationFrame(step); else el.textContent = formatCount(el, target);
  };
  requestAnimationFrame(step);
}
function startArrivals(): void {
  root.classList.add('entered');
  if (env.reduce) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  $$('[data-reveal], [data-split]').forEach((el) => io.observe(el));
  const cio = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { count(e.target as HTMLElement); cio.unobserve(e.target); }
  }, { threshold: 0.6 });
  $$<HTMLElement>('[data-count]').forEach((el) => cio.observe(el));
}

/* ---------- hero type leans toward the pointer ---------- */
const letters = $$<HTMLElement>('.name .ch');
const hero = $('#top');
let heroVisible = true;
if (hero) new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(hero);
const letterState = letters.map(() => 0);
function tickLetters(): void {
  if (!heroVisible || !env.fine || env.reduce) return;
  letters.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const d = Math.hypot(pointer.x - (r.left + r.width / 2), pointer.y - (r.top + r.height / 2));
    const near = pointer.seen ? Math.max(0, 1 - d / (r.height * 1.6)) : 0;
    const next = letterState[i] + (near * near - letterState[i]) * 0.14;
    if (Math.abs(next - letterState[i]) < 0.002) return;
    letterState[i] = next;
    el.style.setProperty('--wd', (100 + next * 25).toFixed(1));
    el.style.setProperty('--wg', (820 - next * 420).toFixed(0));
  });
}

/* ---------- smooth scroll and in-page links ---------- */
let lenis: Lenis | null = null;
if (env.fine && !env.reduce) lenis = new Lenis({ autoRaf: false, lerp: 0.11, wheelMultiplier: 1 });
document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[href^="#"]');
  if (!a) return;
  const target = document.getElementById(a.getAttribute('href')!.slice(1));
  if (!target) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.4 });
  else target.scrollIntoView({ behavior: env.reduce ? 'auto' : 'smooth', block: 'start' });
  history.replaceState(null, '', a.getAttribute('href'));
  target.setAttribute('tabindex', '-1'); (target as HTMLElement).focus({ preventScroll: true });
});
const navLinks = $$<HTMLAnchorElement>('.bar nav a');
const navTargets = ['work', 'truss', 'life', 'contact'];
function markNav(): void {
  const mid = window.scrollY + window.innerHeight * 0.4;
  let current = '';
  for (const id of navTargets) { const el = document.getElementById(id); if (el && el.offsetTop <= mid) current = id; }
  navLinks.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === `#${current}`)));
}

/* ---------- small page behaviours ---------- */
for (const flow of $$<HTMLElement>('[data-flow]')) {
  const set = (id: string | null) => {
    $$('[data-sys]', flow).forEach((li) => li.classList.toggle('on', (li as HTMLElement).dataset.sys === id));
    $$('[data-line]', flow).forEach((p) => p.classList.toggle('on', (p as HTMLElement).dataset.line === id));
  };
  $$<HTMLElement>('[data-sys]', flow).forEach((li) => {
    li.addEventListener('pointerenter', () => set(li.dataset.sys!));
    li.addEventListener('pointerleave', () => set(null));
  });
}
for (const b of $$<HTMLButtonElement>('[data-copy]')) {
  b.addEventListener('click', async () => {
    const label = b.querySelector('span')!;
    try { await navigator.clipboard.writeText(b.dataset.copy!); label.textContent = 'Copied'; }
    catch { label.textContent = b.dataset.copy!; }
    window.setTimeout(() => { label.textContent = 'Copy address'; }, 2200);
  });
}

/* ---------- lazy tools ---------- */
const loaders: Record<string, () => Promise<{ mount: (el: HTMLElement) => void }>> = {
  truss: () => import('./tools/truss'),
  stirling: () => import('./tools/stirling'),
  dog: () => import('./tools/sizing'),
  rov: () => import('./tools/rov'),
};
const tio = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    tio.unobserve(e.target);
    const el = e.target as HTMLElement;
    loaders[el.dataset.tool!]?.().then((m) => { m.mount(el); el.dataset.ready = 'true'; }).catch(() => { el.dataset.ready = 'error'; });
  }
}, { rootMargin: '900px 0px' });
$$<HTMLElement>('[data-tool]').forEach((el) => tio.observe(el));
const life = $<HTMLElement>('#life');
if (life) {
  const lio = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    lio.disconnect();
    import('./life').then((m) => { m.mount(life); life.dataset.ready = 'true'; }).catch(() => { life.dataset.ready = 'error'; });
  }, { rootMargin: '900px 0px' });
  lio.observe(life);
}

/* ---------- the loop ---------- */
const column = $<HTMLCanvasElement>('#column');
if (column) initWater(column);
initCursor();
measure();
world.scrollY = window.scrollY;
world.target = depthAt(stops, window.scrollY + window.innerHeight / 2);
world.depth = world.target;

let last = performance.now(), visible = true;
document.addEventListener('visibilitychange', () => { visible = !document.hidden; last = performance.now(); });
function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (lenis) lenis.raf(now);
  const y = window.scrollY;
  world.scrollDelta = y - world.scrollY; world.scrollY = y;
  world.target = depthAt(stops, y + window.innerHeight / 2);
  world.depth += (world.target - world.depth) * (env.reduce ? 1 : Math.min(1, dt * 7));
  if (visible) {
    tickPointer();
    if (column && !root.classList.contains('loading')) drawWater(now);
    tickCursor(dt);
    tickLetters();
    showDepth();
  }
  requestAnimationFrame(frame);
}
function still(): void {
  world.scrollDelta = 0; world.scrollY = window.scrollY;
  world.depth = world.target = depthAt(stops, window.scrollY + window.innerHeight / 2);
  if (column) drawWater(performance.now());
  showDepth();
}
if (env.reduce) {
  // No loop: one still frame per scroll or resize.
  still();
  window.addEventListener('scroll', () => { still(); markNav(); }, { passive: true });
} else {
  requestAnimationFrame(frame);
  window.addEventListener('scroll', markNav, { passive: true });
}
let resizeTimer = 0;
window.addEventListener('resize', () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => { if (column) resizeWater(); measure(); if (env.reduce) still(); }, 120);
});
window.addEventListener('load', measure);
if ('fonts' in document) document.fonts.ready.then(measure);
new ResizeObserver(() => measure()).observe(document.body);
markNav();
runLoader(startArrivals);
root.dataset.ready = 'true';
