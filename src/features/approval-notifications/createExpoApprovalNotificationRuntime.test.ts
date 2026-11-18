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

describe('createExpoApprovalNotificationRuntime startup lifecycle', () => {
  afterEach(() => {
    mock.restore();
  });

  test('does not attach native listeners when disposal wins an asynchronous startup race', async () => {
    const calls: string[] = [];
    const initialUrl = createDeferred<string | null>();
    void mock.module('expo-linking', () => ({
      addEventListener: () => ({ remove: () => calls.push('remove-linking') }),
      getInitialURL: () => initialUrl.promise,
    }));
    void mock.module('expo-notifications', () => ({
      addNotificationResponseReceivedListener: () => ({
        remove: () => calls.push('remove-notification'),
      }),
      clearLastNotificationResponse: () => calls.push('clear-response'),
      getLastNotificationResponse: () => null,
      requestPermissionsAsync: () => Promise.resolve({ granted: false }),
    }));

    const { createExpoApprovalNotificationRuntime } =
      await import('./createExpoApprovalNotificationRuntime');
    const runtime = createExpoApprovalNotificationRuntime({
      navigateAsync: () => calls.push('navigate'),
      onUnavailableAsync: () => calls.push('unavailable'),
      resolveAvailabilityAsync: () => Promise.resolve('available'),
    });

    const start = runtime.startAsync();
    runtime.dispose();
    initialUrl.resolve(null);
    await start;

    expect(calls).toEqual([]);
  });
});

describe('createExpoApprovalNotificationRuntime restarted startup lifecycle', () => {
  afterEach(() => {
    mock.restore();
  });

  test('keeps a restarted runtime current when an earlier startup rejects', async () => {
    const calls: string[] = [];
    const firstInitialUrl = createDeferred<string | null>();
    const secondInitialUrl = createDeferred<string | null>();
    const notify = configureRestartableStartupModules(calls, firstInitialUrl, secondInitialUrl);

    const { createExpoApprovalNotificationRuntime } =
      await import('./createExpoApprovalNotificationRuntime');
    const runtime = createExpoApprovalNotificationRuntime({
      navigateAsync: () => calls.push('navigate'),
      onUnavailableAsync: () => calls.push('unavailable'),
      resolveAvailabilityAsync: () => Promise.resolve('available'),
    });

    const firstStart = runtime.startAsync();
    const firstStartError = firstStart.then(
      () => 'resolved',
      (error: unknown) => (error instanceof Error ? error.message : String(error)),
    );
    runtime.dispose();
    const secondStart = runtime.startAsync();
    secondInitialUrl.resolve(null);
    await secondStart;
    firstInitialUrl.reject(new Error('first startup failed'));
    expect(await firstStartError).toBe('first startup failed');
    notify();
    await Promise.resolve();
    await Promise.resolve();

    expect(calls).toEqual(['navigate']);
    runtime.dispose();
  });
});

describe('createExpoApprovalNotificationRuntime event lifecycle', () => {
  afterEach(() => {
    mock.restore();
  });

  test('does not navigate when disposal wins a pending notification availability lookup', async () => {
    const calls: string[] = [];
    const availability = createDeferred<'available'>();
    const notify = configureEventModules(calls);
    const { createExpoApprovalNotificationRuntime } =
      await import('./createExpoApprovalNotificationRuntime');
    const runtime = createExpoApprovalNotificationRuntime({
      navigateAsync: () => calls.push('navigate'),
      onUnavailableAsync: () => calls.push('unavailable'),
      resolveAvailabilityAsync: () => availability.promise,
    });

    await runtime.startAsync();
    notify();
    await Promise.resolve();
    runtime.dispose();
    availability.resolve('available');
    await Promise.resolve();
    await Promise.resolve();

    expect(calls).toEqual(['remove-notification', 'remove-linking']);
  });

  test('ignores a duplicate notification tap while the first lookup is pending', async () => {
    const calls: string[] = [];
    const availability = createDeferred<'available'>();
    const notify = configureEventModules(calls);
    const { createExpoApprovalNotificationRuntime } =
      await import('./createExpoApprovalNotificationRuntime');
    const runtime = createExpoApprovalNotificationRuntime({
      navigateAsync: () => calls.push('navigate'),
      onUnavailableAsync: () => calls.push('unavailable'),
      resolveAvailabilityAsync: () => availability.promise,
    });

    await runtime.startAsync();
    notify();
    notify();
    availability.resolve('available');
    await Promise.resolve();
    await Promise.resolve();

    expect(calls).toEqual(['navigate']);
    runtime.dispose();
  });
});

describe('createExpoApprovalNotificationRuntime distinct approval events', () => {
  afterEach(() => {
    mock.restore();
  });

  test('handles distinct approval notifications while another approval lookup is pending', async () => {
    const calls: string[] = [];
    const firstAvailability = createDeferred<'available'>();
    const secondAvailability = createDeferred<'available'>();
    const notify = configureEventModules(calls);
    const { createExpoApprovalNotificationRuntime } =
      await import('./createExpoApprovalNotificationRuntime');
    const runtime = createExpoApprovalNotificationRuntime({
      navigateAsync: (route) => calls.push(`navigate:${route.approvalId}`),
      onUnavailableAsync: () => calls.push('unavailable'),
      resolveAvailabilityAsync: (route) =>
        route.approvalId === 'approval-7' ? firstAvailability.promise : secondAvailability.promise,
    });

    await runtime.startAsync();
    notify();
    notify('approval-8');
    firstAvailability.resolve('available');
    secondAvailability.resolve('available');
    await Promise.resolve();
    await Promise.resolve();

    expect(calls).toEqual(['navigate:approval-7', 'navigate:approval-8']);
    runtime.dispose();
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

function configureEventModules(calls: string[]): (approvalId?: string) => void {
  let onNotificationResponse:
    ((response: ReturnType<typeof createNotificationResponse>) => void) | undefined;
  void mock.module('expo-linking', () => ({
    addEventListener: () => ({ remove: () => calls.push('remove-linking') }),
    getInitialURL: () => Promise.resolve(null),
  }));
  void mock.module('expo-notifications', () => ({
    addNotificationResponseReceivedListener: (
      listener: (response: ReturnType<typeof createNotificationResponse>) => void,
    ) => {
      onNotificationResponse = listener;
      return { remove: () => calls.push('remove-notification') };
    },
    clearLastNotificationResponse: () => calls.push('clear-response'),
    getLastNotificationResponse: () => null,
    requestPermissionsAsync: () => Promise.resolve({ granted: false }),
  }));
  return (approvalId = 'approval-7') => {
    onNotificationResponse?.(createNotificationResponse(approvalId));
  };
}

function configureRestartableStartupModules(
  calls: string[],
  firstInitialUrl: ReturnType<typeof createDeferred<string | null>>,
  secondInitialUrl: ReturnType<typeof createDeferred<string | null>>,
): () => void {
  let initialUrlCalls = 0;
  let onNotificationResponse:
    ((response: ReturnType<typeof createNotificationResponse>) => void) | undefined;
  void mock.module('expo-linking', () => ({
    addEventListener: () => ({ remove: () => calls.push('remove-linking') }),
    getInitialURL: () => {
      initialUrlCalls += 1;
      return initialUrlCalls === 1 ? firstInitialUrl.promise : secondInitialUrl.promise;
    },
  }));
  void mock.module('expo-notifications', () => ({
    addNotificationResponseReceivedListener: (
      listener: (response: ReturnType<typeof createNotificationResponse>) => void,
    ) => {
      onNotificationResponse = listener;
      return { remove: () => calls.push('remove-notification') };
    },
    clearLastNotificationResponse: () => calls.push('clear-response'),
    getLastNotificationResponse: () => null,
    requestPermissionsAsync: () => Promise.resolve({ granted: false }),
  }));
  return () => {
    onNotificationResponse?.(createNotificationResponse());
  };
}

function createNotificationResponse(approvalId = 'approval-7') {
  return {
    notification: {
      request: {
        content: {
          data: {
            approvalId,
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

function createDeferred<T>(): {
  promise: Promise<T>;
  reject: (reason?: unknown) => void;
  resolve: (value: T) => void;
} {
  let reject: (reason?: unknown) => void = () => undefined;
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    reject = rejectPromise;
    resolve = resolvePromise;
  });
  return { promise, reject, resolve };
}
