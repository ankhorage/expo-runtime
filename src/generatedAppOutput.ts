import {
  type ExpoRuntimeLayoutIntegrationPlan,
  resolveExpoRuntimeLayoutIntegration,
} from './layoutIntegrationPlanning';
import type { ExpoRuntimePlan } from './resolveExpoRuntimePlan';

export type ExpoRuntimeDependencyMap = Readonly<Record<string, string>>;

export type ExpoRuntimeConfigPluginOutput =
  | string
  | readonly [string, Readonly<Record<string, boolean | string>>];

export interface ExpoRuntimeNativeOutputPlan {
  readonly androidPermissions: readonly string[];
  readonly configPlugins: readonly ExpoRuntimeConfigPluginOutput[];
}

export interface ExpoRuntimeGeneratedAppOutputPlan {
  readonly dependencies: ExpoRuntimeDependencyMap;
  readonly layoutIntegration: ExpoRuntimeLayoutIntegrationPlan;
  readonly native: ExpoRuntimeNativeOutputPlan;
}

export function resolveExpoRuntimeDependencyMap(
  runtimePlan: ExpoRuntimePlan | undefined,
): ExpoRuntimeDependencyMap {
  return Object.fromEntries(
    (runtimePlan?.dependencies ?? []).map((dependency) => [dependency.name, dependency.version]),
  );
}

export function resolveExpoRuntimeConfigPluginOutput(
  runtimePlan: ExpoRuntimePlan | undefined,
): readonly ExpoRuntimeConfigPluginOutput[] {
  return (runtimePlan?.nativeConfig.plugins ?? []).map((plugin) =>
    plugin.options === undefined ? plugin.name : ([plugin.name, plugin.options] as const),
  );
}

export function resolveExpoRuntimeNativeOutput(
  runtimePlan: ExpoRuntimePlan | undefined,
): ExpoRuntimeNativeOutputPlan {
  return {
    androidPermissions: runtimePlan?.nativeConfig.androidPermissions ?? [],
    configPlugins: resolveExpoRuntimeConfigPluginOutput(runtimePlan),
  };
}

export function resolveExpoRuntimeGeneratedAppOutput(
  runtimePlan: ExpoRuntimePlan | undefined,
): ExpoRuntimeGeneratedAppOutputPlan {
  return {
    dependencies: resolveExpoRuntimeDependencyMap(runtimePlan),
    layoutIntegration: resolveExpoRuntimeLayoutIntegration(runtimePlan),
    native: resolveExpoRuntimeNativeOutput(runtimePlan),
  };
}
