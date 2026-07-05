import { describe, expect, test } from 'bun:test';

import { executeExpoRuntimeAction, resolveExpoRuntimeRoutePath } from './expoActionBridge';

describe('expoActionBridge', () => {
  test('resolves dynamic route params and keeps unused params', () => {
    expect(resolveExpoRuntimeRoutePath('/users/[id]', { id: 42, tab: 'profile' })).toEqual({
      resolvedPath: '/users/42',
      unusedParams: { tab: 'profile' },
    });
  });

  test('executes navigation actions', async () => {
    const pushes: { pathname: string; params: Record<string, number | string> }[] = [];

    await executeExpoRuntimeAction({
      action: { type: 'navigate', payload: { route: 'users/[id]', params: { id: 42 } } },
      router: { push: (args) => pushes.push(args) },
      mode: 'dark',
      setMode: () => undefined,
    });

    expect(pushes).toEqual([{ pathname: '/users/42', params: {} }]);
  });

  test('toggles dark mode', async () => {
    const modes: string[] = [];

    await executeExpoRuntimeAction({
      action: { type: 'toggleDarkMode' },
      router: { push: () => undefined },
      mode: 'dark',
      setMode: (mode) => modes.push(mode),
    });

    expect(modes).toEqual(['light']);
  });

  test('delegates configured actions', async () => {
    const calls: string[] = [];

    await executeExpoRuntimeAction({
      action: { type: 'setLanguage', payload: { locale: 'de' } },
      router: { push: () => undefined },
      mode: 'dark',
      setMode: () => undefined,
      actionHandlers: {
        setLanguage: ({ action }) => calls.push(action.type),
      },
    });

    expect(calls).toEqual(['setLanguage']);
  });
});
