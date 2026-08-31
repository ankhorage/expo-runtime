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

  test('keeps runtime and tooling package identities in one contract', () => {
    expect(EXPO_PLATFORM.runtime.expo.name).toBe('expo');
    expect(Number(EXPO_PLATFORM.runtime.expo.version.split('.')[0])).toBe(EXPO_PLATFORM.sdk);
    expect(EXPO_PLATFORM.runtime.reactNative.name).toBe('react-native');
    expect(EXPO_PLATFORM.packages.crypto.name).toBe('expo-crypto');
    expect(EXPO_PLATFORM.tooling.node.lts).toBe(24);
    expect(EXPO_PLATFORM.tooling.node.version).toBe(`${EXPO_PLATFORM.tooling.node.lts}.x`);
    expect(EXPO_PLATFORM.tooling.expoDoctor.name).toBe('expo-doctor');
    expect(EXPO_PLATFORM.animation.worklets.name).toBe('react-native-worklets');
  });
});

describe('EXPO_PLATFORM icon providers', () => {
  test('owns the complete static provider package inventory', () => {
    expect(
      Object.fromEntries(
        Object.entries(EXPO_PLATFORM.ui.iconProviders).map(([provider, dependency]) => [
          provider,
          dependency.name,
        ]),
      ),
    ).toEqual({
      Ionicons: '@react-native-vector-icons/ionicons',
      FontAwesome: '@react-native-vector-icons/fontawesome',
      FontAwesome5: '@react-native-vector-icons/fontawesome5',
      FontAwesome6: '@react-native-vector-icons/fontawesome6',
      MaterialDesignIcons: '@react-native-vector-icons/material-design-icons',
    });
  });
});
