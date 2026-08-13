import { describe, expect, test } from 'bun:test';

import { getExpoBundledMediaRegistrySource } from './bundledMediaRegistrySource';

describe('Expo bundled media registry source', () => {
  test('renders sorted static require literals and deduplicates identical entries', () => {
    const source = getExpoBundledMediaRegistrySource([
      { path: 'assets/z.png', requirePath: '../../assets/z.png' },
      { path: 'assets/a.png', requirePath: '../../assets/a.png' },
      { path: 'assets/a.png', requirePath: '../../assets/a.png' },
    ]);
    expect(source.indexOf('assets/a.png')).toBeLessThan(source.indexOf('assets/z.png'));
    expect(source.match(/require\("\.\.\/\.\.\/assets\/a\.png"\)/g)?.length).toBe(1);
    expect(source).toContain('require("../../assets/z.png")');
  });

  test('rejects one canonical path mapped to different files', () => {
    expect(() =>
      getExpoBundledMediaRegistrySource([
        { path: 'assets/a.png', requirePath: '../../assets/a.png' },
        { path: 'assets/a.png', requirePath: '../../assets/other.png' },
      ]),
    ).toThrow('conflicting require targets');
  });
});
