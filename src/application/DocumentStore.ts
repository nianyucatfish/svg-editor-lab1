import type { Drawing } from '../domain/Drawing.ts';
export interface DocumentStore {
  read(path: string): { drawing: Drawing; warnings: string[] };
  write(path: string, drawing: Drawing): void;
}
