import type { AppDeployTargets } from '@ankhorage/contracts/deploy';

export type ExpoRuntimeNativePlatform = 'android' | 'ios';

export type ExpoRuntimeNativeSchemeMap = Readonly<
  Partial<Record<ExpoRuntimeNativePlatform, string>>
>;

export function resolveExpoRuntimeNativeSchemeMap(
  targets: AppDeployTargets,
): ExpoRuntimeNativeSchemeMap {
  const schemes: Partial<Record<ExpoRuntimeNativePlatform, string>> = {};

  if (targets.android?.enabled && targets.android.scheme !== undefined) {
    schemes.android = targets.android.scheme;
  }
  if (targets.ios?.enabled && targets.ios.scheme !== undefined) {
    schemes.ios = targets.ios.scheme;
  }

  return schemes;
}
