export interface ArrayBufferReadable {
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface SelectedMediaByteSource {
  readonly uri: string;
  readonly file?: ArrayBufferReadable;
}

export async function readSelectedMediaBytes(
  source: SelectedMediaByteSource,
): Promise<Uint8Array | null> {
  try {
    if (source.file) {
      return new Uint8Array(await source.file.arrayBuffer());
    }
    const { File } = await import('expo-file-system');
    return await new File(source.uri).bytes();
  } catch {
    return null;
  }
}
