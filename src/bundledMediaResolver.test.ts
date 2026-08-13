import { describe, expect, test } from 'bun:test';
import type { MediaAsset } from '@ankhorage/contracts';

import { createExpoBundledMediaResolver, resolveExpoBundledMediaAsset } from './bundledMediaResolver';

const bundledAsset: MediaAsset = {
  id: 'hero',
  name: 'Hero',
  kind: 'image',
  source: { kind: 'bundled', path: 'assets/authoring/hero/hero.png' },
};

describe('Expo bundled media resolution', () => {
  test('resolves canonical bundled paths from the static registry', () => {
    const registry = { 'assets/authoring/hero/hero.png': 42 } as const;
    expect(resolveExpoBundledMediaAsset(registry, bundledAsset)).toBe(42);
    expect(createExpoBundledMediaResolver(registry)({ asset: bundledAsset })).toBe(42);
  });

  test('returns null for unknown bundled paths and non-bundled assets', () => {
    expect(resolveExpoBundledMediaAsset({}, bundledAsset)).toBeNull();
    const remoteAsset: MediaAsset = {
      ...bundledAsset,
      source: { kind: 'url', url: 'https://example.com/hero.png' },
    };
    expect(resolveExpoBundledMediaAsset({}, remoteAsset)).toBeNull();
  });
});
