import { describe, expect, test } from 'bun:test';

import { resolveExpoOAuthBrowserRuntimeReadinessFromEnvironment } from './oauthBrowserRuntimeCore';

describe('Expo OAuth browser runtime readiness', () => {
  test('allows a custom native build with an embedded Expo config', () => {
    expect(
      resolveExpoOAuthBrowserRuntimeReadinessFromEnvironment({
        appOwnership: null,
        executionEnvironment: 'bare',
        expoGoConfig: { name: 'Auth5 Native OAuth Smoke' },
      }),
    ).toEqual({ status: 'ready' });
  });

  test('allows a development client store-client runtime', () => {
    expect(
      resolveExpoOAuthBrowserRuntimeReadinessFromEnvironment({
        appOwnership: null,
        executionEnvironment: 'storeClient',
        expoGoConfig: null,
      }),
    ).toEqual({ status: 'ready' });
  });

  test('allows a standalone runtime', () => {
    expect(
      resolveExpoOAuthBrowserRuntimeReadinessFromEnvironment({
        appOwnership: null,
        executionEnvironment: 'standalone',
        expoGoConfig: null,
      }),
    ).toEqual({ status: 'ready' });
  });

  test('rejects Expo Go with an actionable development-build requirement', () => {
    expect(
      resolveExpoOAuthBrowserRuntimeReadinessFromEnvironment({
        appOwnership: 'expo',
        executionEnvironment: 'storeClient',
        expoGoConfig: { debuggerHost: '127.0.0.1:8081' },
      }),
    ).toEqual({
      status: 'unsupported',
      reason: 'expo-go',
      message:
        'Brokered OAuth requires a development or standalone build with the configured app scheme; Expo Go cannot provide a stable OAuth callback scheme.',
    });
  });

  test('does not serialize Expo runtime configuration into readiness output', () => {
    const readiness = resolveExpoOAuthBrowserRuntimeReadinessFromEnvironment({
      appOwnership: 'expo',
      executionEnvironment: 'storeClient',
      expoGoConfig: { secretLikeValue: 'do-not-echo' },
    });

    expect(JSON.stringify(readiness)).not.toContain('do-not-echo');
  });
});
