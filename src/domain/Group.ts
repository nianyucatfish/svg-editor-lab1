import { Shape } from './Shape.ts';
export class Group extends Shape {
  #children: Shape[] = [];
  get type(): string { return 'g'; }
  details(): string { return this.styles().trim(); }
  override get isContainer(): boolean { return true; }
  override children(): readonly Shape[] { return [...this.#children]; }
  clone(): Group {
    const copy = new Group(this.id);
    this.copyStyles(copy);
    this.#children.forEach(child => copy.add(child.clone()));
    return copy;
  }
  move(dx: number, dy: number): void { this.#children.forEach(child => child.move(dx, dy)); }
  scale(factor: number): void { this.#children.forEach(child => child.scale(factor)); }
  remove(shape: Shape): number {
    const index = this.#children.indexOf(shape);
    if (index < 0) throw new Error(`no such child: ${shape.id}`);
    this.#children.splice(index, 1); shape.detach(); return index;
  }
  insert(shape: Shape, index: number): void { this.add(shape); this.#children.pop(); this.#children.splice(index, 0, shape); }
  add(shape: Shape): void {
    for (let node: Shape | null = this; node; node = node.parent) {
      if (node === shape) throw new Error('cannot create container cycle');
    }
    shape.attachTo(this);
    this.#children.push(shape);
  }
  override lines(prefix = '', branch = ''): string[] {
    const lines = super.lines(prefix, branch);
    const childPrefix = prefix + (branch ? (branch === '└── ' ? '    ' : '│   ') : '');
    this.#children.forEach((shape, index) => {
      lines.push(...shape.lines(childPrefix, index === this.#children.length - 1 ? '└── ' : '├── '));
    });
    return lines;
  }
  childLines(): string[] {
    return this.#children.flatMap((shape, index) => shape.lines('', index === this.#children.length - 1 ? '└── ' : '├── '));
  }
}
