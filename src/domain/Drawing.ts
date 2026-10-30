import { Group } from './Group.ts';
import { Shape } from './Shape.ts';
export class Drawing {
  #presentation = new Map<string, string>();
  setPresentation(attributes: Map<string, string>): void { this.#presentation = new Map(attributes); }
  presentation(): ReadonlyMap<string, string> { return new Map(this.#presentation); }
  #width: number;
  #height: number;
  readonly #root = new Group('_root');
  readonly #shapes = new Map<string, Shape>();
  constructor(width = 800, height = 600) {
    if (![width, height].every(n => Number.isFinite(n) && n > 0)) throw new Error('canvas dimensions must be positive');
    this.#width = width;
    this.#height = height;
  }
  clone(): Drawing {
    const copy = new Drawing(this.#width, this.#height);
    copy.setPresentation(this.#presentation);
    const register = (shape: Shape): void => {
      copy.#shapes.set(shape.id, shape);
      if (shape instanceof Group) shape.children().forEach(register);
    };
    this.#root.children().forEach(shape => { const child = shape.clone(); copy.#root.add(child); register(child); });
    return copy;
  }
  resize(width: number, height: number): void {
    if (![width, height].every(n => Number.isFinite(n) && n > 0)) throw new Error('canvas dimensions must be positive');
    this.#width = width; this.#height = height;
  }
  delete(id: string): void {
    const shape = this.find(id);
    shape.parent!.remove(shape);
    const unregister = (node: Shape): void => {
      this.#shapes.delete(node.id);
      if (node instanceof Group) node.children().forEach(unregister);
    };
    unregister(shape);
  }
  container(id: string): Group {
    const shape = this.find(id);
    if (!(shape instanceof Group)) throw new Error(`not a container: ${id}`);
    return shape;
  }
  // Reparenting must preserve SVG presentation inherited from the old ancestors.
  // Opacity is intentionally absent: SVG group opacity is compositing, not inheritance.
  readonly #inheritedDefaults = new Map<string, string>([
    ['fill', 'black'], ['stroke', 'none'], ['stroke-width', '1'],
    ['fill-opacity', '1'], ['stroke-opacity', '1'], ['stroke-linecap', 'butt'],
    ['stroke-linejoin', 'miter'], ['font-size', '16'], ['font-family', 'serif'],
    ['font-weight', 'normal'], ['text-anchor', 'start']
  ]);
  #inheritedPresentation(shape: Shape): Map<string, string> {
    const result = new Map(this.#inheritedDefaults);
    const apply = (attributes: ReadonlyMap<string, string>): void => {
      for (const key of this.#inheritedDefaults.keys()) {
        const value = attributes.get(key);
        if (value !== undefined && value !== 'inherit') result.set(key, value);
      }
    };
    apply(this.#presentation);
    const lineage: Shape[] = [];
    for (let current: Shape | null = shape; current && current !== this.#root; current = current.parent) lineage.push(current);
    lineage.reverse().forEach(node => apply(node.attributes()));
    return result;
  }
  #preservePresentation(shape: Shape, previous: ReadonlyMap<string, string>): void {
    const current = this.#inheritedPresentation(shape);
    for (const [name, value] of previous) {
      if (current.get(name) === value) continue;
      if (['fill', 'stroke', 'stroke-width'].includes(name)) shape.set(name, value);
      else shape.importPresentation(name, value);
    }
  }
  addto(gid: string, id: string): void {
    const group = this.container(gid), shape = this.find(id);
    for (let node: Shape | null = group; node; node = node.parent) {
      if (node === shape) throw new Error(`cannot group a container into its own descendant: ${id}`);
    }
    const presentation = this.#inheritedPresentation(shape);
    shape.parent!.remove(shape); group.add(shape);
    this.#preservePresentation(shape, presentation);
  }
  group(gid: string, ids: string[]): void {
    if (this.#shapes.has(gid)) throw new Error(`id already exists: ${gid}`);
    if (new Set(ids).size !== ids.length) throw new Error('duplicate group member');
    const shapes = ids.map(id => this.find(id));
    for (const shape of shapes) {
      for (let parent = shape.parent; parent; parent = parent.parent) {
        if (shapes.includes(parent)) throw new Error(`cannot group a container into its own descendant: ${parent.id}`);
      }
    }
    // Preserve document traversal order, even when arguments are reversed.
    const selected = new Set(shapes), ordered: Shape[] = [];
    const visit = (node: Shape): void => {
      if (selected.has(node)) ordered.push(node);
      if (node instanceof Group) node.children().forEach(visit);
    };
    this.#root.children().forEach(visit);
    const presentations = ordered.map(shape => this.#inheritedPresentation(shape));
    const group = new Group(gid);
    const parent = ordered[0].parent!;
    const index = parent.children().indexOf(ordered[0]);
    ordered.forEach(shape => { shape.parent!.remove(shape); group.add(shape); });
    parent.insert(group, index); this.#shapes.set(gid, group);
    ordered.forEach((shape, index) => this.#preservePresentation(shape, presentations[index]));
  }
  ungroup(gid: string): void {
    const group = this.container(gid), parent = group.parent!;
    if (parent === this.#root) throw new Error(`cannot ungroup top-level container: ${gid}`);
    const children = group.children();
    const presentations = children.map(child => this.#inheritedPresentation(child));
    const index = parent.remove(group);
    children.forEach((child, offset) => {
      group.remove(child); parent.insert(child, index + offset);
      this.#preservePresentation(child, presentations[offset]);
    });
    this.#shapes.delete(gid);
  }
  reorder(id: string, front: boolean): void {
    const shape = this.find(id), parent = shape.parent!;
    parent.remove(shape);
    parent.insert(shape, front ? parent.children().length : 0);
  }
  elements(): readonly Shape[] { return this.#root.children(); }
  get width(): number { return this.#width; }
  get height(): number { return this.#height; }
  get count(): number { return this.#shapes.size; }
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
