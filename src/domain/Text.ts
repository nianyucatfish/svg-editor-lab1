import { Shape } from './Shape.ts';
export class Text extends Shape {
  readonly #x: number;
  readonly #y: number;
  readonly #content: string;
  constructor(id: string, x: number, y: number, content: string) {
    super(id);
    if (![ x, y ].every(Number.isFinite)) throw new Error('geometry must be finite');
    this.#x = x;
    this.#y = y;
    this.#content = content;
  }
  get type(): string { return 'text'; }
  details(): string { return `x=${this.#x} y=${this.#y}` + ` ${JSON.stringify(this.#content)}`; }
}
