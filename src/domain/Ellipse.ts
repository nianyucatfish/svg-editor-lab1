import { Shape } from './Shape.ts';
export class Ellipse extends Shape {
  readonly #cx: number;
  readonly #cy: number;
  readonly #rx: number;
  readonly #ry: number;
  readonly #fill: string | undefined;
  constructor(id: string, cx: number, cy: number, rx: number, ry: number, fill?: string) {
    super(id);
    if (![ cx, cy, rx, ry ].every(Number.isFinite)) throw new Error('geometry must be finite');
    if (rx < 0 || ry < 0) throw new Error('dimensions must be non-negative');
    this.#cx = cx;
    this.#cy = cy;
    this.#rx = rx;
    this.#ry = ry;
    this.#fill = fill;
  }
  get type(): string { return 'ellipse'; }
  details(): string { return `cx=${this.#cx} cy=${this.#cy} rx=${this.#rx} ry=${this.#ry}` + (this.#fill === undefined ? '' : ` fill=${this.#fill}`); }
}
