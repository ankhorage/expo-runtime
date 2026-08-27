import { describe, expect, test } from 'bun:test';

import { EXPO_PLATFORM } from './platform';

describe('EXPO_PLATFORM', () => {
  test('represents the supported Expo 57 native platform without a tvOS claim', () => {
    expect(EXPO_PLATFORM.sdk).toBe(57);
    expect(EXPO_PLATFORM.architecture).toBe('new-architecture-only');
    expect(EXPO_PLATFORM.platforms).toEqual({
      android: {
        minimumVersion: 7,
        minimumApiLevel: 24,
        compileSdk: 36,
        targetSdk: 36,
        edgeToEdge: true,
      },
      ios: {
        minimumVersion: '16.4',
        minimumXcodeVersion: '26.4',
      },
    });
    expect('tvos' in EXPO_PLATFORM.platforms).toBe(false);
  });

  test('keeps the Hermes fix, React Native and Node policy in one contract', () => {
    expect(EXPO_PLATFORM.runtime.expo).toEqual({ name: 'expo', version: '57.0.17' });
    expect(EXPO_PLATFORM.runtime.reactNative).toEqual({
      name: 'react-native',
      version: '0.86.3',
    });
    expect(EXPO_PLATFORM.packages.crypto).toEqual({
      name: 'expo-crypto',
      version: '~57.0.2',
    });
    expect(EXPO_PLATFORM.tooling.node).toEqual({ lts: 24, version: '24.x' });
    expect(EXPO_PLATFORM.animation.worklets.version).toBe('0.10.1');
  });
});
