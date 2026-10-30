import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../src/application/Editor.ts';
import { CommandDispatcher } from '../src/cli/CommandDispatcher.ts';
function session() {
  const cli = new CommandDispatcher(new Editor());
  const run = (line: string) => cli.execute(line);
  const ok = (line: string) => { const result = run(line); assert.ok(!result.startsWith('error:'), `${line}: ${result}`); return result; };
  return { run, ok };
}
test('all six types, defaults, quoting, style and geometry setters survive cloning', () => {
  const { ok } = session(); ok('init');
  ok('create g scene'); ok('create rect r 1 2 3 4 red in scene');
  ok('create circle c 1 2 3'); ok('create ellipse e 1 2 3 4');
  ok('create line l 1 2 3 4 black'); ok('create text t 1 2 "hello world"');
  ok('set r fill blue'); ok('set r stroke green'); ok('set r width 10');
  ok('set scene fill pink'); ok('set t text "你好 \\"SVG\\""');
  assert.match(ok('show r'), /width=10.*fill=blue.*stroke=green/);
  assert.match(ok('show scene'), /fill=pink/);
  ok('set t text ""'); assert.match(ok('show t'), /""/);
  assert.match(ok('tree'), /ellipse#e/);
});
test('recursive move and scale, grouped style is inherited without mutating children', () => {
  const { ok } = session(); ok('init'); ok('create g outer');
  ok('create g inner in outer'); ok('create rect r 1 2 3 4 in inner');
  ok('create text t 5 6 "hi" in inner'); ok('move outer 10 -2'); ok('scale outer 2');
  assert.match(ok('show r'), /x=22 y=0 width=6 height=8/);
  assert.match(ok('show t'), /x=30 y=8/);
  ok('set outer fill red'); assert.doesNotMatch(ok('show r'), /fill=/);
  ok('undo'); ok('undo'); assert.match(ok('show r'), /x=11 y=0 width=3 height=4/);
  ok('redo'); assert.match(ok('show r'), /x=22 y=0 width=6 height=8/);
});
test('create, delete subtree and history branching restore exact document', () => {
  const { run, ok } = session(); ok('init'); const empty = ok('tree');
  ok('create g g'); ok('create circle c 1 2 3 in g'); const before = ok('tree');
  ok('delete g'); assert.equal(ok('tree'), empty); assert.match(run('show c'), /no such shape/);
  ok('undo'); assert.equal(ok('tree'), before); ok('redo'); assert.equal(ok('tree'), empty);
  ok('undo'); ok('undo'); assert.doesNotMatch(ok('tree'), /circle/);
  ok('create text t 0 0 "new"'); assert.equal(run('redo'), 'error: nothing to redo');
});
test('group respects traversal order and ungroup restores insertion location', () => {
  const { ok } = session(); ok('init'); ok('create g outer');
  for (const id of ['a', 'b', 'c']) ok(`create circle ${id} 1 2 3 in outer`);
  const before = ok('tree'); ok('group pair b a');
  assert.match(ok('tree pair'), /circle#a[^]*circle#b/);
  ok('ungroup pair'); assert.equal(ok('tree'), before);
  ok('undo'); assert.match(ok('tree'), /g#pair/); ok('undo'); assert.equal(ok('tree'), before);
});
test('cross-parent group and reparenting preserve state through undo/redo', () => {
  const { ok } = session(); ok('init'); ok('create g p'); ok('create g q');
  ok('create circle a 1 2 3 in p'); ok('create circle b 2 3 4 in q');
  const before = ok('tree'); ok('group pair b a'); assert.match(ok('show pair'), /parent=g#p/);
  assert.match(ok('tree pair'), /circle#a[^]*circle#b/);
  ok('undo'); assert.equal(ok('tree'), before); ok('redo');
  ok('addto q pair'); assert.match(ok('show pair'), /parent=g#q/);
  ok('undo'); assert.match(ok('show pair'), /parent=g#p/);
});
test('front is last SVG sibling, back is first; history preserves ordering', () => {
  const { ok } = session(); ok('init');
  for (const id of ['a', 'b', 'c']) ok(`create circle ${id} 0 0 1`);
  const before = ok('tree'); ok('front a'); assert.match(ok('tree'), /circle#b[^]*circle#c[^]*circle#a/);
  ok('back c'); assert.match(ok('tree'), /circle#c[^]*circle#b[^]*circle#a/);
  ok('undo'); ok('undo'); assert.equal(ok('tree'), before);
});
test('failed commands preserve drawing and redo, including overflow halfway through composite', () => {
  const { run, ok } = session(); ok('init'); ok('create g g');
  ok('create rect r 1 2 3 4 in g'); ok('create circle huge 1e308 0 1 in g');
  ok('move r 1 0'); ok('undo'); const before = ok('tree');
  for (const line of [
    'scale g 2', 'scale g 0', 'scale g -1', 'move r NaN 0',
    'set r width -1', 'set r r 1', 'set r stroke-width -1',
    'create circle r 1 2 3', 'create rect bad 0 0 -1 1',
    'create g bad in absent', 'create g bad in r', 'create box bad 1 2 3 4 "title"',
    'group bad r g', 'group bad r r', 'addto g g', 'addto g absent',
    'ungroup g', 'delete absent', 'move r 1', 'set r fill "unterminated',
    'canvas -1 20', 'init 0 0'
  ]) { assert.match(run(line), /^error:/, line); assert.equal(ok('tree'), before, line); }
  ok('redo'); assert.match(ok('show r'), /x=2 y=2/);
});
test('document barriers and display commands follow history rules', () => {
  const { run, ok } = session(); assert.match(run('tree'), /no document/); ok('help'); ok('init');
  assert.equal(run('undo'), 'error: undo not allowed after io command');
  ok('create circle c 1 2 3'); ok('canvas'); ok('tree'); ok('show c'); ok('help'); ok('undo'); ok('redo');
  ok('canvas 200 300'); assert.equal(ok('canvas'), '200x300');
  assert.equal(run('redo'), 'error: undo not allowed after io command');
  ok('move c 1 2'); ok('undo'); assert.equal(ok('canvas'), '200x300');
  assert.equal(run('undo'), 'error: nothing to undo');
  ok('init'); assert.equal(ok('tree'), 'svg (800x600)');
});
test('comments, color literals, quoted in text and prototype keys are safe', () => {
  const { run, ok } = session(); assert.equal(ok('  # comment'), ''); ok('init');
  ok('create text t 0 0 "in"'); ok('create rect r 0 0 1 1 #abcdef');
  assert.match(ok('show r'), /fill=#abcdef/);
  assert.match(run('create __proto__ x'), /unknown shape type/);
  assert.match(run('constructor'), /unknown command/);
});

test('each shape geometry whitelist, move and scale operate polymorphically', () => {
  const { ok, run } = session(); ok('init');
  const cases = [
    ['rect', '1 2 3 4', ['x', 'y', 'width', 'height']],
    ['circle', '1 2 3', ['cx', 'cy', 'r']],
    ['ellipse', '1 2 3 4', ['cx', 'cy', 'rx', 'ry']],
    ['line', '1 2 3 4', ['x1', 'y1', 'x2', 'y2']],
    ['text', '1 2 "hello"', ['x', 'y']]
  ] as const;
  for (const [type, args, attrs] of cases) {
    ok(`create ${type} ${type} ${args}`);
    for (const attr of attrs) ok(`set ${type} ${attr} 10`);
    ok(`move ${type} 2 3`); ok(`scale ${type} 2`);
    const output = ok(`show ${type}`);
    for (const attr of attrs) {
      const expected = ['x', 'cx', 'x1', 'x2'].includes(attr) ? 24 : ['y', 'cy', 'y1', 'y2'].includes(attr) ? 26 : 20;
      assert.match(output, new RegExp(`${attr}=${expected}(?: |$)`));
    }
    assert.match(run(`set ${type} nonsense 1`), /unknown attribute/);
    ok(`set ${type} stroke-width 1.5`); assert.match(ok(`show ${type}`), /stroke-width=1.5/);
  }
});

test('reparenting preserves inherited SVG styles across groups and undo', () => {
  const { ok } = session(); ok('init');
  ok('create g red'); ok('set red fill red'); ok('set red stroke blue');
  ok('create g green'); ok('set green fill green');
  ok('create rect inherited 0 0 10 10 in red');
  ok('create rect explicit 20 0 10 10 yellow in red');
  ok('addto green inherited');
  assert.match(ok('show inherited'), /fill=red/); assert.match(ok('show inherited'), /stroke=blue/);
  ok('undo'); assert.doesNotMatch(ok('show inherited'), /fill=/);
  ok('group pair inherited explicit'); ok('ungroup pair');
  assert.match(ok('show inherited'), /parent=g#red/);
  ok('create g inner in red'); ok('set inner fill purple');
  ok('create circle child 0 0 1 in inner'); ok('ungroup inner');
  assert.match(ok('show child'), /fill=purple/);
  ok('group cross inherited child'); assert.match(ok('show child'), /fill=purple/);
  ok('addto green cross'); assert.match(ok('show cross'), /fill=red/);
});

test('moving default styles under styled parent keeps the original SVG appearance', () => {
  const { ok } = session(); ok('init');
  ok('create rect r 0 0 10 10'); ok('create g colored');
  ok('set colored fill red'); ok('set colored stroke blue');
  ok('addto colored r');
  assert.match(ok('show r'), /fill=black/); assert.match(ok('show r'), /stroke=none/);
  ok('undo'); assert.doesNotMatch(ok('show r'), /fill=/);
});
