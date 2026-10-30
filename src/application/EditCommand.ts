import type { Command } from './Command.ts';
import type { Drawing } from '../domain/Drawing.ts';
import { Editor } from './Editor.ts';
export class EditCommand implements Command {
  readonly #editor: Editor;
  readonly #action: (drawing: Drawing, args: string[]) => string;
  #before: Drawing | null = null;
  #after: Drawing | null = null;
  constructor(editor: Editor, action: (drawing: Drawing, args: string[]) => string) {
    this.#editor = editor; this.#action = action;
  }
  execute(args: string[]): string {
    // Execute on an isolated document so failure preserves both drawing and history.
    this.#before = this.#editor.drawing;
    const candidate = this.#before.clone();
    const result = this.#action(candidate, args);
    this.#after = candidate;
    this.#editor.replace(candidate);
    this.#editor.record(this);
    return result;
  }
  undo(): void { this.#editor.replace(this.#before!); }
  redo(): void { this.#editor.replace(this.#after!); }
}
