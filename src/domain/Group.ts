import { Shape } from './Shape.ts';
export class Group extends Shape {
  #children: Shape[] = [];
  get type(): string { return 'g'; }
  details(): string { return ''; }
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
