import type {
  AnkhorageCapabilityName,
  ScreenCapabilityRequirement,
  ScreenPermissionRequirement,
} from '@ankhorage/contracts';
import type { Permission } from '@ankhorage/permissions';
import { isPermission } from '@ankhorage/permissions';
import {
  EXPO_PERMISSION_SUPPORT,
  type ExpoPermissionMetadata,
  type PermissionSupport,
} from '@ankhorage/permissions/expo/manifest';

import { EXPO_PLATFORM, type ExpoPlatformPackage } from './platform';

export interface ExpoRuntimePlanningScreen {
  readonly requires?: {
    readonly capabilities?: readonly ScreenCapabilityRequirement[];
    readonly permissions?: readonly ScreenPermissionRequirement[];
  };
}

export interface ExpoRuntimePlanningManifest {
  readonly screens: Readonly<Record<string, ExpoRuntimePlanningScreen>>;
}

interface ExpoRuntimeDependency {
  readonly name: string;
  readonly version: string;
  readonly reasons: readonly string[];
}

interface ExpoRuntimeConfigPlugin {
  readonly name: string;
  readonly options?: Readonly<Record<string, boolean | string>>;
}

export type ExpoRuntimeProviderId = 'permissions';
export type ExpoRuntimeAdapterId = 'ExpoBarcodeScannerAdapter';

interface ExpoRuntimeDiagnostic {
  readonly severity: 'error' | 'warning';
  readonly requirementType: 'capability' | 'configHint' | 'package' | 'permission';
  readonly requirement: string;
  readonly message: string;
  readonly support?: PermissionSupport;
}

export interface ExpoRuntimePlan {
  readonly permissions: readonly ScreenPermissionRequirement[];
  readonly capabilities: readonly ScreenCapabilityRequirement[];
  readonly impliedPermissions: readonly ScreenPermissionRequirement[];
  readonly dependencies: readonly ExpoRuntimeDependency[];
  readonly nativeConfig: {
    readonly androidPermissions: readonly string[];
    readonly configHints: readonly string[];
    readonly plugins: readonly ExpoRuntimeConfigPlugin[];
  };
  readonly providers: readonly ExpoRuntimeProviderId[];
  readonly runtimeAdapters: readonly ExpoRuntimeAdapterId[];
  readonly usesExpoRuntimeRegistry: boolean;
  readonly needsPermissionsProvider: boolean;
  readonly diagnostics: readonly ExpoRuntimeDiagnostic[];
}

interface ExpoRuntimeCapabilityMetadata {
  readonly impliedPermissions?: readonly ScreenPermissionRequirement[];
  readonly requiredPackages?: readonly string[];
  readonly providers?: readonly ExpoRuntimeProviderId[];
  readonly runtimeAdapters?: readonly ExpoRuntimeAdapterId[];
  readonly androidPermissions?: readonly string[];
  readonly plugins?: readonly ExpoRuntimeConfigPlugin[];
}

interface ExpoRuntimeHintMetadata {
  readonly androidPermissions?: readonly string[];
  readonly plugin?: ExpoRuntimeConfigPlugin;
}

interface ResolveExpoRuntimePlanOptions {
  readonly capabilityRegistry?: Readonly<
    Partial<Record<AnkhorageCapabilityName, ExpoRuntimeCapabilityMetadata>>
  >;
  readonly dependencyVersions?: Readonly<Record<string, string>>;
  readonly permissionSupport?: Readonly<Record<Permission, ExpoPermissionMetadata>>;
}

const EXPO_RUNTIME_PACKAGE_NAME = '@ankhorage/expo-runtime';

const GENERATED_ANKHORAGE_DEPENDENCY_VERSIONS = {
  '@ankhorage/permissions': '^0.2.0',
  '@ankhorage/expo-runtime': 'latest',
} as const satisfies Record<string, string>;

const GENERATED_EXPO_DEPENDENCY_VERSIONS = Object.fromEntries(
  Object.values(EXPO_PLATFORM.packages).map((dependency: ExpoPlatformPackage) => [
    dependency.name,
    dependency.version,
  ]),
) as Readonly<Record<string, string>>;

const GENERATED_RUNTIME_DEPENDENCY_VERSIONS = {
  ...GENERATED_ANKHORAGE_DEPENDENCY_VERSIONS,
  ...GENERATED_EXPO_DEPENDENCY_VERSIONS,
} as const satisfies Readonly<Record<string, string>>;

const EXPO_RUNTIME_PROVIDER_PACKAGES = {
  permissions: '@ankhorage/permissions',
} as const satisfies Record<ExpoRuntimeProviderId, string>;

const EXPO_RUNTIME_CONFIG_HINTS = {
  cameraPermission: {
    plugin: {
      name: EXPO_PLATFORM.packages.camera.name,
      options: {
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
        microphonePermission: 'Allow microphone access.',
      },
    },
  },
  recordAudioAndroid: {
    plugin: {
      name: EXPO_PLATFORM.packages.audio.name,
      options: {
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

const EXPO_CAPABILITY_RUNTIME_REGISTRY = {
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

export function resolveExpoRuntimePlan(
  manifest: ExpoRuntimePlanningManifest,
  options: ResolveExpoRuntimePlanOptions = {},
): ExpoRuntimePlan {
  const permissionsByName = new Map<string, ScreenPermissionRequirement>();
  const impliedPermissionsByName = new Map<string, ScreenPermissionRequirement>();
  const capabilitiesByName = new Map<string, ScreenCapabilityRequirement>();

  for (const screen of Object.values(manifest.screens)) {
    screen.requires?.permissions?.forEach((requirement) => {
      permissionsByName.set(requirement.permission, requirement);
    });
    screen.requires?.capabilities?.forEach((requirement) => {
      capabilitiesByName.set(requirement.capability, requirement);
    });
  }

  const capabilityRegistry: Readonly<
    Partial<Record<AnkhorageCapabilityName, ExpoRuntimeCapabilityMetadata>>
  > = options.capabilityRegistry ?? EXPO_CAPABILITY_RUNTIME_REGISTRY;

  for (const capabilityRequirement of capabilitiesByName.values()) {
    capabilityRegistry[capabilityRequirement.capability]?.impliedPermissions?.forEach(
      (permissionRequirement: ScreenPermissionRequirement) => {
        if (!permissionsByName.has(permissionRequirement.permission)) {
          permissionsByName.set(permissionRequirement.permission, permissionRequirement);
          impliedPermissionsByName.set(permissionRequirement.permission, permissionRequirement);
        }
      },
    );
  }

  const diagnostics: ExpoRuntimeDiagnostic[] = [];
  const dependencies = new Map<string, ExpoRuntimeDependency>();
  const pluginOptions = new Map<string, Record<string, boolean | string>>();
  const configHints = new Set<string>();
  const androidPermissions = new Set<string>();
  const providers = new Set<ExpoRuntimeProviderId>();
  const runtimeAdapters = new Set<ExpoRuntimeAdapterId>();
  const dependencyVersions: Readonly<Record<string, string>> =
    options.dependencyVersions ?? GENERATED_RUNTIME_DEPENDENCY_VERSIONS;
  const permissionSupport = options.permissionSupport ?? EXPO_PERMISSION_SUPPORT;
  const configHintRegistry: Readonly<Record<string, ExpoRuntimeHintMetadata>> =
    EXPO_RUNTIME_CONFIG_HINTS;

  const addDependency = (name: string, reason: string) => {
    const version = dependencyVersions[name];
    if (version === undefined) {
      diagnostics.push({
        severity: 'warning',
        requirementType: 'package',
        requirement: name,
        message: `No generated-app dependency version is registered for '${name}'.`,
      });
      return;
    }

    const existing = dependencies.get(name);
    if (existing) {
      dependencies.set(name, {
        ...existing,
        reasons: Array.from(new Set([...existing.reasons, reason])),
      });
      return;
    }

    dependencies.set(name, {
      name,
      version,
      reasons: [reason],
    });
  };

  const addProvider = (provider: ExpoRuntimeProviderId, reason: string) => {
    providers.add(provider);
    addDependency(EXPO_RUNTIME_PROVIDER_PACKAGES[provider], reason);
  };

  const addPlugin = (plugin: ExpoRuntimeConfigPlugin) => {
    const existingOptions = pluginOptions.get(plugin.name) ?? {};
    pluginOptions.set(plugin.name, {
      ...existingOptions,
      ...(plugin.options ?? {}),
    });
  };

  for (const permissionRequirement of permissionsByName.values()) {
    if (!isPermission(permissionRequirement.permission)) {
      diagnostics.push({
        severity: 'error',
        requirementType: 'permission',
        requirement: permissionRequirement.permission,
        message: `Unknown permission '${permissionRequirement.permission}' cannot be resolved for Expo runtime generation.`,
      });
      continue;
    }

    const supportMetadata = permissionSupport[permissionRequirement.permission];
    if (
      supportMetadata.support === 'unsupported' ||
      supportMetadata.support === 'notImplemented' ||
      supportMetadata.support === 'limited'
    ) {
      diagnostics.push({
        severity: supportMetadata.support === 'limited' ? 'warning' : 'error',
        requirementType: 'permission',
        requirement: permissionRequirement.permission,
        message: `Expo runtime support for '${permissionRequirement.permission}' is '${supportMetadata.support}'.`,
        support: supportMetadata.support,
      });
      continue;
    }

    if (supportMetadata.support === 'notRequired') {
      continue;
    }

    addProvider('permissions', `permission:${permissionRequirement.permission}`);
    supportMetadata.requiredPackages.forEach((packageName) => {
      addDependency(packageName, `permission:${permissionRequirement.permission}`);
    });

    supportMetadata.configHints.forEach((configHint) => {
      configHints.add(configHint);
      const configHintMetadata = configHintRegistry[configHint];
      if (!configHintMetadata) {
        diagnostics.push({
          severity: 'warning',
          requirementType: 'configHint',
          requirement: configHint,
          message: `Config hint '${configHint}' is not translated into generated Expo config yet.`,
        });
        return;
      }

      configHintMetadata.androidPermissions?.forEach((permissionName) => {
        androidPermissions.add(permissionName);
      });
      if (configHintMetadata.plugin) {
        addPlugin(configHintMetadata.plugin);
      }
    });
  }

  for (const capabilityRequirement of capabilitiesByName.values()) {
    const capabilityMetadata = capabilityRegistry[capabilityRequirement.capability];
    if (!capabilityMetadata) {
      diagnostics.push({
        severity: 'warning',
        requirementType: 'capability',
        requirement: capabilityRequirement.capability,
        message: `No Expo runtime metadata is registered for capability '${capabilityRequirement.capability}'.`,
      });
      continue;
    }

    capabilityMetadata.requiredPackages?.forEach((packageName) => {
      addDependency(packageName, `capability:${capabilityRequirement.capability}`);
    });
    capabilityMetadata.providers?.forEach((provider) => {
      addProvider(provider, `capability:${capabilityRequirement.capability}`);
    });
    capabilityMetadata.runtimeAdapters?.forEach((runtimeAdapter) => {
      runtimeAdapters.add(runtimeAdapter);
    });
    capabilityMetadata.androidPermissions?.forEach((permissionName) => {
      androidPermissions.add(permissionName);
    });
    capabilityMetadata.plugins?.forEach(addPlugin);
  }

  if (providers.size > 0 || runtimeAdapters.size > 0) {
    addDependency(EXPO_RUNTIME_PACKAGE_NAME, 'runtime:expo');
  }

  const plugins = Array.from(pluginOptions.entries())
    .map(([name, pluginOptions]) => ({
      name,
      options: Object.keys(pluginOptions).length > 0 ? pluginOptions : undefined,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    permissions: Array.from(permissionsByName.values()).sort(comparePermissionRequirements),
    capabilities: Array.from(capabilitiesByName.values()).sort(compareCapabilityRequirements),
    impliedPermissions: Array.from(impliedPermissionsByName.values()).sort(
      comparePermissionRequirements,
    ),
    dependencies: Array.from(dependencies.values()).sort((left, right) =>
      left.name.localeCompare(right.name),
    ),
    nativeConfig: {
      androidPermissions: Array.from(androidPermissions).sort(),
      configHints: Array.from(configHints).sort(),
      plugins,
    },
    providers: Array.from(providers).sort(),
    runtimeAdapters: Array.from(runtimeAdapters).sort(),
    usesExpoRuntimeRegistry: runtimeAdapters.size > 0,
    needsPermissionsProvider: providers.has('permissions'),
    diagnostics,
  };
}

function compareCapabilityRequirements(
  left: ScreenCapabilityRequirement,
  right: ScreenCapabilityRequirement,
): number {
  return left.capability.localeCompare(right.capability);
}

function comparePermissionRequirements(
  left: ScreenPermissionRequirement,
  right: ScreenPermissionRequirement,
): number {
  return left.permission.localeCompare(right.permission);
}
