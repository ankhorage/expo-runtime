import { afterEach, describe, expect, mock, test } from 'bun:test';

describe('createExpoApprovalNotificationRuntime', () => {
  afterEach(() => {
    mock.restore();
  });

  test('resumes the last approval notification after restart and clears only that consumed response', async () => {
    const calls: string[] = [];
    configureExpoModules(calls);

    const { createExpoApprovalNotificationRuntime } =
      await import('./createExpoApprovalNotificationRuntime');
    const runtime = createExpoApprovalNotificationRuntime({
      navigateAsync: (route) =>
        calls.push(`navigate:${route.flow.id}:${route.flow.version}:${route.runId}`),
      onUnavailableAsync: (_, availability) => calls.push(`unavailable:${availability}`),
      resolveAvailabilityAsync: () => Promise.resolve('available'),
    });

    await runtime.startAsync();

    expect(calls).toEqual(['navigate:flow-2:3:run-5', 'clear-response']);
    expect(await runtime.requestPermissionAsync()).toBe('denied');
    runtime.dispose();
    expect(calls).toEqual([
      'navigate:flow-2:3:run-5',
      'clear-response',
      'remove-notification',
      'remove-linking',
    ]);
  });
});

function configureExpoModules(calls: string[]): void {
  void mock.module('expo-linking', () => ({
    addEventListener: () => ({ remove: () => calls.push('remove-linking') }),
    getInitialURL: () => Promise.resolve(null),
  }));
  void mock.module('expo-notifications', () => ({
    addNotificationResponseReceivedListener: () => ({
      remove: () => calls.push('remove-notification'),
    }),
    clearLastNotificationResponse: () => calls.push('clear-response'),
    getLastNotificationResponse: () => createNotificationResponse(),
    requestPermissionsAsync: () => Promise.resolve({ granted: false }),
  }));
}

function createNotificationResponse() {
  return {
    notification: {
      request: {
        content: {
          data: {
            approvalId: 'approval-7',
            flowId: 'flow-2',
            flowVersion: 3,
            kind: 'ankhorage.flow.approval',
            runId: 'run-5',
          },
        },
      },
    },
  };
}
