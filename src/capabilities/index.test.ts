import { isCapability } from '@ankhorage/contracts/capabilities';
import { describe, expect, test } from 'bun:test';

import packageJson from '../../package.json';
import { CAPABILITIES } from './index';

describe('Expo Runtime capability catalog', () => {
  test('contains unique valid canonical descriptors', () => {
    expect(CAPABILITIES.every(isCapability)).toBe(true);
    expect(new Set(CAPABILITIES.map(({ id }) => id)).size).toBe(CAPABILITIES.length);
    expect(CAPABILITIES.map(({ id }) => id)).toEqual(['expo.alert']);
  });

  test('matches the published package metadata catalog', () => {
    expect(packageJson.ankh.capabilities).toEqual(CAPABILITIES);
  });
});
