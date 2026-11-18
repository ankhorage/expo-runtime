import { describe, expect, test } from 'bun:test';

import { handleFlowApprovalRouteAsync } from './handleFlowApprovalRouteAsync';

const ROUTE = {
  approvalId: 'approval-7',
  flow: { id: 'flow-2', version: 3 },
  runId: 'run-5',
} as const;

describe('handleFlowApprovalRouteAsync', () => {
  test('navigates only when the host confirms the current approval is available', async () => {
    const calls: string[] = [];

    await handleFlowApprovalRouteAsync(ROUTE, {
      navigateAsync: () => calls.push('navigate'),
      onUnavailableAsync: () => calls.push('unavailable'),
      resolveAvailabilityAsync: () => Promise.resolve('available'),
    });

    expect(calls).toEqual(['navigate']);
  });
});

describe('handleFlowApprovalRouteAsync unavailable approvals', () => {
  test.each(['expired', 'revoked', 'missing-provider'] as const)(
    'delegates %s approvals to the host without navigating',
    async (availability) => {
      const unavailable: string[] = [];

      await handleFlowApprovalRouteAsync(ROUTE, {
        navigateAsync: () => {
          throw new Error('must not navigate');
        },
        onUnavailableAsync: (_, state) => unavailable.push(state),
        resolveAvailabilityAsync: () => Promise.resolve(availability),
      });

      expect(unavailable).toEqual([availability]);
    },
  );

  test('fails closed when a runtime host omits the availability resolver', async () => {
    const unavailable: string[] = [];
    const options = {
      navigateAsync: () => {
        throw new Error('must not navigate');
      },
      onUnavailableAsync: (_: typeof ROUTE, state: string) => unavailable.push(state),
      resolveAvailabilityAsync: () => Promise.resolve('available' as const),
    };
    Reflect.deleteProperty(options, 'resolveAvailabilityAsync');

    await handleFlowApprovalRouteAsync(ROUTE, options);

    expect(unavailable).toEqual(['offline']);
  });

  test('maps a failed availability lookup to the explicit offline path', async () => {
    const unavailable: string[] = [];

    await handleFlowApprovalRouteAsync(ROUTE, {
      navigateAsync: () => {
        throw new Error('must not navigate');
      },
      onUnavailableAsync: (_, state) => unavailable.push(state),
      resolveAvailabilityAsync: () => Promise.reject(new Error('offline')),
    });

    expect(unavailable).toEqual(['offline']);
  });
});

describe('handleFlowApprovalRouteAsync lifecycle', () => {
  test('does not invoke host effects after its lifecycle becomes stale during lookup', async () => {
    const calls: string[] = [];
    const availability = createDeferred<'available'>();
    let current = true;

    const handling = handleFlowApprovalRouteAsync(
      ROUTE,
      {
        navigateAsync: () => calls.push('navigate'),
        onUnavailableAsync: () => calls.push('unavailable'),
        resolveAvailabilityAsync: () => availability.promise,
      },
      () => current,
    );
    current = false;
    availability.resolve('available');
    await handling;

    expect(calls).toEqual([]);
  });
});

function createDeferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}
