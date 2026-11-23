import type {
  ExpoRouterHostPort,
  ExpoRouterNavigationTarget,
  ExpoRouterRouteBridge,
  ExpoRouterRouteParams,
  ExpoRouterRouteSnapshot,
} from '../../types/expoRouterBridge';
import type { ExpoRuntimeCapabilityHandler } from '../../types/expoRuntimeCapability';

/*** Adapt the generated app's single Expo Router instance as a reactive route and navigation host. */
export function createExpoRouterRouteBridge(host: ExpoRouterHostPort): ExpoRouterRouteBridge {
  const listeners = new Set<() => void>();
  let unsubscribe: (() => void) | undefined;
  let cachedSnapshot: ExpoRouterRouteSnapshot | undefined;
  const notify = () => listeners.forEach((listener) => listener());
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    unsubscribe ??= host.subscribe(notify);
    return () => {
      listeners.delete(listener);
      if (listeners.size !== 0 || !unsubscribe) return;
      unsubscribe();
      unsubscribe = undefined;
    };
  };
  const navigate = (input: unknown) => host.navigate(resolveNavigationTarget(input));
  const back = () => host.back();
  const getSnapshot = () => {
    const nextSnapshot = normalizeSnapshot(host.getRouteSnapshot());
    if (cachedSnapshot && hasSameRouteState(cachedSnapshot, nextSnapshot)) return cachedSnapshot;
    cachedSnapshot = nextSnapshot;
    return nextSnapshot;
  };

  return {
    back,
    capabilityHandlers: createCapabilityHandlers(navigate),
    getSnapshot,
    navigate,
    subscribe,
  };
}

/*** Keep Navigator's released navigate action at the generic capability bridge boundary. */
function createCapabilityHandlers(
  navigate: (input: unknown) => void,
): readonly ExpoRuntimeCapabilityHandler[] {
  return [
    {
      capabilityId: 'navigator.navigate',
      execute: ({ input }) => navigate(input),
    },
  ];
}

/*** Validate the portable navigation action before it reaches Expo Router's typed host boundary. */
function resolveNavigationTarget(input: unknown): ExpoRouterNavigationTarget {
  if (!isRecord(input) || typeof input.route !== 'string' || input.route.length === 0) {
    throw new Error("The 'navigator.navigate' capability requires a non-empty string 'route'.");
  }
  return { pathname: input.route, params: sanitizeParams(input.params) };
}

/*** Retain only Expo Router's serializable string search and path parameters. */
function normalizeSnapshot(snapshot: ExpoRouterRouteSnapshot): ExpoRouterRouteSnapshot {
  return {
    canGoBack: snapshot.canGoBack,
    params: sanitizeParams(snapshot.params),
    pathname: snapshot.pathname,
  };
}

/*** Reuse the external-store snapshot while the host router reports the same route state. */
function hasSameRouteState(
  previous: ExpoRouterRouteSnapshot,
  next: ExpoRouterRouteSnapshot,
): boolean {
  return (
    previous.canGoBack === next.canGoBack &&
    previous.pathname === next.pathname &&
    hasSameParams(previous.params, next.params)
  );
}

/*** Compare the serializable Expo Router parameter values without retaining host-owned objects. */
function hasSameParams(previous: ExpoRouterRouteParams, next: ExpoRouterRouteParams): boolean {
  const previousEntries = Object.entries(previous);
  const nextEntries = Object.entries(next);
  return (
    previousEntries.length === nextEntries.length &&
    previousEntries.every(([key, value]) => {
      const nextEntry = nextEntries.find(([nextKey]) => nextKey === key);
      return nextEntry !== undefined && hasSameParamValue(value, nextEntry[1]);
    })
  );
}

/*** Compare one documented Expo Router parameter value. */
function hasSameParamValue(
  previous: string | readonly string[],
  next: string | readonly string[] | undefined,
): boolean {
  if (typeof previous === 'string' || typeof next === 'string') return previous === next;
  return (
    Array.isArray(previous) &&
    Array.isArray(next) &&
    previous.length === next.length &&
    previous.every((value, index) => value === next.at(index))
  );
}

/*** Reject non-router values rather than leaking non-serializable values into Runtime bindings. */
function sanitizeParams(value: unknown): ExpoRouterRouteParams {
  if (value === undefined) return {};
  if (!isRecord(value)) throw new Error('Expo Router params must be a serializable object.');
  return Object.fromEntries(
    Object.entries(value).map(([key, parameter]) => [key, sanitizeParameter(key, parameter)]),
  );
}

/*** Accept the documented Expo Router parameter value shapes only. */
function sanitizeParameter(key: string, value: unknown): string | readonly string[] {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.every((entry) => typeof entry === 'string')) return [...value];
  throw new Error(`Expo Router param '${key}' must be a string or string array.`);
}

/*** Distinguish record-shaped action input from null and arrays. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
