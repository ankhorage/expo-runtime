import type {
  AnkhorageCapabilityName,
  ScreenCapabilityRequirement,
  ScreenPermissionRequirement,
} from '@ankhorage/contracts';
import type { PermissionSupport } from '@ankhorage/permissions/expo/manifest';

import { EXPO_PLATFORM, type ExpoPlatformPackage } from './platform';

export interface ExpoRuntimeConfigPlugin {
  readonly name: string;
  readonly options?: Readonly<Record<string, boolean | string>>;
}

export type ExpoRuntimeProviderId = 'permissions';
export type ExpoRuntimeAdapterId = 'ExpoBarcodeScannerAdapter';

export interface ExpoRuntimeDiagnostic {
  readonly severity: 'error' | 'warning';
  readonly requirementType: 'capability' | 'configHint' | 'package' | 'permission';
  readonly requirement: string;
  readonly message: string;
  readonly support?: PermissionSupport;
}

export interface ExpoRuntimeCapabilityMetadata {
  readonly impliedPermissions?: readonly ScreenPermissionRequirement[];
  readonly requiredPackages?: readonly string[];
  readonly providers?: readonly ExpoRuntimeProviderId[];
  readonly runtimeAdapters?: readonly ExpoRuntimeAdapterId[];
  readonly androidPermissions?: readonly string[];
  readonly plugins?: readonly ExpoRuntimeConfigPlugin[];
}

export interface ExpoRuntimeHintMetadata {
  readonly androidPermissions?: readonly string[];
  readonly plugin?: ExpoRuntimeConfigPlugin;
}

const GENERATED_ANKHORAGE_DEPENDENCY_VERSIONS = {
  '@ankhorage/permissions': '^0.2.2',
  '@ankhorage/expo-runtime': '^3.0.0',
} as const satisfies Record<string, string>;

const GENERATED_EXPO_DEPENDENCY_VERSIONS = Object.fromEntries(
  Object.values(EXPO_PLATFORM.packages).map((dependency: ExpoPlatformPackage) => [
    dependency.name,
    dependency.version,
  ]),
) as Readonly<Record<string, string>>;

export const GENERATED_RUNTIME_DEPENDENCY_VERSIONS = {
  ...GENERATED_ANKHORAGE_DEPENDENCY_VERSIONS,
  ...GENERATED_EXPO_DEPENDENCY_VERSIONS,
} as const satisfies Readonly<Record<string, string>>;

export const EXPO_RUNTIME_PROVIDER_PACKAGES = {
  permissions: '@ankhorage/permissions',
} as const satisfies Record<ExpoRuntimeProviderId, string>;

const EXPO_RUNTIME_CONFIG_HINTS = {
  cameraPermission: {
    plugin: {
      name: EXPO_PLATFORM.packages.camera.name,
      options: {
        barcodeScannerEnabled: false,
        cameraPermission: 'Allow camera access.',
        microphonePermission: false,
        recordAudioAndroid: false,
      },
    },
  },
  microphonePermission: {
    plugin: {
      name: EXPO_PLATFORM.packages.audio.name,
      options: {
        enableBackgroundPlayback: false,
        enableBackgroundRecording: false,
        microphonePermission: 'Allow microphone access.',
      },
    },
  },
  recordAudioAndroid: {
    plugin: {
      name: EXPO_PLATFORM.packages.audio.name,
      options: {
        enableBackgroundPlayback: false,
        enableBackgroundRecording: false,
        recordAudioAndroid: true,
      },
    },
  },
  mediaLibraryPermission: {
    plugin: {
      name: EXPO_PLATFORM.packages.mediaLibrary.name,
      options: {
        photosPermission: 'Allow photo library access.',
        savePhotosPermission: 'Allow saving to the photo library.',
      },
    },
  },
  locationWhenInUsePermission: {
    plugin: {
      name: EXPO_PLATFORM.packages.location.name,
      options: {
        locationWhenInUsePermission: 'Allow location access while using the app.',
      },
    },
  },
  locationAlwaysAndWhenInUsePermission: {
    plugin: {
      name: EXPO_PLATFORM.packages.location.name,
      options: {
        locationAlwaysAndWhenInUsePermission: 'Allow location access.',
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
        isIosBackgroundLocationEnabled: true,
      },
    },
  },
  notificationsPermission: {
    plugin: {
      name: EXPO_PLATFORM.packages.notifications.name,
    },
  },
} as const satisfies Readonly<Record<string, ExpoRuntimeHintMetadata>>;

export const EXPO_CAPABILITY_RUNTIME_REGISTRY = {
  barcodeScanner: {
    impliedPermissions: [{ permission: 'camera' }],
    requiredPackages: [EXPO_PLATFORM.packages.camera.name],
    providers: ['permissions'],
    runtimeAdapters: ['ExpoBarcodeScannerAdapter'],
    plugins: [
      {
        name: EXPO_PLATFORM.packages.camera.name,
        options: {
          cameraPermission: 'Allow camera access to scan barcodes.',
          barcodeScannerEnabled: true,
          microphonePermission: false,
          recordAudioAndroid: false,
        },
      },
    ],
  },
} as const satisfies Readonly<
  Partial<Record<AnkhorageCapabilityName, ExpoRuntimeCapabilityMetadata>>
>;

export function findCapabilityMetadata(
  registry: Readonly<Partial<Record<AnkhorageCapabilityName, ExpoRuntimeCapabilityMetadata>>>,
  requirement: ScreenCapabilityRequirement,
): ExpoRuntimeCapabilityMetadata | undefined {
  return Object.entries(registry).find(([name]) => name === requirement.capability)?.[1];
}

export function findConfigHintMetadata(configHint: string): ExpoRuntimeHintMetadata | undefined {
  return Object.entries(EXPO_RUNTIME_CONFIG_HINTS).find(([name]) => name === configHint)?.[1];
}

export function unknownPermissionDiagnostic(permission: string): ExpoRuntimeDiagnostic {
  return {
    severity: 'error',
    requirementType: 'permission',
    requirement: permission,
    message: `Unknown permission '${permission}' cannot be resolved for Expo runtime generation.`,
  };
}

export function unsupportedPermissionDiagnostic(
  permission: string,
  support: PermissionSupport,
): ExpoRuntimeDiagnostic {
  return {
    severity: support === 'limited' ? 'warning' : 'error',
    requirementType: 'permission',
    requirement: permission,
    message: `Expo runtime support for '${permission}' is '${support}'.`,
    support,
  };
}

export function unknownCapabilityDiagnostic(capability: string): ExpoRuntimeDiagnostic {
  return {
    severity: 'warning',
    requirementType: 'capability',
    requirement: capability,
    message: `No Expo runtime metadata is registered for capability '${capability}'.`,
  };
}
