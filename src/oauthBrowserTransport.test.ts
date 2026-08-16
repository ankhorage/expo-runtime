import { describe, expect, test } from 'bun:test';

import {
  resolveExpoOAuthBrowserException,
  resolveExpoOAuthBrowserResult,
} from './oauthBrowserTransport';

describe('Expo OAuth browser transport', () => {
  test('maps a successful browser redirect to a callback response', () => {
    expect(
      resolveExpoOAuthBrowserResult(
        { type: 'success', url: 'ankh://auth/callback?code=abc' },
        'android',
      ),
    ).toEqual({ type: 'callback', url: 'ankh://auth/callback?code=abc' });
  });

  test('maps explicit user cancellation to a terminal cancellation', () => {
    expect(resolveExpoOAuthBrowserResult({ type: 'cancel' }, 'android')).toEqual({
      type: 'cancelled',
      reason: 'user_cancelled',
    });
  });

  test('keeps Android dismiss indeterminate because app re-entry can race the callback', () => {
    expect(resolveExpoOAuthBrowserResult({ type: 'dismiss' }, 'android')).toEqual({
      type: 'indeterminate',
      reason: 'android_dismiss',
    });
  });

  test.each(['ios', 'web'])(
    'maps %s browser dismissal to a terminal cancellation',
    (platform) => {
      expect(resolveExpoOAuthBrowserResult({ type: 'dismiss' }, platform)).toEqual({
        type: 'cancelled',
        reason: 'browser_dismissed',
      });
    },
  );

  test.each(['locked', 'opened'])(
    'maps %s to a transport failure instead of cancellation',
    (type) => {
      expect(resolveExpoOAuthBrowserResult({ type }, 'android')).toEqual({
        type: 'error',
        error: {
          code: 'transport_failed',
          message: 'The Expo authentication browser did not complete the OAuth redirect.',
        },
      });
    },
  );

  test('rejects malformed success and unknown results as transport failures', () => {
    expect(resolveExpoOAuthBrowserResult({ type: 'success' }, 'android')).toMatchObject({
      type: 'error',
      error: { code: 'transport_failed' },
    });
    expect(resolveExpoOAuthBrowserResult(null, 'android')).toMatchObject({
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
