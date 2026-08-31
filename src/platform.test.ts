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
    expect(EXPO_PLATFORM.runtime.expo).toEqual({ name: 'expo', version: '57.0.18' });
    expect(EXPO_PLATFORM.runtime.reactNative).toEqual({
      name: 'react-native',
      version: '0.86.3',
    });
    expect(EXPO_PLATFORM.packages.crypto).toEqual({
      name: 'expo-crypto',
      version: '~57.0.2',
    });
    expect(EXPO_PLATFORM.tooling.node).toEqual({ lts: 24, version: '24.x' });
    expect(EXPO_PLATFORM.tooling.expoDoctor.version).toBe('1.20.4');
    expect(EXPO_PLATFORM.animation.worklets.version).toBe('0.10.1');
  });
});

describe('EXPO_PLATFORM compatibility metadata', () => {
  test('projects the current Expo bundled native-module patch ranges', () => {
    expect(EXPO_PLATFORM.navigation.expoRouter.version).toBe('~57.0.17');
    expect({
      asset: EXPO_PLATFORM.packages.asset.version,
      authSession: EXPO_PLATFORM.packages.authSession.version,
      constants: EXPO_PLATFORM.packages.constants.version,
      devClient: EXPO_PLATFORM.packages.devClient.version,
      fileSystem: EXPO_PLATFORM.packages.fileSystem.version,
      font: EXPO_PLATFORM.packages.font.version,
      imagePicker: EXPO_PLATFORM.packages.imagePicker.version,
      linking: EXPO_PLATFORM.packages.linking.version,
      location: EXPO_PLATFORM.packages.location.version,
      metroRuntime: EXPO_PLATFORM.packages.metroRuntime.version,
      notifications: EXPO_PLATFORM.packages.notifications.version,
      secureStore: EXPO_PLATFORM.packages.secureStore.version,
      splashScreen: EXPO_PLATFORM.packages.splashScreen.version,
      updates: EXPO_PLATFORM.packages.updates.version,
    }).toEqual({
      asset: '~57.0.15',
      authSession: '~57.0.10',
      constants: '~57.0.16',
      devClient: '~57.0.16',
      fileSystem: '~57.0.6',
      font: '~57.0.2',
      imagePicker: '~57.0.14',
      linking: '~57.0.8',
      location: '~57.0.14',
      metroRuntime: '~57.0.14',
      notifications: '~57.0.15',
      secureStore: '~57.0.2',
      splashScreen: '~57.0.8',
      updates: '~57.0.19',
    });
  });
});
