import type { Command } from './Command.ts';
import { Editor } from './Editor.ts';
import { ShapeFactory } from './ShapeFactory.ts';
export class CreateCommand implements Command {
  readonly #editor: Editor;
  readonly #factory = new ShapeFactory();
  constructor(editor: Editor) { this.#editor = editor; }
  execute(args: string[]): string {
    const drawing = this.#editor.drawing;
    if (args.length < 2) throw new Error('usage: create <type> <id> [params] [in <containerId>]');
    const [type, id, ...params] = args;
    let parentId: string | undefined;
    if (params.length >= 2 && params.at(-2) === 'in') {
      parentId = params.pop();
      params.pop();
    }
    const shape = this.#factory.create(type, id, params);
    drawing.add(shape, parentId);
    return `${type}#${id} created${parentId === undefined ? '' : ` in g#${parentId}`}`;
  }
}
