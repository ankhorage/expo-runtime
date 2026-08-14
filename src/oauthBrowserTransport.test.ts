import { describe, expect, test } from 'bun:test';

import {
  resolveExpoOAuthBrowserException,
  resolveExpoOAuthBrowserResult,
} from './oauthBrowserTransport';

describe('Expo OAuth browser transport', () => {
  test('maps a successful browser redirect to a callback response', () => {
    expect(
      resolveExpoOAuthBrowserResult({ type: 'success', url: 'ankh://auth/callback?code=abc' }),
    ).toEqual({ type: 'callback', url: 'ankh://auth/callback?code=abc' });
  });

  test('maps user cancellation separately from browser dismissal', () => {
    expect(resolveExpoOAuthBrowserResult({ type: 'cancel' })).toEqual({
      type: 'cancelled',
      reason: 'user_cancelled',
    });
    expect(resolveExpoOAuthBrowserResult({ type: 'dismiss' })).toEqual({
      type: 'cancelled',
      reason: 'browser_dismissed',
    });
  });

  test.each(['locked', 'opened'])(
    'maps %s to a transport failure instead of cancellation',
    (type) => {
      expect(resolveExpoOAuthBrowserResult({ type })).toEqual({
        type: 'error',
        error: {
          code: 'transport_failed',
          message: 'The Expo authentication browser did not complete the OAuth redirect.',
        },
      });
    },
  );

  test('rejects malformed success and unknown results as transport failures', () => {
    expect(resolveExpoOAuthBrowserResult({ type: 'success' })).toMatchObject({
      type: 'error',
      error: { code: 'transport_failed' },
    });
    expect(resolveExpoOAuthBrowserResult(null)).toMatchObject({
      type: 'error',
      error: { code: 'transport_failed' },
    });
  });

  test('maps a rejected browser invocation to browser unavailable', () => {
    expect(resolveExpoOAuthBrowserException()).toEqual({
      type: 'error',
      error: {
        code: 'browser_unavailable',
        message: 'The Expo authentication browser could not be opened.',
      },
    });
  });
});
