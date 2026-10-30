import { Shape } from './Shape.ts';
export class Line extends Shape {
  readonly #x1: number;
  readonly #y1: number;
  readonly #x2: number;
  readonly #y2: number;
  readonly #stroke: string | undefined;
  constructor(id: string, x1: number, y1: number, x2: number, y2: number, stroke?: string) {
    super(id);
    if (![ x1, y1, x2, y2 ].every(Number.isFinite)) throw new Error('geometry must be finite');
    this.#x1 = x1;
    this.#y1 = y1;
    this.#x2 = x2;
    this.#y2 = y2;
    this.#stroke = stroke;
  }
  get type(): string { return 'line'; }
  details(): string { return `x1=${this.#x1} y1=${this.#y1} x2=${this.#x2} y2=${this.#y2}` + (this.#stroke === undefined ? '' : ` stroke=${this.#stroke}`); }
}
