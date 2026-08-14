import type { AppDeployTargets } from '@ankhorage/contracts/deploy';
import { describe, expect, test } from 'bun:test';

import { resolveExpoRuntimeNativeSchemeMap } from './nativeLinkingPlanning';

const TARGET_CASES: readonly [string, AppDeployTargets, Readonly<Record<string, string>>][] = [
  ['web', { web: { enabled: true } }, {}],
  [
    'android',
    { android: { enabled: true, package: 'com.ankh.android', scheme: 'ankh-android' } },
    { android: 'ankh-android' },
  ],
  [
    'ios',
    { ios: { enabled: true, bundleIdentifier: 'com.ankh.ios', scheme: 'ankh-ios' } },
    { ios: 'ankh-ios' },
  ],
  [
    'web + android',
    {
      web: { enabled: true },
      android: { enabled: true, package: 'com.ankh.android', scheme: 'ankh-android' },
    },
    { android: 'ankh-android' },
  ],
  [
    'web + ios',
    {
      web: { enabled: true },
      ios: { enabled: true, bundleIdentifier: 'com.ankh.ios', scheme: 'ankh-ios' },
    },
    { ios: 'ankh-ios' },
  ],
  [
    'android + ios',
    {
      android: { enabled: true, package: 'com.ankh.android', scheme: 'ankh-android' },
      ios: { enabled: true, bundleIdentifier: 'com.ankh.ios', scheme: 'ankh-ios' },
    },
    { android: 'ankh-android', ios: 'ankh-ios' },
  ],
  [
    'web + android + ios',
    {
      web: { enabled: true },
      android: { enabled: true, package: 'com.ankh.android', scheme: 'ankh-android' },
      ios: { enabled: true, bundleIdentifier: 'com.ankh.ios', scheme: 'ankh-ios' },
    },
    { android: 'ankh-android', ios: 'ankh-ios' },
  ],
];

describe('resolveExpoRuntimeNativeSchemeMap', () => {
  for (const [name, targets, expected] of TARGET_CASES) {
    test(`derives only enabled native schemes for ${name}`, () => {
      expect(resolveExpoRuntimeNativeSchemeMap(targets)).toEqual(expected);
    });
  }

  test('does not guess schemes from native application identifiers', () => {
    expect(
      resolveExpoRuntimeNativeSchemeMap({
        android: { enabled: true, package: 'com.ankh.android' },
        ios: { enabled: true, bundleIdentifier: 'com.ankh.ios' },
      }),
    ).toEqual({});
  });

  test('omits disabled native targets even when they retain stable schemes', () => {
    expect(
      resolveExpoRuntimeNativeSchemeMap({
        android: { enabled: false, package: 'com.ankh.android', scheme: 'ankh-android' },
        ios: { enabled: false, bundleIdentifier: 'com.ankh.ios', scheme: 'ankh-ios' },
      }),
    ).toEqual({});
  });
});
