import { createInterface } from 'node:readline';
import { Editor } from './application/Editor.ts';
import { CommandDispatcher } from './cli/CommandDispatcher.ts';
import { LocalDocumentStore } from './infrastructure/LocalDocumentStore.ts';
const dispatcher = new CommandDispatcher(new Editor(), new LocalDocumentStore());
const terminal = Boolean(process.stdin.isTTY && process.stdout.isTTY);
const input = createInterface({ input: process.stdin, output: process.stdout, terminal });
if (terminal) {
  console.log("svg-editor 0.1 — step 3 — type 'help' for commands");
  input.setPrompt('svg> ');
  input.prompt();
}
input.on('line', line => {
  const result = dispatcher.execute(line);
  if (result) console.log(result);
  if (terminal) input.prompt();
});
