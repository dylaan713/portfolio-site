// Helpers shared by the tools: range inputs that keep their <output> in step.
export function bindRange(root: HTMLElement, id: string, onInput: (value: number) => void, format?: (v: number) => string): HTMLInputElement {
  const input = root.querySelector<HTMLInputElement>(`#${id}`)!;
  const out = root.querySelector<HTMLOutputElement>(`#${id}-out`);
  const show = () => {
    const v = Number(input.value);
    if (out) {
      const unit = input.dataset.unit ?? '', d = Number(input.dataset.decimals ?? 0);
      out.textContent = format ? format(v) : `${v.toFixed(d)}${unit ? ` ${unit}` : ''}`;
    }
  };
  input.addEventListener('input', () => { show(); onInput(Number(input.value)); });
  show();
  return input;
}

export function setRange(input: HTMLInputElement, value: number): void {
  input.value = String(value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

export function out(root: HTMLElement, key: string, text: string): void {
  const el = root.querySelector<HTMLElement>(`[data-out="${key}"]`);
  if (el && el.textContent !== text) el.textContent = text;
}

/** Convert a pointer event to coordinates in an SVG's viewBox. */
export function svgPoint(svg: SVGSVGElement, e: PointerEvent): { x: number; y: number } {
  const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
  return { x: ((e.clientX - r.left) / r.width) * vb.width, y: ((e.clientY - r.top) / r.height) * vb.height };
}
