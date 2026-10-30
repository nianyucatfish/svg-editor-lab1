import { Shape } from './Shape.ts';
export class Rect extends Shape {
  #x: number;
  #y: number;
  #width: number;
  #height: number;
  constructor(id: string, x: number, y: number, width: number, height: number, fill?: string) {
    super(id);
    if (![ x, y, width, height ].every(Number.isFinite)) throw new Error('geometry must be finite');
    if (width < 0 || height < 0) throw new Error('dimensions must be non-negative');
    this.#x = x;
    this.#y = y;
    this.#width = width;
    this.#height = height;
    if (fill !== undefined) super.set('fill', fill);
  }
  get type(): string { return 'rect'; }
  details(): string { return `x=${this.#x} y=${this.#y} width=${this.#width} height=${this.#height}` + this.styles(); }

  clone(): Rect { const copy = new Rect(this.id, this.#x, this.#y, this.#width, this.#height); this.copyStyles(copy); return copy; }
  move(dx: number, dy: number): void { this.#x = this.finite(this.#x + dx); this.#y = this.finite(this.#y + dy); }
  scale(factor: number): void { this.#x = this.finite(this.#x * factor); this.#y = this.finite(this.#y * factor); this.#width = this.finite(this.#width * factor); this.#height = this.finite(this.#height * factor); }
  override set(attr: string, value: string): void {
    if (attr === 'x') { const n = Number(value); if (value.trim() === '' || !Number.isFinite(n)) throw new Error('invalid value for x'); this.#x = n; return; }
    if (attr === 'y') { const n = Number(value); if (value.trim() === '' || !Number.isFinite(n)) throw new Error('invalid value for y'); this.#y = n; return; }
    if (attr === 'width') { const n = Number(value); if (value.trim() === '' || !Number.isFinite(n) || n < 0) throw new Error('invalid value for width'); this.#width = n; return; }
    if (attr === 'height') { const n = Number(value); if (value.trim() === '' || !Number.isFinite(n) || n < 0) throw new Error('invalid value for height'); this.#height = n; return; }
    super.set(attr, value);
  }
}
