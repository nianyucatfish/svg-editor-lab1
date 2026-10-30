import { Drawing } from '../domain/Drawing.ts';
export class Editor {
  #drawing: Drawing | null = null;
  get drawing(): Drawing {
    if (!this.#drawing) throw new Error("no document. use 'init' or 'read' first");
    return this.#drawing;
  }
  init(width = 800, height = 600): string {
    const drawing = new Drawing(width, height);
    this.#drawing = drawing;
    return `canvas ${drawing.size()} created`;
  }
}
