import { describe, expect, test } from 'bun:test';

import { normalizeDocumentPickerResult } from './documentPicker';
import { inferMediaAssetKind, resolveDocumentPickerMimeTypes } from './mediaKinds';
import {
  normalizePhotoLibraryResult,
  resolvePhotoLibraryMediaTypes,
} from './photoLibraryPicker';
import { readSelectedMediaBytes } from './readSelectedBytes';

const BYTES = new Uint8Array([1, 2, 3]);
const readBytes = async () => BYTES;

describe('Expo media picker boundary', () => {
  test('maps document MIME types and font extensions to canonical media kinds', () => {
    expect(inferMediaAssetKind('image/svg+xml', 'logo.svg')).toBe('image');
    expect(inferMediaAssetKind(undefined, 'Brand.woff2')).toBe('font');
    expect(resolveDocumentPickerMimeTypes(['image', 'audio'])).toEqual(['image/*', 'audio/*']);
    expect(resolveDocumentPickerMimeTypes(['file'])).toBe('*/*');
  });

  test('normalizes document selection to bytes without leaking the transient URI', async () => {
    const result = await normalizeDocumentPickerResult(
      {
        canceled: false,
        assets: [
          {
            uri: 'content://temporary/logo',
            name: 'logo.svg',
            mimeType: 'image/svg+xml',
            size: 3,
          },
        ],
      },
      ['image'],
      readBytes,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.selection).toEqual({
      kind: 'image',
      name: 'logo.svg',
      body: BYTES,
      contentType: 'image/svg+xml',
      sizeBytes: 3,
    });
    expect('uri' in result.selection).toBe(false);
  });

  test('rejects document selections outside the requested media kinds', async () => {
    const result = await normalizeDocumentPickerResult(
      {
        canceled: false,
        assets: [{ uri: 'file:///tmp/song.mp3', name: 'song.mp3', mimeType: 'audio/mpeg' }],
      },
      ['image'],
      readBytes,
    );

    expect(result).toEqual({ ok: false, reason: 'unsupported-kind' });
  });

  test('limits photo library picker to image and video kinds', () => {
    expect(resolvePhotoLibraryMediaTypes()).toEqual(['images', 'videos']);
    expect(resolvePhotoLibraryMediaTypes(['image'])).toEqual(['images']);
    expect(resolvePhotoLibraryMediaTypes(['audio', 'font'])).toBeNull();
  });

  test('normalizes photo library metadata without exposing its local URI', async () => {
    const result = await normalizePhotoLibraryResult(
      {
        canceled: false,
        assets: [
          {
            uri: 'file:///tmp/clip.mov',
            fileName: 'clip.mov',
            fileSize: 3,
            mimeType: 'video/quicktime',
            width: 1920,
            height: 1080,
            duration: 2400,
            type: 'video',
          },
        ],
      },
      ['video'],
      readBytes,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.selection).toMatchObject({
      kind: 'video',
      name: 'clip.mov',
      contentType: 'video/quicktime',
      sizeBytes: 3,
      width: 1920,
      height: 1080,
      durationMs: 2400,
    });
    expect('uri' in result.selection).toBe(false);
  });

  test('reads web picker files without persisting their blob URI', async () => {
    const buffer = new Uint8Array([4, 5, 6]).buffer;
    const bytes = await readSelectedMediaBytes({
      uri: 'blob:https://studio.local/transient',
      file: { arrayBuffer: async () => buffer },
    });

    expect(bytes).toEqual(new Uint8Array([4, 5, 6]));
  });

  test('normalizes cancellation', async () => {
    expect(await normalizeDocumentPickerResult({ canceled: true, assets: null }, undefined)).toEqual({
      ok: false,
      reason: 'cancelled',
    });
  });
});
