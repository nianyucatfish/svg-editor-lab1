import { Rect } from '../domain/Rect.ts';
import { Circle } from '../domain/Circle.ts';
import { Ellipse } from '../domain/Ellipse.ts';
import { Line } from '../domain/Line.ts';
import { Text } from '../domain/Text.ts';
import { Group } from '../domain/Group.ts';
import type { Shape } from '../domain/Shape.ts';
export class ShapeFactory {
  // Single type-name dispatch point, shared by CLI creation and SVG import.
  // Replace with provider registration in the plugin phase.
  readonly #providers = new Map<string, {
    fields: string[]; min: number; max: number; build: (id: string, args: string[]) => Shape;
  }>([
    ['rect', { fields: ['x','y','width','height'], min: 4, max: 5, build: (id, a) => new Rect(id, +a[0], +a[1], +a[2], +a[3], a[4]) }],
    ['circle', { fields: ['cx','cy','r'], min: 3, max: 4, build: (id, a) => new Circle(id, +a[0], +a[1], +a[2], a[3]) }],
    ['ellipse', { fields: ['cx','cy','rx','ry'], min: 4, max: 5, build: (id, a) => new Ellipse(id, +a[0], +a[1], +a[2], +a[3], a[4]) }],
    ['line', { fields: ['x1','y1','x2','y2'], min: 4, max: 5, build: (id, a) => new Line(id, +a[0], +a[1], +a[2], +a[3], a[4]) }],
    ['text', { fields: ['x','y'], min: 3, max: 3, build: (id, a) => new Text(id, +a[0], +a[1], a[2]) }],
    ['g', { fields: [], min: 0, max: 0, build: id => new Group(id) }]
  ]);
  #provider(type: string) {
    const provider = this.#providers.get(type);
    if (!provider) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return provider;
  }
  create(type: string, id: string, args: string[]): Shape {
    const provider = this.#provider(type);
    if (args.length < provider.min || args.length > provider.max) throw new Error(`invalid parameters for ${type}`);
    if (!args.slice(0, provider.fields.length).every(s => s.trim() !== '' && Number.isFinite(Number(s)))) throw new Error('geometry must be finite');
    return provider.build(id, args);
  }
  fromSvg(type: string, id: string, attributes: Map<string, string>, content: string): Shape {
    const provider = this.#provider(type);
    const args = provider.fields.map(name => attributes.get(name) ?? '0');
    if (provider.min > provider.fields.length) args.push(content);
    const shape = this.create(type, id, args);
    for (const [name, value] of attributes) {
      if (provider.fields.includes(name) || name === 'id' || name === 'xmlns') continue;
      if (['fill', 'stroke', 'stroke-width'].includes(name)) shape.set(name, value);
      else if (['text-anchor', 'font-size', 'font-family', 'font-weight', 'opacity', 'fill-opacity', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin', 'data-kind'].includes(name)) shape.importPresentation(name, value);
      else throw new Error(`unsupported SVG attribute: ${name}`);
    }
    return shape;
  }
}
