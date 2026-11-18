// The one home for colour. tokens.css mirrors these values and palette.test.ts
// fails if the two drift apart or if any text colour loses AA contrast.

export const ground = {
  sunlit: '#0F4A47',
  water: '#0A2C30',
  deep: '#06191C',
  abyss: '#030B0D',
  space: '#05060F',
} as const;

/** Tool panels sit on this near-solid ground wherever they are on the page. */
export const panelSolid = '#071D20';

export const ink = {
  fg: '#EAF4EE',
  muted: '#A9C2BB',
  aqua: '#5FE0CC',
  amber: '#FFA94D',
  peach: '#F2C9A6',
  fail: '#FF6A57',
} as const;

export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
