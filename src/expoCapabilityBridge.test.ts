import { describe, expect, test } from 'bun:test';

import { CAPABILITIES } from './capabilities';
import { executeExpoRuntimeCapability, resolveExpoRuntimeRoutePath } from './expoCapabilityBridge';

describe('expoCapabilityBridge', () => {
  test('resolves dynamic route params and keeps unused params', () => {
    expect(resolveExpoRuntimeRoutePath('/users/[id]', { id: 42, tab: 'profile' })).toEqual({
      resolvedPath: '/users/42',
      unusedParams: { tab: 'profile' },
    });
  });

  test('executes the canonical Expo alert capability', async () => {
    const messages: string[] = [];

    await executeExpoRuntimeCapability({
      capability: CAPABILITIES[0],
      input: { message: 'Saved' },
      alertImpl: (message) => messages.push(message),
    });

    expect(messages).toEqual(['Saved']);
  });

  test('delegates foreign canonical capabilities to their configured runtime handler', async () => {
    const calls: string[] = [];
    const capability = {
      id: 'navigator.navigate',
      owner: '@ankhorage/navigator',
      access: ['invoke'],
      binding: { kind: 'action', bindableAs: ['target'] },
    } as const;

    await executeExpoRuntimeCapability({
      capability,
      input: { route: 'users/[id]', params: { id: 42 } },
      capabilityHandlers: [
        {
          capabilityId: 'navigator.navigate',
          execute: ({ capability: handled }) => calls.push(handled.id),
        },
      ],
    });

    expect(calls).toEqual(['navigator.navigate']);
  });
});
