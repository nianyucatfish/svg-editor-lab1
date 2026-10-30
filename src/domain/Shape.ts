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
  attachTo(parent: Group): void {
    if (this.#parent) throw new Error(`shape already attached: ${this.id}`);
    this.#parent = parent;
  }
  summary(): string { return `${this.type}#${this.id}${this.details() ? ' ' + this.details() : ''}`; }
  lines(prefix = '', branch = ''): string[] { return [prefix + branch + this.summary()]; }
}
import type { Group } from './Group.ts';
