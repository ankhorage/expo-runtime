import type { MediaAssetKind } from '@ankhorage/contracts';

const FONT_EXTENSIONS = /\.(eot|otf|ttf|woff2?)$/i;
const FONT_CONTENT_TYPES = new Set([
  'application/font-sfnt',
  'application/font-woff',
  'application/font-woff2',
  'application/vnd.ms-fontobject',
  'application/x-font-opentype',
  'application/x-font-ttf',
]);

const DOCUMENT_MIME_TYPES: Readonly<Record<Exclude<MediaAssetKind, 'file'>, readonly string[]>> = {
  image: ['image/*'],
  audio: ['audio/*'],
  video: ['video/*'],
  font: ['font/*', ...FONT_CONTENT_TYPES],
};

export function inferMediaAssetKind(contentType: string | undefined, name: string): MediaAssetKind {
  const normalizedType = contentType?.toLowerCase();
  if (normalizedType?.startsWith('image/')) return 'image';
  if (normalizedType?.startsWith('audio/')) return 'audio';
  if (normalizedType?.startsWith('video/')) return 'video';
  if (normalizedType?.startsWith('font/') || FONT_CONTENT_TYPES.has(normalizedType ?? '')) {
    return 'font';
  }
  return FONT_EXTENSIONS.test(name) ? 'font' : 'file';
}

export function isRequestedMediaKind(
  kind: MediaAssetKind,
  mediaKinds?: readonly MediaAssetKind[],
): boolean {
  return !mediaKinds?.length || mediaKinds.includes(kind);
}

export function resolveDocumentPickerMimeTypes(
  mediaKinds?: readonly MediaAssetKind[],
): string | readonly string[] {
  if (!mediaKinds?.length || mediaKinds.includes('file')) return '*/*';
  return Array.from(new Set(mediaKinds.flatMap((kind) => DOCUMENT_MIME_TYPES[kind] ?? [])));
}
