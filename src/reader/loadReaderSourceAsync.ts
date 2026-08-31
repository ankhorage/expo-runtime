const MAX_READER_SOURCE_BYTES = 256 * 1024 * 1024;

export async function loadReaderSourceAsync(
  sourceUri: string,
  signal: AbortSignal,
): Promise<Uint8Array> {
  const response = await fetch(sourceUri, {
    credentials: 'omit',
    signal,
  });

  if (!response.ok) {
    throw new Error(`Reader source request failed with HTTP ${response.status}.`);
  }

  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_READER_SOURCE_BYTES) {
    throw new Error(`Reader source exceeds the ${MAX_READER_SOURCE_BYTES}-byte download limit.`);
  }

  if (response.body === null) {
    return validateSourceSize(new Uint8Array(await response.arrayBuffer()));
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  try {
    for (;;) {
      const result = await reader.read();
      if (result.done) break;
      byteLength += result.value.byteLength;
      if (byteLength > MAX_READER_SOURCE_BYTES) {
        throw new Error(
          `Reader source exceeds the ${MAX_READER_SOURCE_BYTES}-byte download limit.`,
        );
      }
      chunks.push(result.value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function validateSourceSize(bytes: Uint8Array): Uint8Array {
  if (bytes.byteLength > MAX_READER_SOURCE_BYTES) {
    throw new Error(`Reader source exceeds the ${MAX_READER_SOURCE_BYTES}-byte download limit.`);
  }
  return bytes;
}
