import { Rect } from '../domain/Rect.ts';
import { Circle } from '../domain/Circle.ts';
import { Ellipse } from '../domain/Ellipse.ts';
import { Line } from '../domain/Line.ts';
import { Text } from '../domain/Text.ts';
import { Group } from '../domain/Group.ts';
import type { Shape } from '../domain/Shape.ts';
export class ShapeFactory {
  create(type: string, id: string, args: string[]): Shape {
    // Allowed name dispatch point; replace with registered providers in plugin phase.
    const providers: Record<string, { min: number; max: number; numbers: number; build: () => Shape }> = {
      rect: { min: 4, max: 5, numbers: 4, build: () => new Rect(id, +args[0], +args[1], +args[2], +args[3], args[4]) },
      circle: { min: 3, max: 4, numbers: 3, build: () => new Circle(id, +args[0], +args[1], +args[2], args[3]) },
      ellipse: { min: 4, max: 5, numbers: 4, build: () => new Ellipse(id, +args[0], +args[1], +args[2], +args[3], args[4]) },
      line: { min: 4, max: 5, numbers: 4, build: () => new Line(id, +args[0], +args[1], +args[2], +args[3], args[4]) },
      text: { min: 3, max: 3, numbers: 2, build: () => new Text(id, +args[0], +args[1], args[2]) },
      g: { min: 0, max: 0, numbers: 0, build: () => new Group(id) }
    };
    const provider = Object.hasOwn(providers, type) ? providers[type] : undefined;
    if (!provider) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    if (args.length < provider.min || args.length > provider.max) throw new Error(`invalid parameters for ${type}`);
    if (!args.slice(0, provider.numbers).every(s => s.trim() !== '' && Number.isFinite(Number(s)))) throw new Error('geometry must be finite');
    return provider.build();
  }
}
