import { Shape } from './Shape.ts';
export class Text extends Shape {
  #x: number;
  #y: number;
  #content: string;
  constructor(id: string, x: number, y: number, content: string) {
    super(id);
    if (![ x, y ].every(Number.isFinite)) throw new Error('geometry must be finite');
    this.#x = x;
    this.#y = y;
    this.#content = content;
  }
  get type(): string { return 'text'; }
  details(): string { return `x=${this.#x} y=${this.#y}` + ` ${JSON.stringify(this.#content)}` + this.styles(); }

  clone(): Text { const copy = new Text(this.id, this.#x, this.#y, this.#content); this.copyStyles(copy); return copy; }
  move(dx: number, dy: number): void { this.#x = this.finite(this.#x + dx); this.#y = this.finite(this.#y + dy); }
  scale(factor: number): void { this.#x = this.finite(this.#x * factor); this.#y = this.finite(this.#y * factor); }
  override set(attr: string, value: string): void {
    if (attr === 'x') { const n = Number(value); if (value.trim() === '' || !Number.isFinite(n)) throw new Error('invalid value for x'); this.#x = n; return; }
    if (attr === 'y') { const n = Number(value); if (value.trim() === '' || !Number.isFinite(n)) throw new Error('invalid value for y'); this.#y = n; return; }
    if (attr === 'text') { this.#content = value; return; }
    super.set(attr, value);
  }
}
