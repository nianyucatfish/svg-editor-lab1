import { Shape } from './Shape.ts';
export class Rect extends Shape {
  readonly #x: number;
  readonly #y: number;
  readonly #width: number;
  readonly #height: number;
  readonly #fill: string | undefined;
  constructor(id: string, x: number, y: number, width: number, height: number, fill?: string) {
    super(id);
    if (![ x, y, width, height ].every(Number.isFinite)) throw new Error('geometry must be finite');
    if (width < 0 || height < 0) throw new Error('dimensions must be non-negative');
    this.#x = x;
    this.#y = y;
    this.#width = width;
    this.#height = height;
    this.#fill = fill;
  }
  get type(): string { return 'rect'; }
  details(): string { return `x=${this.#x} y=${this.#y} width=${this.#width} height=${this.#height}` + (this.#fill === undefined ? '' : ` fill=${this.#fill}`); }
}
