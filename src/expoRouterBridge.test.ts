import { describe, expect, test } from 'bun:test';

import { createExpoRouterRouteBridge } from './expoRouterBridge';

describe('createExpoRouterRouteBridge', () => {
  test('observes one host router subscription and cleans it up after the final listener', () => {
    const fixture = createHostFixture();
    const bridge = createExpoRouterRouteBridge(fixture.host);
    const first = () => undefined;
    const second = () => undefined;
    const stopFirst = bridge.subscribe(first);
    const stopSecond = bridge.subscribe(second);

    expect(fixture.subscribeCount).toBe(1);
    stopFirst();
    expect(fixture.unsubscribeCount).toBe(0);
    stopSecond();
    expect(fixture.unsubscribeCount).toBe(1);
  });

  test('reads current route state from the host without retaining a duplicate route store', () => {
    const fixture = createHostFixture();
    const bridge = createExpoRouterRouteBridge(fixture.host);

    expect(bridge.getSnapshot()).toEqual({
      canGoBack: true,
      params: { id: '42', tag: ['one', 'two'] },
      pathname: '/projects/42',
    });
  });

  test('executes Navigator navigation and canonical back against the same host router', () => {
    const fixture = createHostFixture();
    const bridge = createExpoRouterRouteBridge(fixture.host);
    const [navigate] = bridge.capabilityHandlers;
    if (!navigate) throw new Error('Missing navigator handler.');

    void navigate.execute({
      capability: { id: 'navigator.navigate' } as never,
      input: { route: '/projects/[id]', params: { id: '7' } },
    });
    bridge.back();

    expect(fixture.navigations).toEqual([{ pathname: '/projects/[id]', params: { id: '7' } }]);
    expect(fixture.backCount).toBe(1);
  });

  test('rejects non-serializable action params before navigation', () => {
    const fixture = createHostFixture();
    const bridge = createExpoRouterRouteBridge(fixture.host);

    expect(() => bridge.navigate({ route: '/projects', params: { id: 7 } })).toThrow(
      "Expo Router param 'id' must be a string or string array.",
    );
    expect(fixture.navigations).toEqual([]);
  });
});

function createHostFixture() {
  let subscribeCount = 0;
  let unsubscribeCount = 0;
  let backCount = 0;
  const navigations: unknown[] = [];
  return {
    get backCount() {
      return backCount;
    },
    get navigations() {
      return navigations;
    },
    get subscribeCount() {
      return subscribeCount;
    },
    get unsubscribeCount() {
      return unsubscribeCount;
    },
    host: {
      back: () => {
        backCount += 1;
      },
      getRouteSnapshot: () => ({
        canGoBack: true,
        params: { id: '42', tag: ['one', 'two'] },
        pathname: '/projects/42',
      }),
      navigate: (target: unknown) => navigations.push(target),
      subscribe: () => {
        subscribeCount += 1;
        return () => {
          unsubscribeCount += 1;
        };
      },
    },
  };
}
