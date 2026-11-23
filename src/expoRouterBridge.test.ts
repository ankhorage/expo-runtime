import { describe, expect, test } from 'bun:test';

import { createExpoRouterRouteBridge, type ExpoRouterRouteSnapshot } from './expoRouterBridge';

describe('createExpoRouterRouteBridge', () => {
  test('returns the same snapshot reference while the host route state is unchanged', () => {
    const fixture = createHostFixture();
    const bridge = createExpoRouterRouteBridge(fixture.host);

    const firstSnapshot = bridge.getSnapshot();
    const secondSnapshot = bridge.getSnapshot();

    expect(secondSnapshot).toBe(firstSnapshot);
  });

  test('updates the cached snapshot after a host route change', () => {
    const fixture = createHostFixture();
    const bridge = createExpoRouterRouteBridge(fixture.host);
    const notifications: unknown[] = [];
    const stop = bridge.subscribe(() => notifications.push(bridge.getSnapshot()));
    const firstSnapshot = bridge.getSnapshot();

    fixture.setRoute({ canGoBack: true, params: { id: '7' }, pathname: '/projects/7' });

    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toEqual({
      canGoBack: true,
      params: { id: '7' },
      pathname: '/projects/7',
    });
    expect(notifications[0]).not.toBe(firstSnapshot);
    expect(bridge.getSnapshot()).toBe(notifications[0]);
    stop();
  });

  test('observes one host router subscription and cleans it up after the final listener', () => {
    const fixture = createHostFixture();
    const bridge = createExpoRouterRouteBridge(fixture.host);
    const firstCalls: unknown[] = [];
    const first = () => firstCalls.push(bridge.getSnapshot());
    const second = () => undefined;
    const stopFirst = bridge.subscribe(first);
    const stopSecond = bridge.subscribe(second);

    expect(fixture.subscribeCount).toBe(1);
    stopFirst();
    expect(fixture.unsubscribeCount).toBe(0);
    stopSecond();
    expect(fixture.unsubscribeCount).toBe(1);
    fixture.setRoute({ canGoBack: false, params: {}, pathname: '/' });
    expect(firstCalls).toEqual([]);
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

  test('reflects navigation and back updates from the same host router', () => {
    const fixture = createHostFixture();
    const bridge = createExpoRouterRouteBridge(fixture.host);
    const [navigate] = bridge.capabilityHandlers;
    if (!navigate) throw new Error('Missing navigator handler.');
    const snapshots: unknown[] = [];
    const stop = bridge.subscribe(() => snapshots.push(bridge.getSnapshot()));

    void navigate.execute({
      capability: { id: 'navigator.navigate' } as never,
      input: { route: '/projects/[id]', params: { id: '7' } },
    });
    bridge.back();

    expect(fixture.navigations).toEqual([{ pathname: '/projects/[id]', params: { id: '7' } }]);
    expect(fixture.backCount).toBe(1);
    expect(snapshots).toEqual([
      { canGoBack: true, params: { id: '7' }, pathname: '/projects/[id]' },
      { canGoBack: false, params: {}, pathname: '/' },
    ]);
    stop();
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
  let route: ExpoRouterRouteSnapshot = {
    canGoBack: true,
    params: { id: '42', tag: ['one', 'two'] },
    pathname: '/projects/42',
  };
  const navigations: unknown[] = [];
  const listeners = new Set<() => void>();
  const setRoute = (nextRoute: ExpoRouterRouteSnapshot) => {
    route = nextRoute;
    listeners.forEach((listener) => listener());
  };
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
    setRoute,
    host: {
      back: () => {
        backCount += 1;
        setRoute({ canGoBack: false, params: {}, pathname: '/' });
      },
      getRouteSnapshot: () => ({ ...route, params: { ...route.params } }),
      navigate: (target) => {
        navigations.push(target);
        setRoute({ canGoBack: true, params: target.params, pathname: target.pathname });
      },
      subscribe: (listener) => {
        subscribeCount += 1;
        listeners.add(listener);
        return () => {
          unsubscribeCount += 1;
          listeners.delete(listener);
        };
      },
    },
  };
}
