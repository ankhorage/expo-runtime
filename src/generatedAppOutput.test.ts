import { describe, expect, test } from 'bun:test';

import {
  resolveExpoRuntimeConfigPluginOutput,
  resolveExpoRuntimeDependencyMap,
  resolveExpoRuntimeGeneratedAppOutput,
  resolveExpoRuntimeNativeOutput,
} from './generatedAppOutput';
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

const CAMERA_PLAN: ExpoRuntimePlan = {
  ...EMPTY_PLAN,
  dependencies: [
    {
      name: 'expo-camera',
      version: '~17.0.10',
      reasons: ['capability:barcodeScanner'],
    },
    {
      name: '@ankhorage/expo-runtime',
      version: '^0.0.7',
      reasons: ['runtime:expo'],
    },
  ],
  nativeConfig: {
    androidPermissions: ['android.permission.CAMERA'],
    configHints: ['cameraPermission'],
    plugins: [
      {
        name: 'expo-camera',
        options: {
          cameraPermission: 'Allow camera access to scan barcodes.',
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
      'expo-camera': '~17.0.10',
    });
  });

  test('maps native plugin metadata into serializable config plugin output', () => {
    expect(resolveExpoRuntimeConfigPluginOutput(CAMERA_PLAN)).toEqual([
      [
        'expo-camera',
        {
          cameraPermission: 'Allow camera access to scan barcodes.',
        },
      ],
      'expo-something',
    ]);
  });

  test('combines dependency, native and layout output', () => {
    expect(resolveExpoRuntimeGeneratedAppOutput(CAMERA_PLAN)).toEqual({
      dependencies: {
        '@ankhorage/expo-runtime': '^0.0.7',
        'expo-camera': '~17.0.10',
      },
      layoutIntegration: {
        imports: ["import { ExpoRuntimeProviders } from '@ankhorage/expo-runtime';"],
        moduleDeclarations: [],
        providerStart: ["<ExpoRuntimeProviders providers={['permissions']}>"] ,
        providerEnd: ['</ExpoRuntimeProviders>'],
      },
      native: {
        androidPermissions: ['android.permission.CAMERA'],
        configPlugins: [
          [
            'expo-camera',
            {
              cameraPermission: 'Allow camera access to scan barcodes.',
            },
          ],
          'expo-something',
        ],
      },
    });
  });
});
