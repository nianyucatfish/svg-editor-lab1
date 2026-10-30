import { createInterface } from 'node:readline';
import { Editor } from '../application/Editor.ts';
import { CommandDispatcher } from './CommandDispatcher.ts';
const dispatcher = new CommandDispatcher(new Editor());
const terminal = Boolean(process.stdin.isTTY && process.stdout.isTTY);
const input = createInterface({ input: process.stdin, output: process.stdout, terminal });
if (terminal) {
  console.log("svg-editor 0.1 — step 1 — type 'help' for commands");
  input.setPrompt('svg> ');
  input.prompt();
}
input.on('line', line => {
  const result = dispatcher.execute(line);
  if (result) console.log(result);
  if (terminal) input.prompt();
});
