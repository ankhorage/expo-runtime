import { describe, expect, test } from 'bun:test';

import { resolveExpoOAuthBrowserRuntimeReadiness } from './oauthBrowserRuntime';

describe('Expo OAuth browser runtime readiness', () => {
  test('allows a custom native application build', () => {
    expect(resolveExpoOAuthBrowserRuntimeReadiness(null)).toEqual({ status: 'ready' });
  });

  test('rejects Expo Go with an actionable development-build requirement', () => {
    expect(resolveExpoOAuthBrowserRuntimeReadiness({ debuggerHost: '127.0.0.1:8081' })).toEqual({
      status: 'unsupported',
      reason: 'expo-go',
      message:
        'Brokered OAuth requires a development or standalone build with the configured app scheme; Expo Go cannot provide a stable OAuth callback scheme.',
    });
  });

  test('does not serialize Expo Go configuration into readiness output', () => {
    const readiness = resolveExpoOAuthBrowserRuntimeReadiness({ secretLikeValue: 'do-not-echo' });

    expect(JSON.stringify(readiness)).not.toContain('do-not-echo');
  });
});
