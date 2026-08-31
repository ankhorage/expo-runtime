import type { Entry } from '@zip.js/zip.js';
import { Uint8ArrayWriter } from '@zip.js/zip.js';

const MAX_COMPRESSION_RATIO = 100;
const MAX_ENTRY_COUNT = 10_000;
const MAX_ENTRY_UNCOMPRESSED_BYTES = 64 * 1024 * 1024;
const MAX_TOTAL_UNCOMPRESSED_BYTES = 512 * 1024 * 1024;

export async function validateEpubArchiveEntriesAsync(
  entries: readonly Entry[],
  signal?: AbortSignal,
): Promise<void> {
  if (entries.length > MAX_ENTRY_COUNT) {
    throw new Error(`EPUB archive exceeds the ${MAX_ENTRY_COUNT}-entry limit.`);
  }

  let totalUncompressedBytes = 0;

  for (const entry of entries) {
    validateDeclaredSizes(entry);

    if (entry.directory) {
      continue;
    }

    if (entry.uncompressedSize > MAX_ENTRY_UNCOMPRESSED_BYTES) {
      throw new Error(
        `EPUB archive entry "${entry.filename}" exceeds the ${MAX_ENTRY_UNCOMPRESSED_BYTES}-byte uncompressed limit.`,
      );
    }

    if (
      entry.uncompressedSize > 0 &&
      (entry.compressedSize === 0 ||
        entry.uncompressedSize > entry.compressedSize * MAX_COMPRESSION_RATIO)
    ) {
      throw new Error(
        `EPUB archive entry "${entry.filename}" exceeds the ${MAX_COMPRESSION_RATIO}:1 compression-ratio limit.`,
      );
    }

    if (totalUncompressedBytes > MAX_TOTAL_UNCOMPRESSED_BYTES - entry.uncompressedSize) {
      throw new Error(
        `EPUB archive exceeds the ${MAX_TOTAL_UNCOMPRESSED_BYTES}-byte aggregate uncompressed limit.`,
      );
    }

    totalUncompressedBytes += entry.uncompressedSize;
  }

  for (const entry of entries) {
    if (entry.directory) {
      continue;
    }

    await entry.getData(new Uint8ArrayWriter(), {
      checkOverlappingEntryOnly: true,
      signal,
      strictness: 'strict',
    });
  }
}

function validateDeclaredSizes(entry: Entry): void {
  if (
    !Number.isSafeInteger(entry.compressedSize) ||
    entry.compressedSize < 0 ||
    !Number.isSafeInteger(entry.uncompressedSize) ||
    entry.uncompressedSize < 0
  ) {
    throw new Error(`EPUB archive entry "${entry.filename}" declares invalid sizes.`);
  }
}
