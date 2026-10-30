import { Editor } from '../application/Editor.ts';
import type { Command } from '../application/Command.ts';
import { CreateCommand } from '../application/CreateCommand.ts';
import { InitCommand } from '../application/InitCommand.ts';
import { DisplayCommand } from '../application/DisplayCommand.ts';
import { EditingCommands } from '../application/EditingCommands.ts';
import { Tokenizer } from './Tokenizer.ts';
export class CommandDispatcher {
  readonly #tokenizer = new Tokenizer();
  readonly #commands: Map<string, Command>;
  constructor(editor: Editor) {
    const editing = new EditingCommands(editor);
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
      ['canvas', editing.canvas()],
      ['move', editing.move()], ['scale', editing.scale()], ['set', editing.set()],
      ['delete', editing.delete()], ['group', editing.group()], ['ungroup', editing.ungroup()],
      ['addto', editing.addto()], ['front', editing.reorder(true)], ['back', editing.reorder(false)],
      ['undo', editing.history(false)], ['redo', editing.history(true)],
      ['help', new DisplayCommand(args => {
        if (args.length) throw new Error('usage: help');
        return 'Commands (step 2):\ninit [w] [h]\ncreate <rect|circle|ellipse|line|text|g> <id> [params] [in <containerId>]\ncanvas [w h]\nmove <id> <dx> <dy>\nscale <id> <factor>\nset <id> <attr> <value>\ndelete <id>\ngroup <newGid> <id1> [id2...]\nungroup <gid>\naddto <gid> <id>\nfront <id> / back <id>\nundo / redo\ntree [id]\nshow <id>\nhelp\nSVG read/save will be added in the next step. Ctrl+D to exit.';
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
