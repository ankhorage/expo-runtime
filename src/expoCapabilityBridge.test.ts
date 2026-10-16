import type { Capability } from '@ankhorage/contracts/capability';
import { describe, expect, test } from 'bun:test';

import { CAPABILITIES } from './capabilities';
import { executeExpoRuntimeCapabilityAsync, resolveExpoRuntimeRoutePath } from './capabilityBridge';

describe('expoCapabilityBridge Expo-owned capabilities', () => {
  test('resolves dynamic route params and keeps unused params', () => {
    expect(resolveExpoRuntimeRoutePath('/users/[id]', { id: 42, tab: 'profile' })).toEqual({
      resolvedPath: '/users/42',
      unusedParams: { tab: 'profile' },
    });
  });

  test('executes the canonical Expo alert capability', async () => {
    const messages: string[] = [];

    const expoAlertCapability = findCapabilityById('expo.alert');

    const result = await executeExpoRuntimeCapabilityAsync({
      capability: expoAlertCapability,
      input: { message: 'Saved' },
      alertImpl: (message) => messages.push(message),
    });

    expect(result).toEqual({ ok: true });
    expect(messages).toEqual(['Saved']);
  });

  test('rejects malformed Expo alert input without invoking the host callback', async () => {
    const messages: string[] = [];

    const result = await executeExpoRuntimeCapabilityAsync({
      capability: findCapabilityById('expo.alert'),
      input: { message: 42 },
      alertImpl: (message) => messages.push(message),
    });

    expect(result).toEqual({
      ok: false,
      diagnostics: [
        {
          code: 'invalid-expo-alert-input',
          message:
            "The 'expo.alert' capability requires an input object with only a string 'message'.",
        },
      ],
    });
    expect(messages).toEqual([]);
  });
});

describe('expoCapabilityBridge foreign capabilities', () => {
  test('delegates foreign canonical capabilities to their configured runtime handler', async () => {
    const calls: string[] = [];
    const capability = {
      id: 'navigator.navigate',
      owner: '@ankhorage/navigator',
      access: ['invoke'],
      binding: { kind: 'action', bindableAs: ['target'] },
    } as const;

    const result = await executeExpoRuntimeCapabilityAsync({
      capability,
      input: { route: 'users/[id]', params: { id: 42 } },
      capabilityHandlers: [
        {
          capabilityId: 'navigator.navigate',
          execute: ({ capability: handled }) => calls.push(handled.id),
        },
      ],
    });

    expect(result).toEqual({ ok: true });
    expect(calls).toEqual(['navigator.navigate']);
  });

  test('rejects a foreign canonical capability without a configured runtime handler', async () => {
    const result = await executeExpoRuntimeCapabilityAsync({
      capability: {
        id: 'theme.setMode',
        owner: '@ankhorage/surface',
        access: ['invoke'],
        binding: { kind: 'action', bindableAs: ['target'] },
      },
    });

    expect(result).toEqual({
      ok: false,
      diagnostics: [
        {
          code: 'missing-capability-handler',
          message: "No Expo Runtime capability handler is configured for 'theme.setMode'.",
        },
      ],
    });
  });
});

function findCapabilityById(capabilityId: string): Capability {
  const capabilityCatalog: readonly Capability[] = CAPABILITIES;
  const capability = capabilityCatalog.find((candidate) => candidate.id === capabilityId);
  if (!capability) {
    throw new Error(`Missing capability '${capabilityId}'.`);
  }
  return capability;
}
