import { Shape } from './Shape.ts';
export class Circle extends Shape {
  readonly #cx: number;
  readonly #cy: number;
  readonly #r: number;
  readonly #fill: string | undefined;
  constructor(id: string, cx: number, cy: number, r: number, fill?: string) {
    super(id);
    if (![ cx, cy, r ].every(Number.isFinite)) throw new Error('geometry must be finite');
    if (r < 0) throw new Error('dimensions must be non-negative');
    this.#cx = cx;
    this.#cy = cy;
    this.#r = r;
    this.#fill = fill;
  }
  get type(): string { return 'circle'; }
  details(): string { return `cx=${this.#cx} cy=${this.#cy} r=${this.#r}` + (this.#fill === undefined ? '' : ` fill=${this.#fill}`); }
}
