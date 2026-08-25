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

import {
  EXPO_CAPABILITY_RUNTIME_REGISTRY,
  EXPO_RUNTIME_PACKAGE_PEERS,
  EXPO_RUNTIME_PROVIDER_PACKAGES,
  type ExpoRuntimeAdapterId,
  type ExpoRuntimeCapabilityMetadata,
  type ExpoRuntimeConfigPlugin,
  type ExpoRuntimeDiagnostic,
  type ExpoRuntimeProviderId,
  findCapabilityMetadata,
  findConfigHintMetadata,
  GENERATED_RUNTIME_DEPENDENCY_VERSIONS,
  unknownCapabilityDiagnostic,
  unknownPermissionDiagnostic,
  unsupportedPermissionDiagnostic,
} from './expoRuntimePlanningMetadata';

export type { ExpoRuntimeAdapterId, ExpoRuntimeProviderId };

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

interface ResolveExpoRuntimePlanOptions {
  readonly capabilityRegistry?: Readonly<
    Partial<Record<AnkhorageCapabilityName, ExpoRuntimeCapabilityMetadata>>
  >;
  readonly dependencyVersions?: Readonly<Record<string, string>>;
  readonly permissionSupport?: Readonly<Record<Permission, ExpoPermissionMetadata>>;
}

interface PlanningState {
  readonly permissions: Map<string, ScreenPermissionRequirement>;
  readonly impliedPermissions: Map<string, ScreenPermissionRequirement>;
  readonly capabilities: Map<string, ScreenCapabilityRequirement>;
  readonly diagnostics: ExpoRuntimeDiagnostic[];
  readonly dependencies: Map<string, ExpoRuntimeDependency>;
  readonly pluginOptions: Map<string, Record<string, boolean | string>>;
  readonly configHints: Set<string>;
  readonly androidPermissions: Set<string>;
  readonly providers: Set<ExpoRuntimeProviderId>;
  readonly runtimeAdapters: Set<ExpoRuntimeAdapterId>;
}

interface PlanningContext {
  readonly state: PlanningState;
  readonly capabilityRegistry: Readonly<
    Partial<Record<AnkhorageCapabilityName, ExpoRuntimeCapabilityMetadata>>
  >;
  readonly dependencyVersions: Readonly<Record<string, string>>;
  readonly permissionSupport: Readonly<Record<Permission, ExpoPermissionMetadata>>;
}

const EXPO_RUNTIME_PACKAGE_NAME = '@ankhorage/expo-runtime';

export function resolveExpoRuntimePlan(
  manifest: ExpoRuntimePlanningManifest,
  options: ResolveExpoRuntimePlanOptions = {},
): ExpoRuntimePlan {
  const state = createPlanningState(manifest);
  const context: PlanningContext = {
    state,
    capabilityRegistry: options.capabilityRegistry ?? EXPO_CAPABILITY_RUNTIME_REGISTRY,
    dependencyVersions: options.dependencyVersions ?? GENERATED_RUNTIME_DEPENDENCY_VERSIONS,
    permissionSupport: options.permissionSupport ?? EXPO_PERMISSION_SUPPORT,
  };
  addImpliedPermissions(context);
  planPermissions(context);
  planCapabilities(context);
  if (state.providers.size > 0 || state.runtimeAdapters.size > 0) {
    addDependency(context, EXPO_RUNTIME_PACKAGE_NAME, 'runtime:expo');
  }
  return buildPlan(state);
}

function createPlanningState(manifest: ExpoRuntimePlanningManifest): PlanningState {
  const permissions = new Map<string, ScreenPermissionRequirement>();
  const capabilities = new Map<string, ScreenCapabilityRequirement>();
  for (const screen of Object.values(manifest.screens)) {
    for (const requirement of screen.requires?.permissions ?? []) {
      permissions.set(requirement.permission, requirement);
    }
    for (const requirement of screen.requires?.capabilities ?? []) {
      capabilities.set(requirement.capability, requirement);
    }
  }
  return {
    permissions,
    capabilities,
    impliedPermissions: new Map(),
    diagnostics: [],
    dependencies: new Map(),
    pluginOptions: new Map(),
    configHints: new Set(),
    androidPermissions: new Set(),
    providers: new Set(),
    runtimeAdapters: new Set(),
  };
}

function addImpliedPermissions(context: PlanningContext): void {
  const { state } = context;
  for (const capability of state.capabilities.values()) {
    const metadata = findCapabilityMetadata(context.capabilityRegistry, capability);
    for (const permission of metadata?.impliedPermissions ?? []) {
      if (!state.permissions.has(permission.permission)) {
        state.permissions.set(permission.permission, permission);
        state.impliedPermissions.set(permission.permission, permission);
      }
    }
  }
}

function planPermissions(context: PlanningContext): void {
  for (const requirement of context.state.permissions.values()) {
    planPermission(context, requirement);
  }
}

function planPermission(context: PlanningContext, requirement: ScreenPermissionRequirement): void {
  if (!isPermission(requirement.permission)) {
    context.state.diagnostics.push(unknownPermissionDiagnostic(requirement.permission));
    return;
  }
  const metadata = findPermissionSupport(context.permissionSupport, requirement.permission);
  if (isUnsupported(metadata.support)) {
    context.state.diagnostics.push(
      unsupportedPermissionDiagnostic(requirement.permission, metadata.support),
    );
    return;
  }
  if (metadata.support === 'notRequired') {
    return;
  }
  const reason = `permission:${requirement.permission}`;
  addProvider(context, 'permissions', reason);
  metadata.requiredPackages.forEach((name) => addDependency(context, name, reason));
  metadata.configHints.forEach((hint) => applyConfigHint(context.state, hint));
}

function planCapabilities(context: PlanningContext): void {
  for (const requirement of context.state.capabilities.values()) {
    const metadata = findCapabilityMetadata(context.capabilityRegistry, requirement);
    if (metadata === undefined) {
      context.state.diagnostics.push(unknownCapabilityDiagnostic(requirement.capability));
      continue;
    }
    const reason = `capability:${requirement.capability}`;
    metadata.requiredPackages?.forEach((name) => addDependency(context, name, reason));
    metadata.providers?.forEach((provider) => addProvider(context, provider, reason));
    metadata.runtimeAdapters?.forEach((adapter) => context.state.runtimeAdapters.add(adapter));
    metadata.androidPermissions?.forEach((permission) =>
      context.state.androidPermissions.add(permission),
    );
    metadata.plugins?.forEach((plugin) => addPlugin(context.state, plugin));
  }
}

function applyConfigHint(state: PlanningState, configHint: string): void {
  state.configHints.add(configHint);
  const metadata = findConfigHintMetadata(configHint);
  if (metadata === undefined) {
    state.diagnostics.push({
      severity: 'warning',
      requirementType: 'configHint',
      requirement: configHint,
      message: `Config hint '${configHint}' is not translated into generated Expo config yet.`,
    });
    return;
  }
  metadata.androidPermissions?.forEach((permission) => state.androidPermissions.add(permission));
  if (metadata.plugin !== undefined) {
    addPlugin(state, metadata.plugin);
  }
}

function addDependency(context: PlanningContext, name: string, reason: string): void {
  const version = findDependencyVersion(context.dependencyVersions, name);
  if (version === undefined) {
    context.state.diagnostics.push({
      severity: 'warning',
      requirementType: 'package',
      requirement: name,
      message: `No generated-app dependency version is registered for '${name}'.`,
    });
    return;
  }
  const existing = context.state.dependencies.get(name);
  context.state.dependencies.set(name, {
    name,
    version,
    reasons: existing === undefined ? [reason] : Array.from(new Set([...existing.reasons, reason])),
  });
  const requiredPeers = Object.entries(EXPO_RUNTIME_PACKAGE_PEERS).find(
    ([packageName]) => packageName === name,
  )?.[1];
  for (const peerName of requiredPeers ?? []) {
    addDependency(context, peerName, `peer:${name}`);
  }
}

function addProvider(
  context: PlanningContext,
  provider: ExpoRuntimeProviderId,
  reason: string,
): void {
  context.state.providers.add(provider);
  const packageName = Object.entries(EXPO_RUNTIME_PROVIDER_PACKAGES).find(
    ([name]) => name === String(provider),
  )?.[1];
  if (packageName === undefined) {
    throw new Error(`Runtime package metadata is missing for provider '${provider}'.`);
  }
  addDependency(context, packageName, reason);
}

function addPlugin(state: PlanningState, plugin: ExpoRuntimeConfigPlugin): void {
  const existingOptions = state.pluginOptions.get(plugin.name) ?? {};
  state.pluginOptions.set(plugin.name, { ...existingOptions, ...(plugin.options ?? {}) });
}

function buildPlan(state: PlanningState): ExpoRuntimePlan {
  const plugins = Array.from(state.pluginOptions, ([name, options]) => ({
    name,
    options: Object.keys(options).length > 0 ? options : undefined,
  })).sort((left, right) => left.name.localeCompare(right.name));
  return {
    permissions: Array.from(state.permissions.values()).sort(comparePermissions),
    capabilities: Array.from(state.capabilities.values()).sort(compareCapabilities),
    impliedPermissions: Array.from(state.impliedPermissions.values()).sort(comparePermissions),
    dependencies: Array.from(state.dependencies.values()).sort((left, right) =>
      left.name.localeCompare(right.name),
    ),
    nativeConfig: {
      androidPermissions: Array.from(state.androidPermissions).sort(),
      configHints: Array.from(state.configHints).sort(),
      plugins,
    },
    providers: Array.from(state.providers).sort(),
    runtimeAdapters: Array.from(state.runtimeAdapters).sort(),
    usesExpoRuntimeRegistry: state.runtimeAdapters.size > 0,
    needsPermissionsProvider: state.providers.has('permissions'),
    diagnostics: state.diagnostics,
  };
}

function findPermissionSupport(
  registry: Readonly<Record<Permission, ExpoPermissionMetadata>>,
  permission: Permission,
): ExpoPermissionMetadata {
  const metadata = Object.entries(registry).find(([name]) => name === String(permission))?.[1];
  if (metadata === undefined) {
    throw new Error(`Permission metadata is missing for '${permission}'.`);
  }
  return metadata;
}

function findDependencyVersion(
  versions: Readonly<Record<string, string>>,
  name: string,
): string | undefined {
  return Object.entries(versions).find(([candidate]) => candidate === name)?.[1];
}

function isUnsupported(support: PermissionSupport): boolean {
  return support === 'unsupported' || support === 'notImplemented' || support === 'limited';
}

function compareCapabilities(
  left: ScreenCapabilityRequirement,
  right: ScreenCapabilityRequirement,
): number {
  return left.capability.localeCompare(right.capability);
}

function comparePermissions(
  left: ScreenPermissionRequirement,
  right: ScreenPermissionRequirement,
): number {
  return left.permission.localeCompare(right.permission);
}
