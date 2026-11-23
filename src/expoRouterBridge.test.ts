import { describe, expect, test } from 'bun:test';

import {
  createExpoRouterRouteBridge,
  type ExpoRouterHostPort,
  type ExpoRouterNavigationTarget,
  type ExpoRouterRouteSnapshot,
} from './expoRouterBridge';

describe('createExpoRouterRouteBridge snapshots', () => {
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

  test('does not expose mutable snapshot or parameter state', () => {
    const fixture = createHostFixture();
    const bridge = createExpoRouterRouteBridge(fixture.host);
    const snapshot = bridge.getSnapshot();

    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.params)).toBe(true);
    expect(Object.isFrozen(snapshot.params.tag)).toBe(true);
  });
});

describe('createExpoRouterRouteBridge subscriptions', () => {
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
});

describe('createExpoRouterRouteBridge host integration', () => {
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
  const state = createHostFixtureState();
  const host: ExpoRouterHostPort = {
    back: () => {
      state.incrementBack();
      state.setRoute({ canGoBack: false, params: {}, pathname: '/' });
    },
    getRouteSnapshot: state.getRouteSnapshot,
    navigate: (target) => {
      state.addNavigation(target);
      state.setRoute({ canGoBack: true, params: target.params, pathname: target.pathname });
    },
    subscribe: state.subscribe,
  };
  return {
    get backCount() {
      return state.getBackCount();
    },
    get navigations() {
      return state.getNavigations();
    },
    get subscribeCount() {
      return state.getSubscribeCount();
    },
    get unsubscribeCount() {
      return state.getUnsubscribeCount();
    },
    host,
    setRoute: state.setRoute,
  };
}

function createHostFixtureState() {
  let subscribeCount = 0;
  let unsubscribeCount = 0;
  let backCount = 0;
  let route: ExpoRouterRouteSnapshot = {
    canGoBack: true,
    params: { id: '42', tag: ['one', 'two'] },
    pathname: '/projects/42',
  };
  const navigations: ExpoRouterNavigationTarget[] = [];
  const listeners = new Set<() => void>();
  const setRoute = (nextRoute: ExpoRouterRouteSnapshot) => {
    route = nextRoute;
    listeners.forEach((listener) => listener());
  };
  return {
    addNavigation: (target: ExpoRouterNavigationTarget) => navigations.push(target),
    getBackCount: () => backCount,
    getNavigations: () => navigations,
    getRouteSnapshot: () => ({ ...route, params: { ...route.params } }),
    getSubscribeCount: () => subscribeCount,
    getUnsubscribeCount: () => unsubscribeCount,
    incrementBack: () => {
      backCount += 1;
    },
    setRoute,
    subscribe: (listener: () => void) => {
      subscribeCount += 1;
      listeners.add(listener);
      return () => {
        unsubscribeCount += 1;
        listeners.delete(listener);
      };
    },
  };
}
