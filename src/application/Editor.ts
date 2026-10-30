import { Drawing } from '../domain/Drawing.ts';
import type { EditCommand } from './EditCommand.ts';
export class Editor {
  #drawing: Drawing | null = null;
  #undo: EditCommand[] = [];
  #redo: EditCommand[] = [];
  #blocked = true;
  #path: string | null = null;
  get path(): string | null { return this.#path; }
  loaded(drawing: Drawing, path: string): void { this.replace(drawing); this.#path = path; this.barrier(); }
  saved(path: string): void { this.#path = path; this.barrier(); }
  get drawing(): Drawing {
    if (!this.#drawing) throw new Error("no document. use 'init' or 'read' first");
    return this.#drawing;
  }
  replace(drawing: Drawing): void { this.#drawing = drawing; }
  record(command: EditCommand): void {
    this.#undo.push(command); this.#redo = []; this.#blocked = false;
  }
  barrier(): void { this.#undo = []; this.#redo = []; this.#blocked = true; }
  undo(): string {
    this.drawing;
    if (this.#blocked) throw new Error('undo not allowed after io command');
    const command = this.#undo.pop();
    if (!command) throw new Error('nothing to undo');
    command.undo(); this.#redo.push(command); return 'edit undone';
  }
  redo(): string {
    this.drawing;
    if (this.#blocked) throw new Error('undo not allowed after io command');
    const command = this.#redo.pop();
    if (!command) throw new Error('nothing to redo');
    command.redo(); this.#undo.push(command); return 'edit redone';
  }
  resize(width: number, height: number): string {
    const candidate = this.drawing.clone(); candidate.resize(width, height);
    this.replace(candidate); this.barrier(); return `canvas resized to ${candidate.size()}`;
  }
  init(width = 800, height = 600): string {
    const drawing = new Drawing(width, height);
    this.replace(drawing); this.#path = null; this.barrier();
    return `canvas ${drawing.size()} created`;
  }
}
