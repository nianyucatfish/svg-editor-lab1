import { Shape } from './Shape.ts';
export class Circle extends Shape {
  #cx: number;
  #cy: number;
  #r: number;
  constructor(id: string, cx: number, cy: number, r: number, fill?: string) {
    super(id);
    if (![ cx, cy, r ].every(Number.isFinite)) throw new Error('geometry must be finite');
    if (r < 0) throw new Error('dimensions must be non-negative');
    this.#cx = cx;
    this.#cy = cy;
    this.#r = r;
    if (fill !== undefined) super.set('fill', fill);
  }
  get type(): string { return 'circle'; }
  details(): string { return `cx=${this.#cx} cy=${this.#cy} r=${this.#r}` + this.styles(); }

  override attributes(): Map<string, string> {
    const attributes = super.attributes();
    attributes.set('cx', String(this.#cx));
    attributes.set('cy', String(this.#cy));
    attributes.set('r', String(this.#r));
    return attributes;
  }
  clone(): Circle { const copy = new Circle(this.id, this.#cx, this.#cy, this.#r); this.copyStyles(copy); return copy; }
  move(dx: number, dy: number): void { this.#cx = this.finite(this.#cx + dx); this.#cy = this.finite(this.#cy + dy); }
  scale(factor: number): void { this.#cx = this.finite(this.#cx * factor); this.#cy = this.finite(this.#cy * factor); this.#r = this.finite(this.#r * factor); }
  override set(attr: string, value: string): void {
    if (attr === 'cx') { const n = Number(value); if (value.trim() === '' || !Number.isFinite(n)) throw new Error('invalid value for cx'); this.#cx = n; return; }
    if (attr === 'cy') { const n = Number(value); if (value.trim() === '' || !Number.isFinite(n)) throw new Error('invalid value for cy'); this.#cy = n; return; }
    if (attr === 'r') { const n = Number(value); if (value.trim() === '' || !Number.isFinite(n) || n < 0) throw new Error('invalid value for r'); this.#r = n; return; }
    super.set(attr, value);
  }
}
