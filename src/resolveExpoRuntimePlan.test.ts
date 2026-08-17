import { Permission } from '@ankhorage/permissions';
import { EXPO_PERMISSION_SUPPORT } from '@ankhorage/permissions/expo/manifest';
import { describe, expect, test } from 'bun:test';

import {
  type ExpoRuntimePlanningManifest,
  resolveExpoRuntimePlan,
} from './resolveExpoRuntimePlan';

describe('resolveExpoRuntimePlan', () => {
  test('accepts a minimal screens-only planning manifest', () => {
    const manifest: ExpoRuntimePlanningManifest = {
      screens: {
        home: {
          requires: { permissions: [{ permission: 'camera' }] },
        },
      },
    };

    expect(resolveExpoRuntimePlan(manifest).permissions).toEqual([{ permission: 'camera' }]);
  });

  test('resolves camera permission through Expo permission metadata', () => {
    const plan = resolveExpoRuntimePlan(
      withFirstScreenRequirements({ permissions: [{ permission: 'camera' }] }),
    );

    expect(plan.dependencies.map((dependency) => dependency.name)).toEqual([
      '@ankhorage/expo-runtime',
      '@ankhorage/permissions',
      'expo-camera',
    ]);
    expect(plan.providers).toEqual(['permissions']);
    expect(plan.needsPermissionsProvider).toBe(true);
    expect(plan.nativeConfig.configHints).toEqual(['cameraPermission']);
    expect(plan.nativeConfig.androidPermissions).toEqual(['android.permission.CAMERA']);
    expect(plan.nativeConfig.plugins).toEqual([
      {
        name: 'expo-camera',
        options: { cameraPermission: 'Allow camera access.' },
      },
    ]);
  });

  test('resolves barcodeScanner capability with implied camera permission and adapter wiring', () => {
    const plan = resolveExpoRuntimePlan(
      withFirstScreenRequirements({ capabilities: [{ capability: 'barcodeScanner' }] }),
    );

    expect(plan.impliedPermissions).toEqual([{ permission: 'camera' }]);
    expect(plan.dependencies.map((dependency) => dependency.name)).toEqual([
      '@ankhorage/expo-runtime',
      '@ankhorage/permissions',
      'expo-camera',
    ]);
    expect(plan.runtimeAdapters).toEqual(['ExpoBarcodeScannerAdapter']);
    expect(plan.usesExpoRuntimeRegistry).toBe(true);
    expect(plan.nativeConfig.plugins).toEqual([
      {
        name: 'expo-camera',
        options: { cameraPermission: 'Allow camera access to scan barcodes.' },
      },
    ]);
  });

  test('dedupes repeated permission and capability requirements', () => {
    const plan = resolveExpoRuntimePlan(
      withAllScreenRequirements({
        capabilities: [{ capability: 'barcodeScanner' }],
        permissions: [{ permission: 'camera' }],
      }),
    );

    expect(plan.permissions).toEqual([{ permission: 'camera' }]);
    expect(plan.capabilities).toEqual([{ capability: 'barcodeScanner' }]);
    expect(plan.dependencies.map((dependency) => dependency.name)).toEqual([
      '@ankhorage/expo-runtime',
      '@ankhorage/permissions',
      'expo-camera',
    ]);
  });

  test('surfaces unsupported permission support explicitly', () => {
    const plan = resolveExpoRuntimePlan(
      withFirstScreenRequirements({ permissions: [{ permission: 'camera' }] }),
      {
        permissionSupport: {
          ...EXPO_PERMISSION_SUPPORT,
          [Permission.Camera]: {
            ...EXPO_PERMISSION_SUPPORT[Permission.Camera],
            support: 'unsupported',
          },
        },
      },
    );

    expect(plan.diagnostics).toContainEqual({
      severity: 'error',
      requirementType: 'permission',
      requirement: 'camera',
      message: "Expo runtime support for 'camera' is 'unsupported'.",
      support: 'unsupported',
    });
    expect(plan.dependencies).toEqual([]);
    expect(plan.providers).toEqual([]);
  });

  test('does not add runtime packages or providers for clipboard permissions', () => {
    const plan = resolveExpoRuntimePlan(
      withFirstScreenRequirements({ permissions: [{ permission: 'clipboard' }] }),
    );

    expect(plan.dependencies).toEqual([]);
    expect(plan.providers).toEqual([]);
    expect(plan.nativeConfig.plugins).toEqual([]);
  });
});

interface TestScreenRequirements {
  readonly capabilities?: readonly [{ readonly capability: 'barcodeScanner' }];
  readonly permissions?: readonly [{ readonly permission: 'camera' | 'clipboard' }];
}

function withFirstScreenRequirements(
  requirements: TestScreenRequirements,
): ExpoRuntimePlanningManifest {
  return {
    screens: {
      home: { requires: requirements },
      settings: {},
    },
  };
}

function withAllScreenRequirements(
  requirements: TestScreenRequirements,
): ExpoRuntimePlanningManifest {
  return {
    screens: {
      home: { requires: requirements },
      settings: { requires: requirements },
    },
  };
}
