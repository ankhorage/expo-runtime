import { describe, expect, test } from 'bun:test';

import {
  resolveExpoRuntimeConfigPluginOutput,
  resolveExpoRuntimeDependencyMap,
  resolveExpoRuntimeGeneratedAppOutput,
  resolveExpoRuntimeNativeOutput,
} from './generatedAppOutput';
import { EXPO_PLATFORM } from './platform';
import type { ExpoRuntimePlan } from './resolveExpoRuntimePlan';

const EMPTY_PLAN: ExpoRuntimePlan = {
  permissions: [],
  capabilities: [],
  impliedPermissions: [],
  dependencies: [],
  nativeConfig: {
    androidPermissions: [],
    configHints: [],
    plugins: [],
  },
  providers: [],
  runtimeAdapters: [],
  usesExpoRuntimeRegistry: false,
  needsPermissionsProvider: false,
  diagnostics: [],
};

const PROVIDER_START = "<ExpoRuntimeProviders providers={['permissions']}>";

const CAMERA_PLAN: ExpoRuntimePlan = {
  ...EMPTY_PLAN,
  dependencies: [
    {
      name: 'expo-camera',
      version: EXPO_PLATFORM.packages.camera.version,
      reasons: ['capability:barcodeScanner'],
    },
    {
      name: '@ankhorage/expo-runtime',
      version: '^0.0.7',
      reasons: ['runtime:expo'],
    },
  ],
  nativeConfig: {
    androidPermissions: [],
    configHints: ['cameraPermission'],
    plugins: [
      {
        name: 'expo-camera',
        options: {
          cameraPermission: 'Allow camera access to scan barcodes.',
          barcodeScannerEnabled: true,
          microphonePermission: false,
          recordAudioAndroid: false,
        },
      },
      {
        name: 'expo-something',
      },
    ],
  },
  providers: ['permissions'],
  runtimeAdapters: ['ExpoBarcodeScannerAdapter'],
  usesExpoRuntimeRegistry: true,
  needsPermissionsProvider: true,
};

describe('generatedAppOutput', () => {
  test('keeps Expo config plugins as a distinct external ecosystem concept', () => {
    expect(resolveExpoRuntimeConfigPluginOutput(CAMERA_PLAN)).toEqual([
      [
        'expo-camera',
        {
          barcodeScannerEnabled: true,
          cameraPermission: 'Allow camera access to scan barcodes.',
          microphonePermission: false,
          recordAudioAndroid: false,
        },
      ],
      'expo-something',
    ]);
  });

  test('returns empty output for missing or empty plans', () => {
    expect(resolveExpoRuntimeDependencyMap(undefined)).toEqual({});
    expect(resolveExpoRuntimeConfigPluginOutput(undefined)).toEqual([]);
    expect(resolveExpoRuntimeNativeOutput(EMPTY_PLAN)).toEqual({
      androidPermissions: [],
      configPlugins: [],
    });
  });

  test('maps runtime dependencies into a package dependency map', () => {
    expect(resolveExpoRuntimeDependencyMap(CAMERA_PLAN)).toEqual({
      '@ankhorage/expo-runtime': '^0.0.7',
      'expo-camera': EXPO_PLATFORM.packages.camera.version,
    });
  });

  test('maps native plugin metadata into serializable config plugin output', () => {
    expect(resolveExpoRuntimeConfigPluginOutput(CAMERA_PLAN)).toEqual([
      [
        'expo-camera',
        {
          barcodeScannerEnabled: true,
          cameraPermission: 'Allow camera access to scan barcodes.',
          microphonePermission: false,
          recordAudioAndroid: false,
        },
      ],
      'expo-something',
    ]);
  });

  test('combines dependency, native and layout output', () => {
    expect(resolveExpoRuntimeGeneratedAppOutput(CAMERA_PLAN)).toEqual({
      dependencies: {
        '@ankhorage/expo-runtime': '^0.0.7',
        'expo-camera': EXPO_PLATFORM.packages.camera.version,
      },
      layoutIntegration: {
        imports: ["import { ExpoRuntimeProviders } from '@ankhorage/expo-runtime';"],
        moduleDeclarations: [],
        providerStart: [PROVIDER_START],
        providerEnd: ['</ExpoRuntimeProviders>'],
      },
      native: {
        androidPermissions: [],
        configPlugins: [
          [
            'expo-camera',
            {
              barcodeScannerEnabled: true,
              cameraPermission: 'Allow camera access to scan barcodes.',
              microphonePermission: false,
              recordAudioAndroid: false,
            },
          ],
          'expo-something',
        ],
      },
    });
  });
});
