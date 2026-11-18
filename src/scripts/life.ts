// Off the clock: a progression you can log, a race countdown and pace, bars you can
// play, and a globe you can turn.
import { daysUntil, nextTarget } from '../lib/training';
import { stepSpring } from '../lib/motion';
import { env } from './env';
import { bindRange, out } from './tools/shared';

function lifting(card: HTMLElement): void {
  const rule = { minReps: 8, maxReps: 12, increment: 5 };
  let target = { weight: 135, reps: 8 };
  const history: { volume: number; up: boolean }[] = [];
  const bars = card.querySelector<HTMLElement>('[data-lift-bars]')!;
  const draw = (added = false) => {
    history.push({ volume: target.weight * target.reps, up: added });
    if (history.length > 16) history.shift();
    const max = Math.max(...history.map((h) => h.volume));
    bars.innerHTML = history.map((h) => `<i class="${h.up ? 'up' : ''}" style="height:${((h.volume / max) * 100).toFixed(1)}%"></i>`).join('');
    out(card, 'weight', String(target.weight)); out(card, 'reps', String(target.reps));
  };
  // Seed a short illustrative history so the chart has a shape before the first tap.
  let seed = { weight: 125, reps: 10 };
  for (let i = 0; i < 6; i++) {
    history.push({ volume: seed.weight * seed.reps, up: false });
    const n = nextTarget(seed, rule); seed = { weight: n.weight, reps: n.reps };
    if (n.addedWeight) history[history.length - 1].up = false;
  }
  target = seed;
  draw();
  card.querySelector('[data-action="log"]')?.addEventListener('click', () => {
    const next = nextTarget(target, rule);
    target = { weight: next.weight, reps: next.reps };
    out(card, 'lift-status', next.addedWeight ? `Top of the range reached. Add ${rule.increment} lb and start again at ${rule.minReps}.` : 'Same weight, one more rep.');
    draw(next.addedWeight);
  });
}

function running(card: HTMLElement): void {
  const [y, m, d] = card.dataset.race!.split(',').map(Number);
  const days = daysUntil(new Date(y, m, d), new Date());
  if (days > 0) { out(card, 'days', String(days)); out(card, 'days-label', days === 1 ? 'day to the start line' : 'days to the start line'); }
  else if (days === 0) { out(card, 'days', 'Today'); out(card, 'days-label', 'is race day'); }
  else card.querySelector<HTMLElement>('.countdown')!.hidden = true;
  const clock = (min: number) => `${Math.floor(min / 60)}:${String(Math.round(min % 60)).padStart(2, '0')}`;
  const pace = (min: number) => {
    const sec = Math.round((min * 60) / 26.2188);
    out(card, 'pace', `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')} per mile`);
  };
  bindRange(card, 'run-goal', pace, clock);
  pace(240);
}

function music(card: HTMLElement): void {
  const pads = card.querySelector<HTMLElement>('[data-pads]')!;
  let audio: AudioContext | null = null;
  const play = (b: HTMLButtonElement) => {
    b.classList.add('hit'); window.setTimeout(() => b.classList.remove('hit'), 140);
    try {
      audio ??= new AudioContext();
      const now = audio.currentTime, hz = Number(b.dataset.hz);
      const gain = audio.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
      gain.connect(audio.destination);
      for (const [mult, type] of [[1, 'triangle'], [2, 'sine']] as const) {
        const osc = audio.createOscillator();
        osc.type = type; osc.frequency.value = hz * mult;
        osc.connect(gain); osc.start(now); osc.stop(now + 1.15);
      }
    } catch { /* no audio available: the bars still move */ }
  };
  let down = false, lastPad: Element | null = null;
  pads.addEventListener('pointerdown', (e) => {
    const b = (e.target as Element).closest('button');
    if (!b) return;
    down = true; lastPad = b; play(b); pads.setPointerCapture(e.pointerId);
  });
  // Sweep across the bars with the button held, like running a finger down a keyboard.
  pads.addEventListener('pointermove', (e) => {
    if (!down) return;
    const b = document.elementFromPoint(e.clientX, e.clientY)?.closest('button');
    if (b && b !== lastPad && pads.contains(b)) { lastPad = b; play(b as HTMLButtonElement); }
  });
  const up = () => { down = false; lastPad = null; };
  pads.addEventListener('pointerup', up); pads.addEventListener('pointercancel', up);
  pads.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const b = (e.target as Element).closest('button');
    if (b) { e.preventDefault(); play(b); }
  });
}

function globe(card: HTMLElement): void {
  const canvas = card.querySelector<HTMLCanvasElement>('[data-globe]')!;
  const ctx = canvas.getContext('2d')!;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = 320; canvas.width = size * dpr; canvas.height = size * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const R = 138, c = size / 2;
  let yaw = 0.6, pitch = -0.32, vyaw = 0.18, vpitch = 0, dragging = false, lx = 0, ly = 0, lt = 0, visible = false, raf = 0;
  let spring = { value: pitch, velocity: 0 };

  function line(points: [number, number][]): void {
    // points are [lon, lat] in radians; draw only the near side
    let pen = false;
    ctx.beginPath();
    for (const [lon, lat] of points) {
      const x0 = Math.cos(lat) * Math.sin(lon + yaw), y0 = Math.sin(lat), z0 = Math.cos(lat) * Math.cos(lon + yaw);
      const y1 = y0 * Math.cos(pitch) - z0 * Math.sin(pitch), z1 = y0 * Math.sin(pitch) + z0 * Math.cos(pitch);
      if (z1 < 0) { pen = false; continue; }
      const px = c + x0 * R, py = c - y1 * R;
      if (pen) ctx.lineTo(px, py); else { ctx.moveTo(px, py); pen = true; }
    }
    ctx.stroke();
  }
  function draw(): void {
    ctx.clearRect(0, 0, size, size);
    const glow = ctx.createRadialGradient(c - 40, c - 50, 10, c, c, R * 1.15);
    glow.addColorStop(0, 'rgba(95,224,204,0.16)'); glow.addColorStop(1, 'rgba(95,224,204,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(c, c, R * 1.15, 0, 6.283); ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(95,224,204,0.5)';
    for (let lat = -75; lat <= 75; lat += 15) {
      const pts: [number, number][] = [];
      for (let lon = 0; lon <= 360; lon += 6) pts.push([(lon * Math.PI) / 180, (lat * Math.PI) / 180]);
      ctx.strokeStyle = lat === 0 ? 'rgba(255,169,77,0.9)' : 'rgba(95,224,204,0.42)';
      line(pts);
    }
    ctx.strokeStyle = 'rgba(95,224,204,0.42)';
    for (let lon = 0; lon < 360; lon += 15) {
      const pts: [number, number][] = [];
      for (let lat = -90; lat <= 90; lat += 6) pts.push([(lon * Math.PI) / 180, (lat * Math.PI) / 180]);
      line(pts);
    }
    ctx.strokeStyle = 'rgba(234,244,238,0.55)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(c, c, R, 0, 6.283); ctx.stroke();
  }
  let prev = performance.now();
  function tick(now: number): void {
    raf = 0;
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    if (!dragging) {
      // Yaw keeps its momentum and settles to a slow drift; pitch springs back level.
      vyaw += (0.18 - vyaw) * Math.min(1, dt * 0.9);
      yaw += vyaw * dt;
      spring = stepSpring({ value: pitch, velocity: vpitch }, -0.32, dt, 0.9, 0.8);
      pitch = spring.value; vpitch = spring.velocity;
    }
    draw();
    if (visible) wake();
  }
  function wake(): void { if (!raf && visible && !env.reduce) { prev = performance.now(); raf = requestAnimationFrame(tick); } }
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; canvas.setPointerCapture(e.pointerId); lx = e.clientX; ly = e.clientY; lt = performance.now(); vyaw = 0; vpitch = 0;
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now(), dt = Math.max(0.001, (now - lt) / 1000);
    const dx = (e.clientX - lx) / R, dy = (e.clientY - ly) / R;
    yaw += dx; pitch = Math.max(-1.2, Math.min(1.2, pitch + dy));
    vyaw = vyaw * 0.5 + (dx / dt) * 0.5; vpitch = vpitch * 0.5 + (dy / dt) * 0.5;
    lx = e.clientX; ly = e.clientY; lt = now;
    if (env.reduce) draw();
  });
  const up = () => { dragging = false; vyaw = Math.max(-9, Math.min(9, vyaw)); };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); }).observe(canvas);
  draw();
}

export function mount(section: HTMLElement): void {
  const pick = (name: string) => section.querySelector<HTMLElement>(`[data-life="${name}"]`);
  const l = pick('lifting'), r = pick('running'), m = pick('music'), t = pick('travel');
  if (l) lifting(l);
  if (r) running(r);
  if (m) music(m);
  if (t) globe(t);
}
