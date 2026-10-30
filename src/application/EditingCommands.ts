import { Editor } from './Editor.ts';
import { EditCommand } from './EditCommand.ts';
import { DisplayCommand } from './DisplayCommand.ts';
import type { Drawing } from '../domain/Drawing.ts';
import type { Command } from './Command.ts';
export class EditingCommands {
  readonly #editor: Editor;
  constructor(editor: Editor) { this.#editor = editor; }
  #arity(args: string[], count: number, usage: string): void {
    if (args.length !== count) throw new Error(`usage: ${usage}`);
  }
  #number(value: string): number {
    if (value.trim() === '' || !Number.isFinite(Number(value))) throw new Error('expected finite number');
    return Number(value);
  }
  #edit(action: (drawing: Drawing, args: string[]) => string): Command {
    return new DisplayCommand(args => new EditCommand(this.#editor, action).execute(args));
  }
  move(): Command {
    return this.#edit((drawing, args) => {
      this.#arity(args, 3, 'move <id> <dx> <dy>');
      const shape = drawing.find(args[0]), dx = this.#number(args[1]), dy = this.#number(args[2]);
      shape.move(dx, dy); return `${shape.type}#${shape.id} moved by (${dx},${dy})`;
    });
  }
  scale(): Command {
    return this.#edit((drawing, args) => {
      this.#arity(args, 2, 'scale <id> <factor>');
      const factor = this.#number(args[1]);
      if (factor <= 0) throw new Error('scale factor must be positive');
      const shape = drawing.find(args[0]); shape.scale(factor);
      return `${shape.type}#${shape.id} scaled by ${factor}`;
    });
  }
  set(): Command {
    return this.#edit((drawing, args) => {
      this.#arity(args, 3, 'set <id> <attr> <value>');
      const shape = drawing.find(args[0]); shape.set(args[1], args[2]);
      return `${shape.type}#${shape.id} updated: ${args[1]}=${args[2]}`;
    });
  }
  delete(): Command {
    return this.#edit((drawing, args) => {
      this.#arity(args, 1, 'delete <id>'); const shape = drawing.find(args[0]);
      drawing.delete(args[0]); return `${shape.type}#${shape.id} deleted`;
    });
  }
  group(): Command {
    return this.#edit((drawing, args) => {
      if (args.length < 2) throw new Error('usage: group <newGid> <id1> [id2...]');
      drawing.group(args[0], args.slice(1)); return `g#${args[0]} created with ${args.length - 1} children`;
    });
  }
  ungroup(): Command {
    return this.#edit((drawing, args) => {
      this.#arity(args, 1, 'ungroup <gid>'); drawing.ungroup(args[0]); return `g#${args[0]} ungrouped`;
    });
  }
  addto(): Command {
    return this.#edit((drawing, args) => {
      this.#arity(args, 2, 'addto <gid> <id>'); drawing.addto(args[0], args[1]); return `${args[1]} added to g#${args[0]}`;
    });
  }
  reorder(front: boolean): Command {
    return this.#edit((drawing, args) => {
      this.#arity(args, 1, `${front ? 'front' : 'back'} <id>`);
      drawing.reorder(args[0], front); return `${args[0]} moved to ${front ? 'front' : 'back'}`;
    });
  }
  history(redo: boolean): Command {
    return new DisplayCommand(args => {
      this.#arity(args, 0, redo ? 'redo' : 'undo'); return redo ? this.#editor.redo() : this.#editor.undo();
    });
  }
  canvas(): Command {
    return new DisplayCommand(args => {
      if (!args.length) return this.#editor.drawing.size();
      this.#arity(args, 2, 'canvas [w h]'); return this.#editor.resize(this.#number(args[0]), this.#number(args[1]));
    });
  }
}
