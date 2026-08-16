import type { AuthOAuthAuthorizationResponse } from '@ankhorage/contracts/auth';

export type ExpoOAuthBrowserTransportResult =
  | AuthOAuthAuthorizationResponse
  | { type: 'indeterminate'; reason: 'android_dismiss' };

export function resolveExpoOAuthBrowserResult(
  result: unknown,
  platform: string,
): ExpoOAuthBrowserTransportResult {
  if (!isRecord(result))
    return transportFailed('The Expo authentication browser returned no result.');

  const type = Reflect.get(result, 'type');
  if (type === 'success') {
    const url = Reflect.get(result, 'url');
    return typeof url === 'string' && url.trim().length > 0
      ? { type: 'callback', url }
      : transportFailed('The Expo authentication browser returned no callback URL.');
  }
  if (type === 'cancel') {
    return { type: 'cancelled', reason: 'user_cancelled' };
  }
  if (type === 'dismiss') {
    return platform === 'android'
      ? { type: 'indeterminate', reason: 'android_dismiss' }
      : { type: 'cancelled', reason: 'browser_dismissed' };
  }
  return transportFailed('The Expo authentication browser did not complete the OAuth redirect.');
}

export function resolveExpoOAuthBrowserException(): AuthOAuthAuthorizationResponse {
  return {
    type: 'error',
    error: {
      code: 'browser_unavailable',
      message: 'The Expo authentication browser could not be opened.',
    },
  };
}

function transportFailed(message: string): AuthOAuthAuthorizationResponse {
  return {
    type: 'error',
    error: { code: 'transport_failed', message },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
