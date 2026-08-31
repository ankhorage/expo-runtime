export function normalizeArchivePath(path: string): string {
  const segments: string[] = [];
  for (const segment of decodeURIComponent(path).replaceAll('\\', '/').split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      if (segments.length === 0) throw new Error(`EPUB resource escapes the archive: ${path}`);
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  return segments.join('/');
}

export function resolveArchivePath(basePath: string, reference: string): string {
  const cleanReference = reference.split('#', 1)[0]?.split('?', 1)[0] ?? '';
  if (cleanReference.startsWith('/')) return normalizeArchivePath(cleanReference);
  const baseDirectory = basePath.includes('/')
    ? basePath.slice(0, basePath.lastIndexOf('/') + 1)
    : '';
  return normalizeArchivePath(`${baseDirectory}${cleanReference}`);
}

export function isExternalReference(reference: string): boolean {
  return /^(?:https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(reference.trim());
}
