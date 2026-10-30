import { Editor } from '../application/Editor.ts';
import type { Command } from '../application/Command.ts';
import { CreateCommand } from '../application/CreateCommand.ts';
import { InitCommand } from '../application/InitCommand.ts';
import { DisplayCommand } from '../application/DisplayCommand.ts';
import { Tokenizer } from './Tokenizer.ts';
export class CommandDispatcher {
  readonly #tokenizer = new Tokenizer();
  readonly #commands: Map<string, Command>;
  constructor(editor: Editor) {
    // Allowed name dispatch point; replace with registration in a later phase.
    this.#commands = new Map<string, Command>([
      ['init', new InitCommand(editor)],
      ['create', new CreateCommand(editor)],
      ['tree', new DisplayCommand(args => {
        if (args.length > 1) throw new Error('usage: tree [id]');
        return editor.drawing.tree(args[0]);
      })],
      ['show', new DisplayCommand(args => {
        if (args.length !== 1) throw new Error('usage: show <id>');
        return editor.drawing.show(args[0]);
      })],
      ['canvas', new DisplayCommand(args => {
        if (args.length) throw new Error('step 1 supports canvas query only');
        return editor.drawing.size();
      })],
      ['help', new DisplayCommand(args => {
        if (args.length) throw new Error('usage: help');
        return 'Step 1 commands:\ninit [w] [h]\ncreate <rect|circle|ellipse|line|text|g> <id> [params] [in <containerId>]\ncanvas\ntree [id]\nshow <id>\nhelp\nOther assignment commands will be added in later steps. Ctrl+D to exit.';
      })]
    ]);
  }
  execute(line: string): string {
    try {
      const [name, ...args] = this.#tokenizer.parse(line);
      if (!name) return '';
      const command = this.#commands.get(name);
      if (!command) throw new Error(`unknown command: ${name}`);
      return command.execute(args);
    } catch (error) {
      return `error: ${error instanceof Error ? error.message.replace(/[\r\n]+/g, ' ') : 'command failed'}`;
    }
  }
}
