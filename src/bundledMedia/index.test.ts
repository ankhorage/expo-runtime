import { describe, expect, test } from 'bun:test';
import type { MediaAsset } from '@ankhorage/contracts';

import {
  createExpoBundledMediaResolver,
  getExpoBundledMediaRegistrySource,
} from './index';

describe('bundled media subpath surface', () => {
  test('exposes bundled resolution without the root runtime barrel', () => {
    const asset: MediaAsset = {
      id: 'hero',
      name: 'Hero',
      kind: 'image',
      source: { kind: 'bundled', path: 'assets/hero.png' },
    };
    expect(createExpoBundledMediaResolver({ 'assets/hero.png': 42 })({ asset })).toBe(42);
  });

  test('generates registry modules that import the lightweight subpath', () => {
    const source = getExpoBundledMediaRegistrySource([
      { path: 'assets/hero.png', requirePath: '../../assets/hero.png' },
    ]);
    expect(source).toContain("from '@ankhorage/expo-runtime/bundled-media'");
    expect(source).not.toContain("from '@ankhorage/expo-runtime';");
  });
});
