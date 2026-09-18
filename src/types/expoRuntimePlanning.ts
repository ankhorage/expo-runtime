import type { AnkhorageCapabilityName, AnkhoragePermissionName } from '@ankhorage/contracts';
import type { ExpoPermissionMetadata } from '@ankhorage/permissions/expo/manifest';
import type { Permission } from '@ankhorage/permissions/registry';

import type {
  ExpoRuntimeAdapterId,
  ExpoRuntimeCapabilityMetadata,
  ExpoRuntimeDiagnostic,
  ExpoRuntimeProviderId,
} from '../expoRuntimePlanningMetadata';

export interface ExpoRuntimePermissionRequirement {
  readonly permission: AnkhoragePermissionName;
}

export interface ExpoRuntimeCapabilityRequirement {
  readonly capability: AnkhorageCapabilityName;
}

export interface ExpoRuntimeDependency {
  readonly name: string;
  readonly version: string;
  readonly reasons: readonly string[];
}

export interface ExpoRuntimePlanningState {
  readonly permissions: Map<AnkhoragePermissionName, ExpoRuntimePermissionRequirement>;
  readonly impliedPermissions: Map<AnkhoragePermissionName, ExpoRuntimePermissionRequirement>;
  readonly capabilities: Map<AnkhorageCapabilityName, ExpoRuntimeCapabilityRequirement>;
  readonly diagnostics: ExpoRuntimeDiagnostic[];
  readonly dependencies: Map<string, ExpoRuntimeDependency>;
  readonly pluginOptions: Map<string, Record<string, boolean | string>>;
  readonly configHints: Set<string>;
  readonly androidPermissions: Set<string>;
  readonly providers: Set<ExpoRuntimeProviderId>;
  readonly runtimeAdapters: Set<ExpoRuntimeAdapterId>;
}

export interface ExpoRuntimePlanningContext {
  readonly state: ExpoRuntimePlanningState;
  readonly capabilityRegistry: Readonly<
    Partial<Record<AnkhorageCapabilityName, ExpoRuntimeCapabilityMetadata>>
  >;
  readonly dependencyVersions: Readonly<Record<string, string>>;
  readonly permissionSupport: Readonly<Record<Permission, ExpoPermissionMetadata>>;
}
