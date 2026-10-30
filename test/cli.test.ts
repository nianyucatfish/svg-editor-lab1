import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
test('CLI process replays a transcript and keeps accepting commands after errors', () => {
  const input = [
    'init 800 600', 'create g node',
    'create rect r 10 20 100 50 blue in node',
    'create text label 20 40 "你好 SVG" in node',
    'move node 5 10', 'undo', 'redo',
    'set label text "updated"', 'scale node 0', 'tree', 'show r', ''
  ].join('\n');
  const result = spawnSync(process.execPath, ['--experimental-strip-types', 'src/cli/Main.ts'], { input, encoding: 'utf8', timeout: 5000 });
  assert.equal(result.status, 0); assert.equal(result.stderr, '');
  assert.match(result.stdout, /error: scale factor must be positive/);
  assert.match(result.stdout, /rect#r x=15 y=30 width=100 height=50 fill=blue/);
  assert.match(result.stdout, /text#label x=25 y=50 "updated"/);
});
