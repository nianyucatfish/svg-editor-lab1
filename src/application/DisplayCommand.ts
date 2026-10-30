import type { Command } from './Command.ts';
export class DisplayCommand implements Command {
  readonly #action: (args: string[]) => string;
  constructor(action: (args: string[]) => string) { this.#action = action; }
  execute(args: string[]): string { return this.#action(args); }
}
