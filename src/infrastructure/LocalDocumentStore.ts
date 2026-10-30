import { readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { dirname, basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { DocumentStore } from '../application/DocumentStore.ts';
import type { Drawing } from '../domain/Drawing.ts';
import { SvgCodec } from './SvgCodec.ts';
export class LocalDocumentStore implements DocumentStore {
  readonly #codec = new SvgCodec();
  read(path: string): { drawing: Drawing; warnings: string[] } {
    let xml: string;
    try { xml = readFileSync(path, 'utf8'); } catch { throw new Error(`cannot read file: ${path}`); }
    try { return this.#codec.decode(xml); }
    catch (error) { throw new Error(`cannot read file: ${path} (${error instanceof Error ? error.message : 'invalid SVG'})`); }
  }
  write(path: string, drawing: Drawing): void {
    const temporary = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
    try {
      const xml = this.#codec.encode(drawing);
      writeFileSync(temporary, xml, { encoding: 'utf8', flag: 'wx' });
      renameSync(temporary, path);
    } catch {
      try { unlinkSync(temporary); } catch { /* No temporary file to remove. */ }
      throw new Error(`cannot write file: ${path}`);
    }
  }
}
