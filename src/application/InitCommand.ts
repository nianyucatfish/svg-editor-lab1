import type { Command } from './Command.ts';
import { Editor } from './Editor.ts';
export class InitCommand implements Command {
  readonly #editor: Editor;
  constructor(editor: Editor) { this.#editor = editor; }
  execute(args: string[]): string {
    if (args.length > 2) throw new Error('usage: init [w] [h]');
    return this.#editor.init(args[0] === undefined ? 800 : Number(args[0]), args[1] === undefined ? 600 : Number(args[1]));
  }
}
