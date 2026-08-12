import type { MediaAssetKind } from '@ankhorage/contracts';

import { isRequestedMediaKind } from './mediaKinds';
import {
  readSelectedMediaBytes,
  type ArrayBufferReadable,
  type SelectedMediaByteSource,
} from './readSelectedBytes';
import type { ExpoMediaPickerInput, ExpoMediaPickerResult } from './types';

export type ExpoPhotoLibraryMediaType = 'images' | 'videos';

interface PhotoLibraryAssetLike extends SelectedMediaByteSource {
  readonly fileName?: string | null;
  readonly fileSize?: number;
  readonly mimeType?: string | null;
  readonly width: number;
  readonly height: number;
  readonly duration?: number | null;
  readonly type?: 'image' | 'video' | 'livePhoto' | 'pairedVideo' | null;
  readonly file?: ArrayBufferReadable;
}

interface PhotoLibraryResultLike {
  readonly canceled: boolean;
  readonly assets: readonly PhotoLibraryAssetLike[] | null;
}

type ByteReader = (source: SelectedMediaByteSource) => Promise<Uint8Array | null>;

export function resolvePhotoLibraryMediaTypes(
  mediaKinds?: readonly MediaAssetKind[],
): ExpoPhotoLibraryMediaType[] | null {
  if (!mediaKinds?.length) return ['images', 'videos'];
  const mediaTypes: ExpoPhotoLibraryMediaType[] = [];
  if (mediaKinds.includes('image')) mediaTypes.push('images');
  if (mediaKinds.includes('video')) mediaTypes.push('videos');
  return mediaTypes.length > 0 ? mediaTypes : null;
}

export async function normalizePhotoLibraryResult(
  result: PhotoLibraryResultLike,
  mediaKinds: readonly MediaAssetKind[] | undefined,
  readBytes: ByteReader = readSelectedMediaBytes,
): Promise<ExpoMediaPickerResult> {
  if (result.canceled) return { ok: false, reason: 'cancelled' };
  const asset = result.assets?.[0];
  if (!asset) return { ok: false, reason: 'empty-selection' };
  const kind = resolvePhotoLibraryAssetKind(asset);
  if (!isRequestedMediaKind(kind, mediaKinds)) return { ok: false, reason: 'unsupported-kind' };
  const body = await readBytes(asset);
  if (!body) return { ok: false, reason: 'read-failed' };
  return {
    ok: true,
    selection: {
      kind,
      name: asset.fileName?.trim() ?? `selected-${kind}`,
      body,
      contentType: asset.mimeType ?? undefined,
      sizeBytes: asset.fileSize ?? body.byteLength,
      width: asset.width,
      height: asset.height,
      durationMs: asset.duration ?? undefined,
    },
  };
}

export async function pickPhotoLibraryMedia(
  input: ExpoMediaPickerInput,
): Promise<ExpoMediaPickerResult> {
  const mediaTypes = resolvePhotoLibraryMediaTypes(input.mediaKinds);
  if (!mediaTypes) return { ok: false, reason: 'unsupported-kind' };
  try {
    const ImagePicker = await import('expo-image-picker');
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      allowsMultipleSelection: false,
      base64: false,
      exif: false,
      mediaTypes,
      quality: 1,
    });
    return await normalizePhotoLibraryResult(result, input.mediaKinds);
  } catch {
    return { ok: false, reason: 'picker-failed' };
  }
}

function resolvePhotoLibraryAssetKind(asset: PhotoLibraryAssetLike): 'image' | 'video' {
  if (asset.type === 'video' || asset.type === 'pairedVideo') return 'video';
  if (asset.type === 'image' || asset.type === 'livePhoto') return 'image';
  if (asset.mimeType?.startsWith('video/')) return 'video';
  return asset.duration !== null && asset.duration !== undefined ? 'video' : 'image';
}
