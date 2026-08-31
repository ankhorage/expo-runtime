export const HTML_MEDIA_TYPES = new Set(['application/xhtml+xml', 'text/html']);

export function inferEpubMediaType(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase() ?? '';
  if (extension === 'css') return 'text/css';
  if (extension === 'gif') return 'image/gif';
  if (extension === 'html') return 'text/html';
  if (extension === 'jpeg' || extension === 'jpg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'svg') return 'image/svg+xml';
  if (extension === 'ttf') return 'font/ttf';
  if (extension === 'woff') return 'font/woff';
  if (extension === 'woff2') return 'font/woff2';
  if (extension === 'xhtml') return 'application/xhtml+xml';
  return 'application/octet-stream';
}
