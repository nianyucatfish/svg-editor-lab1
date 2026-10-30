export abstract class Shape {
  readonly #id: string;
  #parent: Group | null = null;
  constructor(id: string) {
    if (!id || /\s/.test(id)) throw new Error(`invalid id: ${id}`);
    this.#id = id;
  }
  get id(): string { return this.#id; }
  get parent(): Group | null { return this.#parent; }
  abstract get type(): string;
  abstract details(): string;
  abstract clone(): Shape;
  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  #extras = new Map<string, string>();
  importPresentation(name: string, value: string): void { this.#extras.set(name, value); }
  attributes(): Map<string, string> { return new Map([['id', this.id], ...this.#styles, ...this.#extras]); }
  get isContainer(): boolean { return false; }
  content(): string | null { return null; }
  children(): readonly Shape[] { return []; }
  #styles = new Map<string, string>();
  protected copyStyles(target: Shape): void { target.#styles = new Map(this.#styles); target.#extras = new Map(this.#extras); }
  protected styles(): string { return [...this.#styles].map(([k, v]) => ` ${k}=${v}`).join(''); }
  set(attr: string, value: string): void {
    if (!['fill', 'stroke', 'stroke-width'].includes(attr)) throw new Error(`unknown attribute: ${attr}`);
    if (attr === 'stroke-width' && (value.trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0)) throw new Error('stroke-width must be non-negative');
    this.#styles.set(attr, value);
  }
  detach(): void { this.#parent = null; }
  protected finite(value: number): number {
    if (!Number.isFinite(value)) throw new Error('geometry must be finite');
    return value;
  }
  attachTo(parent: Group): void {
    if (this.#parent) throw new Error(`shape already attached: ${this.id}`);
    this.#parent = parent;
  }
  summary(): string { return `${this.type}#${this.id}${this.details() ? ' ' + this.details() : ''}`; }
  lines(prefix = '', branch = ''): string[] { return [prefix + branch + this.summary()]; }
}
import type { Group } from './Group.ts';
