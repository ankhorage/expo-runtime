import type { MediaAssetKind } from '@ankhorage/contracts';

import { inferMediaAssetKind, isRequestedMediaKind, resolveDocumentPickerMimeTypes } from './mediaKinds';
import {
  readSelectedMediaBytes,
  type ArrayBufferReadable,
  type SelectedMediaByteSource,
} from './readSelectedBytes';
import type { ExpoMediaPickerInput, ExpoMediaPickerResult } from './types';

interface DocumentPickerAssetLike extends SelectedMediaByteSource {
  readonly name: string;
  readonly mimeType?: string;
  readonly size?: number;
  readonly file?: ArrayBufferReadable;
}

interface DocumentPickerResultLike {
  readonly canceled: boolean;
  readonly assets: readonly DocumentPickerAssetLike[] | null;
}

type ByteReader = (source: SelectedMediaByteSource) => Promise<Uint8Array | null>;

export async function normalizeDocumentPickerResult(
  result: DocumentPickerResultLike,
  mediaKinds: readonly MediaAssetKind[] | undefined,
  readBytes: ByteReader = readSelectedMediaBytes,
): Promise<ExpoMediaPickerResult> {
  if (result.canceled) return { ok: false, reason: 'cancelled' };
  const asset = result.assets?.[0];
  if (!asset) return { ok: false, reason: 'empty-selection' };
  const kind = inferMediaAssetKind(asset.mimeType, asset.name);
  if (!isRequestedMediaKind(kind, mediaKinds)) return { ok: false, reason: 'unsupported-kind' };
  const body = await readBytes(asset);
  if (!body) return { ok: false, reason: 'read-failed' };
  return {
    ok: true,
    selection: {
      kind,
      name: asset.name,
      body,
      contentType: asset.mimeType,
      sizeBytes: asset.size ?? body.byteLength,
    },
  };
}

export async function pickDocumentMedia(input: ExpoMediaPickerInput): Promise<ExpoMediaPickerResult> {
  try {
    const DocumentPicker = await import('expo-document-picker');
    const result = await DocumentPicker.getDocumentAsync({
      base64: false,
      copyToCacheDirectory: true,
      multiple: false,
      type: resolveDocumentPickerMimeTypes(input.mediaKinds),
    });
    return await normalizeDocumentPickerResult(result, input.mediaKinds);
  } catch {
    return { ok: false, reason: 'picker-failed' };
  }
}
