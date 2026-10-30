import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, readdirSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SvgCodec } from '../src/infrastructure/SvgCodec.ts';
import { LocalDocumentStore } from '../src/infrastructure/LocalDocumentStore.ts';
import { Editor } from '../src/application/Editor.ts';
import { CommandDispatcher } from '../src/cli/CommandDispatcher.ts';
const codec = new SvgCodec();
const wrap = (body: string, attributes = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" ${attributes}>${body}</svg>`;
test('attachment other.svg assigns missing id and imports every element', () => {
  const { drawing, warnings } = codec.decode(readFileSync('examples/other.svg', 'utf8'));
  assert.deepEqual(warnings, ['warning: assigned id rect1 to unnamed <rect>']);
  assert.equal(drawing.count, 7); assert.equal(drawing.size(), '400x300');
  assert.match(drawing.tree(), /g#g1[^]*rect#r2[^]*circle#c2/);
  const roundtrip = codec.decode(codec.encode(drawing));
  assert.deepEqual(roundtrip.warnings, []); assert.equal(roundtrip.drawing.tree(), drawing.tree());
});
test('auto IDs reserve all existing IDs including IDs occurring later', () => {
  const { drawing, warnings } = codec.decode(wrap('<rect/><rect id="rect1"/><g><circle/><circle id="circle1"/></g>'));
  assert.deepEqual(warnings, [
    'warning: assigned id rect2 to unnamed <rect>', 'warning: assigned id g1 to unnamed <g>', 'warning: assigned id circle2 to unnamed <circle>'
  ]);
  assert.equal(drawing.count, 5); assert.match(drawing.tree(), /rect#rect2/);
});
test('all shapes, styles, root presentation and XML escaping roundtrip through an edit', () => {
  const editor = new Editor(), cli = new CommandDispatcher(editor);
  for (const line of ['init 500 400', 'create g scene', 'create rect r 1 2 3 4 blue in scene',
    'create circle c 1 2 3', 'create ellipse e 1 2 3 4', 'create line l 1 2 3 4 black',
    'create text t 1 2 "<&你好>"', 'set scene stroke red', 'set r stroke-width 2']) {
    assert.doesNotMatch(cli.execute(line), /^error:/);
  }
  const xml = codec.encode(editor.drawing); assert.match(xml, /&lt;&amp;你好&gt;/);
  const { drawing } = codec.decode(xml); assert.equal(drawing.tree(), editor.drawing.tree());
  const imported = codec.decode(wrap('<text id="t" x="1" y="2" font-size="20" text-anchor="middle">A &amp; B &lt; C</text>', 'fill="red" font-family="serif"'));
  editor.loaded(imported.drawing, 'unused.svg'); cli.execute('move t 1 0');
  const output = codec.encode(editor.drawing);
  assert.match(output, /font-size="20"/); assert.match(output, /text-anchor="middle"/);
  assert.match(output, /fill="red"/); assert.match(output, /font-family="serif"/);
  assert.equal(codec.decode(output).drawing.find('t').content(), 'A & B < C');
});
test('nested transform example normalizes geometry and text size in SVG order', () => {
  const { drawing } = codec.decode(readFileSync('examples/transforms.svg', 'utf8'));
  assert.match(drawing.show('a'), /x=60 y=40 width=120 height=60/);
  assert.match(drawing.show('rect1'), /x=260 y=40 width=96 height=48/);
  assert.match(drawing.show('text1'), /x=308 y=70.4/);
  const output = codec.encode(drawing);
  assert.doesNotMatch(output, /transform=/); assert.match(output, /font-size="12.8"/);
  assert.equal(codec.decode(output).drawing.tree(), drawing.tree());
});
test('viewBox origin and uniform scale normalize alongside inherited lengths', () => {
  const { drawing } = codec.decode('<svg width="200px" height="200" viewBox="10 20 100 100" stroke-width="3" font-size="10"><g id="g" transform="scale(2) translate(1,2)"><text id="t" x="5" y="6">Hi</text></g></svg>');
  assert.match(drawing.show('t'), /x=4 y=-8/);
  const xml = codec.encode(drawing); assert.match(xml, /font-size="40"/); assert.match(xml, /stroke-width="12"/);
  assert.equal(codec.decode(xml).drawing.tree(), drawing.tree());
});
test('malformed and unsupported SVG fail explicitly instead of silently losing content', () => {
  for (const xml of [
    '', '<svg><g></svg>', '<svg/><svg/>', '<html/>', '<svg xmlns="wrong"/>',
    wrap('<circle id="same"/><rect id="same"/>'), wrap('<path id="p" d="M 0 0"/>'),
    wrap('<g id="g" transform="rotate(30)"/>'), wrap('<g transform="scale(2,3)"/>'),
    wrap('<rect width="10%"/>'), wrap('<rect onclick="alert(1)"/>'),
    wrap('<text><tspan>nested</tspan></text>'), wrap('<rect><circle/></rect>'),
    wrap('<rect/>', 'viewBox="0 0 1 1"'), wrap('<rect/>', 'style="fill:red"'),
    '<!DOCTYPE svg [<!ENTITY e "text">]><svg/>', wrap('<text>&undefined;</text>'),
    wrap('<circle r="-1"/>'), wrap('<g transform="translate(NaN)"/>'), wrap('<g>not a shape</g>')
  ]) assert.throws(() => codec.decode(xml), Error, xml);
});
test('unknown composite metadata degrades to ordinary group and remains editable', () => {
  const { drawing } = codec.decode(wrap('<g id="box" data-kind="box"><rect id="r" width="10" height="20"/><text id="t">Title</text></g>'));
  const editor = new Editor(); editor.loaded(drawing, 'unused');
  const cli = new CommandDispatcher(editor); assert.doesNotMatch(cli.execute('move box 5 6'), /^error:/);
  assert.match(editor.drawing.show('r'), /x=5 y=6/);
  assert.match(codec.encode(editor.drawing), /data-kind="box"/);
});
test('read/save paths, history barriers and failures are transactional', t => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-editor-')); t.after(() => rmSync(directory, { recursive: true, force: true }));
  const path = join(directory, 'file with spaces.svg'), invalid = join(directory, 'invalid.svg');
  const cli = new CommandDispatcher(new Editor(), new LocalDocumentStore());
  const ok = (line: string) => { const value = cli.execute(line); assert.doesNotMatch(value, /^error:/, line); return value; };
  ok('init'); ok('create rect r 1 2 3 4');
  assert.match(cli.execute('save'), /^error: cannot write file/);
  ok('undo'); ok('redo'); ok(`save "${path}"`);
  assert.equal(cli.execute('undo'), 'error: undo not allowed after io command');
  ok('move r 5 6'); ok('save'); assert.match(readFileSync(path, 'utf8'), /x="6" y="8"/);
  ok('move r 1 0'); ok('undo'); const before = ok('tree');
  writeFileSync(invalid, '<svg><g></svg>');
  for (const command of [`read "${invalid}"`, `read "${join(directory, 'absent.svg')}"`, `save "${join(directory, 'absent', 'file.svg')}"`]) {
    assert.match(cli.execute(command), /^error: cannot (read|write) file:/); assert.equal(ok('tree'), before);
  }
  ok('redo'); assert.match(ok('show r'), /x=7 y=8/);
  ok(`read "${path}"`); assert.match(ok('show r'), /x=6 y=8/);
  assert.equal(cli.execute('redo'), 'error: undo not allowed after io command');
  ok('create circle c 1 2 3'); ok('save');
  assert.match(readFileSync(path, 'utf8'), /id="c"/);
  ok('init'); assert.match(cli.execute('save'), /no path/);
  mkdirSync(join(directory, 'target-dir'));
  ok('create g empty'); assert.match(cli.execute(`save "${join(directory, 'target-dir')}"`), /cannot write file/);
  assert.ok(readdirSync(directory).every(name => !name.endsWith('.tmp'))); ok('undo');
});

test('serialization failure preserves existing target bytes and edit history', t => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-atomic-')); t.after(() => rmSync(directory, { recursive: true, force: true }));
  const path = join(directory, 'existing.svg'); writeFileSync(path, 'previous file');
  const editor = new Editor(), cli = new CommandDispatcher(editor, new LocalDocumentStore());
  cli.execute('init'); cli.execute('create text t 0 0 "\u0001"');
  assert.equal(cli.execute(`save "${path}"`), `error: cannot write file: ${path}`);
  assert.equal(readFileSync(path, 'utf8'), 'previous file');
  assert.equal(cli.execute('undo'), 'edit undone'); assert.equal(editor.drawing.count, 0);
  assert.deepEqual(readdirSync(directory), ['existing.svg']);
});
