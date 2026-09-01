import { describe, expect, test } from 'bun:test';

import { resolveExpoRuntimeLayoutIntegration } from './layoutIntegrationPlanning';
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

const PERMISSIONS_PROVIDER_START = "<ExpoRuntimeProviders providers={['permissions']}>";

describe('layoutIntegrationPlanning', () => {
  test('returns an empty integration plan when no providers are required', () => {
    expect(resolveExpoRuntimeLayoutIntegration(undefined)).toEqual({
      imports: [],
      moduleDeclarations: [],
      providerStart: [],
      providerEnd: [],
    });
    expect(resolveExpoRuntimeLayoutIntegration(EMPTY_PLAN)).toEqual({
      imports: [],
      moduleDeclarations: [],
      providerStart: [],
      providerEnd: [],
    });
  });

  test('adds ExpoRuntimeProviders import and wrapper when providers are required', () => {
    expect(
      resolveExpoRuntimeLayoutIntegration({
        ...EMPTY_PLAN,
        providers: ['permissions'],
        needsPermissionsProvider: true,
      }),
    ).toEqual({
      imports: ["import { ExpoRuntimeProviders } from '@ankhorage/expo-runtime/providers';"],
      moduleDeclarations: [],
      providerStart: [PERMISSIONS_PROVIDER_START],
      providerEnd: ['</ExpoRuntimeProviders>'],
    });
  });
});
