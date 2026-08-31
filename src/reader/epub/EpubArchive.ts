import {
  type Entry,
  type FileEntry,
  Uint8ArrayReader,
  Uint8ArrayWriter,
  ZipReader,
} from '@zip.js/zip.js';

import { ReaderDocumentError } from '../ReaderDocumentError';
import { validateEpubArchiveEntriesAsync } from '../validateEpubArchiveEntriesAsync';
import { normalizeArchivePath } from './path';

export class EpubArchive {
  readonly #entries: Map<string, FileEntry>;
  readonly #reader: ZipReader<Uint8Array>;

  private constructor(reader: ZipReader<Uint8Array>, entries: readonly Entry[]) {
    this.#reader = reader;
    this.#entries = createEntryMap(entries);
  }

  static async open(bytes: Uint8Array, signal: AbortSignal): Promise<EpubArchive> {
    const reader = new ZipReader(new Uint8ArrayReader(bytes), { strictness: 'strict' });
    try {
      const entries = await reader.getEntries({ strictness: 'strict' });
      await validateEpubArchiveEntriesAsync(entries, signal);
      if (entries.some((entry) => !entry.directory && entry.encrypted)) {
        throw new ReaderDocumentError(
          'protected-document',
          'This EPUB uses content protection and cannot be opened.',
        );
      }
      return new EpubArchive(reader, entries);
    } catch (error) {
      await reader.close();
      throw error;
    }
  }

  paths(): readonly string[] {
    return [...this.#entries.keys()];
  }

  has(path: string): boolean {
    return this.#entries.has(normalizeArchivePath(path));
  }

  async read(path: string, signal?: AbortSignal): Promise<Uint8Array> {
    const normalizedPath = normalizeArchivePath(path);
    const entry = this.#entries.get(normalizedPath);
    if (entry === undefined) throw new Error(`Missing EPUB resource: ${normalizedPath}`);
    return entry.getData(new Uint8ArrayWriter(), {
      checkCrc32: true,
      checkOverlappingEntry: true,
      signal,
      strictness: 'strict',
    });
  }

  async readText(path: string, signal?: AbortSignal): Promise<string> {
    return new TextDecoder().decode(await this.read(path, signal));
  }

  async close(): Promise<void> {
    await this.#reader.close();
  }
}

function createEntryMap(entries: readonly Entry[]): Map<string, FileEntry> {
  const files = new Map<string, FileEntry>();
  for (const entry of entries) {
    if (entry.directory) continue;
    const normalizedPath = normalizeArchivePath(entry.filename);
    if (files.has(normalizedPath)) {
      throw new ReaderDocumentError(
        'invalid-document',
        `The EPUB contains duplicate resource path "${normalizedPath}".`,
      );
    }
    files.set(normalizedPath, entry);
  }
  return files;
}
