import { afterEach, describe, expect, test } from 'bun:test';

import { createExpoApprovalNotificationRuntime } from './createExpoApprovalNotificationRuntime.web';

const ORIGINAL_WINDOW = globalThis.window;
const ORIGINAL_NOTIFICATION = globalThis.Notification;

describe('createExpoApprovalNotificationRuntime web fallback', () => {
  afterEach(() => {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: ORIGINAL_WINDOW });
    Object.defineProperty(globalThis, 'Notification', {
      configurable: true,
      value: ORIGINAL_NOTIFICATION,
    });
  });

  test('routes the initial web link and reports unsupported browser notifications', async () => {
    const events: string[] = [];
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        addEventListener: (name: string) => events.push(`add:${name}`),
        location: {
          href: 'https://app.example/flows/flow-2/versions/3/runs/run-5/approvals/approval-7',
        },
        removeEventListener: (name: string) => events.push(`remove:${name}`),
      },
    });
    Object.defineProperty(globalThis, 'Notification', { configurable: true, value: undefined });

    const runtime = createExpoApprovalNotificationRuntime({
      navigateAsync: (route) => events.push(`navigate:${route.approvalId}`),
      onUnavailableAsync: (_, availability) => events.push(`unavailable:${availability}`),
      resolveAvailabilityAsync: () => Promise.resolve('available'),
    });

    await runtime.startAsync();

    expect(events).toEqual(['navigate:approval-7', 'add:popstate']);
    expect(await runtime.requestPermissionAsync()).toBe('unsupported');
    runtime.dispose();
    expect(events).toEqual(['navigate:approval-7', 'add:popstate', 'remove:popstate']);
  });
});

describe('createExpoApprovalNotificationRuntime web lifecycle', () => {
  test('does not attach the web listener when disposal wins an asynchronous startup race', async () => {
    const events: string[] = [];
    const navigation = createDeferred();
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        addEventListener: (name: string) => events.push(`add:${name}`),
        location: {
          href: 'https://app.example/flows/flow-2/versions/3/runs/run-5/approvals/approval-7',
        },
        removeEventListener: (name: string) => events.push(`remove:${name}`),
      },
    });

    const runtime = createExpoApprovalNotificationRuntime({
      navigateAsync: () => navigation.promise,
      onUnavailableAsync: () => events.push('unavailable'),
      resolveAvailabilityAsync: () => Promise.resolve('available'),
    });
    const start = runtime.startAsync();
    await Promise.resolve();
    runtime.dispose();
    navigation.resolve();
    await start;

    expect(events).toEqual(['remove:popstate']);
  });
});

function createDeferred<T = void>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}
