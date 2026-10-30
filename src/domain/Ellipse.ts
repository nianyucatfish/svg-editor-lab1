import { Shape } from './Shape.ts';
export class Ellipse extends Shape {
  #cx: number;
  #cy: number;
  #rx: number;
  #ry: number;
  constructor(id: string, cx: number, cy: number, rx: number, ry: number, fill?: string) {
    super(id);
    if (![ cx, cy, rx, ry ].every(Number.isFinite)) throw new Error('geometry must be finite');
    if (rx < 0 || ry < 0) throw new Error('dimensions must be non-negative');
    this.#cx = cx;
    this.#cy = cy;
    this.#rx = rx;
    this.#ry = ry;
    if (fill !== undefined) super.set('fill', fill);
  }
  get type(): string { return 'ellipse'; }
  details(): string { return `cx=${this.#cx} cy=${this.#cy} rx=${this.#rx} ry=${this.#ry}` + this.styles(); }

  override attributes(): Map<string, string> {
    const attributes = super.attributes();
    attributes.set('cx', String(this.#cx));
    attributes.set('cy', String(this.#cy));
    attributes.set('rx', String(this.#rx));
    attributes.set('ry', String(this.#ry));
    return attributes;
  }
  clone(): Ellipse { const copy = new Ellipse(this.id, this.#cx, this.#cy, this.#rx, this.#ry); this.copyStyles(copy); return copy; }
  move(dx: number, dy: number): void { this.#cx = this.finite(this.#cx + dx); this.#cy = this.finite(this.#cy + dy); }
  scale(factor: number): void { this.#cx = this.finite(this.#cx * factor); this.#cy = this.finite(this.#cy * factor); this.#rx = this.finite(this.#rx * factor); this.#ry = this.finite(this.#ry * factor); }
  override set(attr: string, value: string): void {
    if (attr === 'cx') { const n = Number(value); if (value.trim() === '' || !Number.isFinite(n)) throw new Error('invalid value for cx'); this.#cx = n; return; }
    if (attr === 'cy') { const n = Number(value); if (value.trim() === '' || !Number.isFinite(n)) throw new Error('invalid value for cy'); this.#cy = n; return; }
    if (attr === 'rx') { const n = Number(value); if (value.trim() === '' || !Number.isFinite(n) || n < 0) throw new Error('invalid value for rx'); this.#rx = n; return; }
    if (attr === 'ry') { const n = Number(value); if (value.trim() === '' || !Number.isFinite(n) || n < 0) throw new Error('invalid value for ry'); this.#ry = n; return; }
    super.set(attr, value);
  }
}
