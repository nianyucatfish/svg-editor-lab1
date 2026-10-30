import { Shape } from './Shape.ts';
export class Line extends Shape {
  #x1: number;
  #y1: number;
  #x2: number;
  #y2: number;
  constructor(id: string, x1: number, y1: number, x2: number, y2: number, stroke?: string) {
    super(id);
    if (![ x1, y1, x2, y2 ].every(Number.isFinite)) throw new Error('geometry must be finite');
    this.#x1 = x1;
    this.#y1 = y1;
    this.#x2 = x2;
    this.#y2 = y2;
    if (stroke !== undefined) super.set('stroke', stroke);
  }
  get type(): string { return 'line'; }
  details(): string { return `x1=${this.#x1} y1=${this.#y1} x2=${this.#x2} y2=${this.#y2}` + this.styles(); }

  override attributes(): Map<string, string> {
    const attributes = super.attributes();
    attributes.set('x1', String(this.#x1));
    attributes.set('y1', String(this.#y1));
    attributes.set('x2', String(this.#x2));
    attributes.set('y2', String(this.#y2));
    return attributes;
  }
  clone(): Line { const copy = new Line(this.id, this.#x1, this.#y1, this.#x2, this.#y2); this.copyStyles(copy); return copy; }
  move(dx: number, dy: number): void { this.#x1 = this.finite(this.#x1 + dx); this.#y1 = this.finite(this.#y1 + dy); this.#x2 = this.finite(this.#x2 + dx); this.#y2 = this.finite(this.#y2 + dy); }
  scale(factor: number): void { this.#x1 = this.finite(this.#x1 * factor); this.#y1 = this.finite(this.#y1 * factor); this.#x2 = this.finite(this.#x2 * factor); this.#y2 = this.finite(this.#y2 * factor); }
  override set(attr: string, value: string): void {
    if (attr === 'x1') { const n = Number(value); if (value.trim() === '' || !Number.isFinite(n)) throw new Error('invalid value for x1'); this.#x1 = n; return; }
    if (attr === 'y1') { const n = Number(value); if (value.trim() === '' || !Number.isFinite(n)) throw new Error('invalid value for y1'); this.#y1 = n; return; }
    if (attr === 'x2') { const n = Number(value); if (value.trim() === '' || !Number.isFinite(n)) throw new Error('invalid value for x2'); this.#x2 = n; return; }
    if (attr === 'y2') { const n = Number(value); if (value.trim() === '' || !Number.isFinite(n)) throw new Error('invalid value for y2'); this.#y2 = n; return; }
    super.set(attr, value);
  }
}
