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
