import { Group } from './Group.ts';
import { Shape } from './Shape.ts';
export class Drawing {
  readonly #width: number;
  readonly #height: number;
  readonly #root = new Group('_root');
  readonly #shapes = new Map<string, Shape>();
  constructor(width = 800, height = 600) {
    if (![width, height].every(n => Number.isFinite(n) && n > 0)) throw new Error('canvas dimensions must be positive');
    this.#width = width;
    this.#height = height;
  }
  size(): string { return `${this.#width}x${this.#height}`; }
  find(id: string): Shape {
    const shape = this.#shapes.get(id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }
  add(shape: Shape, parentId?: string): void {
    if (this.#shapes.has(shape.id)) throw new Error(`id already exists: ${shape.id}`);
    let parent = this.#root;
    if (parentId !== undefined) {
      const candidate = this.#shapes.get(parentId);
      if (!candidate) throw new Error(`no such container: ${parentId}`);
      if (!(candidate instanceof Group)) throw new Error(`not a container: ${parentId}`);
      parent = candidate;
    }
    parent.add(shape);
    this.#shapes.set(shape.id, shape);
  }
  tree(id?: string): string {
    return id === undefined ? [`svg (${this.size()})`, ...this.#root.childLines()].join('\n') : this.find(id).lines().join('\n');
  }
  show(id: string): string {
    const shape = this.find(id);
    const parent = shape.parent;
    return `${shape.type}#${shape.id}  parent=${parent === this.#root ? 'svg' : `g#${parent?.id}`}\n  ${shape.details()}`;
  }
}
