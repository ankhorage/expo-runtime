import { describe, expect, test } from 'bun:test';

import { isExternalReference, normalizeArchivePath, resolveArchivePath } from './path';

describe('EPUB archive paths', () => {
  test('resolves package-relative resources without escaping the archive', () => {
    expect(resolveArchivePath('OPS/package.opf', 'text/../images/cover.jpg')).toBe(
      'OPS/images/cover.jpg',
    );
    expect(() => resolveArchivePath('', '../../outside')).toThrow('escapes the archive');
  });

  test('normalizes platform separators and encoded names', () => {
    expect(normalizeArchivePath('OPS\\Text%20One.xhtml')).toBe('OPS/Text One.xhtml');
  });

  test('classifies active external URL schemes', () => {
    expect(isExternalReference('https://example.test')).toBe(true);
    expect(isExternalReference('javascript:alert(1)')).toBe(true);
    expect(isExternalReference('../images/cover.png')).toBe(false);
  });
});
