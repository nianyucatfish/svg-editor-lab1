import { Editor } from './Editor.ts';
import { DisplayCommand } from './DisplayCommand.ts';
import type { DocumentStore } from './DocumentStore.ts';
import type { Command } from './Command.ts';
export class FileCommands {
  readonly #editor: Editor;
  readonly #store: DocumentStore;
  constructor(editor: Editor, store: DocumentStore) { this.#editor = editor; this.#store = store; }
  read(): Command {
    return new DisplayCommand(args => {
      if (args.length !== 1 || !args[0]) throw new Error('usage: read <file.svg>');
      const { drawing, warnings } = this.#store.read(args[0]);
      this.#editor.loaded(drawing, args[0]);
      return [...warnings, `read ${args[0]} (${drawing.count} elements)`].join('\n');
    });
  }
  save(): Command {
    return new DisplayCommand(args => {
      const drawing = this.#editor.drawing;
      if (args.length > 1) throw new Error('usage: save [file.svg]');
      const path = args[0] ?? this.#editor.path;
      if (!path) throw new Error('cannot write file: no path. use save <file.svg>');
      this.#store.write(path, drawing);
      this.#editor.saved(path);
      return `saved to ${path} (${drawing.count} elements)`;
    });
  }
}
