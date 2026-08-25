import { Permission } from '@ankhorage/permissions';
import { EXPO_PERMISSION_SUPPORT } from '@ankhorage/permissions/expo/manifest';
import { describe, expect, test } from 'bun:test';

import { EXPO_PLATFORM } from './platform';
import { type ExpoRuntimePlanningManifest, resolveExpoRuntimePlan } from './resolveExpoRuntimePlan';

describe('resolveExpoRuntimePlan permissions', () => {
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
    expect(plan.nativeConfig.androidPermissions).toEqual([]);
    expect(plan.nativeConfig.plugins).toEqual([
      {
        name: 'expo-camera',
        options: {
          barcodeScannerEnabled: false,
          cameraPermission: 'Allow camera access.',
          microphonePermission: false,
          recordAudioAndroid: false,
        },
      },
    ]);
    expect(plan.dependencies.find(({ name }) => name === 'expo-camera')?.version).toBe(
      EXPO_PLATFORM.packages.camera.version,
    );
  });
});

describe('resolveExpoRuntimePlan barcode capability', () => {
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
        options: {
          barcodeScannerEnabled: true,
          cameraPermission: 'Allow camera access to scan barcodes.',
          microphonePermission: false,
          recordAudioAndroid: false,
        },
      },
    ]);
  });

  test('lets barcodeScanner capability override camera-only scanner disabling', () => {
    const plan = resolveExpoRuntimePlan(
      withFirstScreenRequirements({
        capabilities: [{ capability: 'barcodeScanner' }],
        permissions: [{ permission: 'camera' }],
      }),
    );

    expect(plan.nativeConfig.plugins).toContainEqual({
      name: 'expo-camera',
      options: {
        barcodeScannerEnabled: true,
        cameraPermission: 'Allow camera access to scan barcodes.',
        microphonePermission: false,
        recordAudioAndroid: false,
      },
    });
  });
});

describe('resolveExpoRuntimePlan Expo 57 plugin coverage', () => {
  test('keeps microphone-only native configuration free of background audio behavior', () => {
    const plan = resolveExpoRuntimePlan(
      withFirstScreenRequirements({ permissions: [{ permission: 'microphone' }] }),
    );

    expect(plan.nativeConfig.plugins).toEqual([
      {
        name: 'expo-audio',
        options: {
          enableBackgroundPlayback: false,
          enableBackgroundRecording: false,
          microphonePermission: 'Allow microphone access.',
          recordAudioAndroid: true,
        },
      },
    ]);
    expect(plan.dependencies).toContainEqual({
      name: EXPO_PLATFORM.packages.asset.name,
      version: EXPO_PLATFORM.packages.asset.version,
      reasons: [`peer:${EXPO_PLATFORM.packages.audio.name}`],
    });
  });

  test('translates every supported permission into current Expo 57 packages and plugins', () => {
    const plan = resolveExpoRuntimePlan(
      withFirstScreenRequirements({
        permissions: [
          { permission: 'microphone' },
          { permission: 'mediaLibrary' },
          { permission: 'mediaLibraryWrite' },
          { permission: 'locationForeground' },
          { permission: 'locationBackground' },
          { permission: 'notifications' },
        ],
      }),
    );

    expect(plan.diagnostics).toEqual([]);
    expect(plan.dependencies.map(({ name, version }) => ({ name, version }))).toEqual(
      SUPPORTED_PERMISSION_DEPENDENCIES,
    );
    expect(plan.nativeConfig.androidPermissions).toEqual([]);
    expect(plan.nativeConfig.plugins).toEqual(SUPPORTED_PERMISSION_PLUGINS);
  });
});

describe('resolveExpoRuntimePlan diagnostics and deduplication', () => {
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
});

describe('resolveExpoRuntimePlan platform-neutral permissions', () => {
  test('does not add runtime packages or providers for clipboard permissions', () => {
    const plan = resolveExpoRuntimePlan(
      withFirstScreenRequirements({ permissions: [{ permission: 'clipboard' }] }),
    );

    expect(plan.dependencies).toEqual([]);
    expect(plan.providers).toEqual([]);
    expect(plan.nativeConfig.plugins).toEqual([]);
  });
});

const SUPPORTED_PERMISSION_DEPENDENCIES = [
  { name: '@ankhorage/expo-runtime', version: '^3.0.0' },
  { name: '@ankhorage/permissions', version: '^0.2.3' },
  { name: 'expo-asset', version: EXPO_PLATFORM.packages.asset.version },
  { name: 'expo-audio', version: EXPO_PLATFORM.packages.audio.version },
  { name: 'expo-location', version: EXPO_PLATFORM.packages.location.version },
  { name: 'expo-media-library', version: EXPO_PLATFORM.packages.mediaLibrary.version },
  { name: 'expo-notifications', version: EXPO_PLATFORM.packages.notifications.version },
];

const SUPPORTED_PERMISSION_PLUGINS = [
  {
    name: 'expo-audio',
    options: {
      enableBackgroundPlayback: false,
      enableBackgroundRecording: false,
      microphonePermission: 'Allow microphone access.',
      recordAudioAndroid: true,
    },
  },
  {
    name: 'expo-location',
    options: {
      isAndroidBackgroundLocationEnabled: true,
      isAndroidForegroundServiceEnabled: true,
      isIosBackgroundLocationEnabled: true,
      locationAlwaysAndWhenInUsePermission: 'Allow location access.',
      locationWhenInUsePermission: 'Allow location access while using the app.',
    },
  },
  {
    name: 'expo-media-library',
    options: {
      photosPermission: 'Allow photo library access.',
      savePhotosPermission: 'Allow saving to the photo library.',
    },
  },
  { name: 'expo-notifications' },
];

interface TestScreenRequirements {
  readonly capabilities?: NonNullable<
    ExpoRuntimePlanningManifest['screens'][string]['requires']
  >['capabilities'];
  readonly permissions?: NonNullable<
    ExpoRuntimePlanningManifest['screens'][string]['requires']
  >['permissions'];
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
