import type { ExpoRuntimeCapabilityHandler } from './expoRuntimeCapability';

export type ExpoRouterRouteParams = Readonly<Record<string, string | readonly string[]>>;

export interface ExpoRouterRouteSnapshot {
  readonly pathname: string;
  readonly params: ExpoRouterRouteParams;
  readonly canGoBack: boolean;
}

export interface ExpoRouterNavigationTarget {
  readonly pathname: string;
  readonly params: ExpoRouterRouteParams;
}

/** The generated app adapts its one Expo Router instance to this narrow host port. */
export interface ExpoRouterHostPort {
  readonly getRouteSnapshot: () => ExpoRouterRouteSnapshot;
  readonly subscribe: (listener: () => void) => () => void;
  readonly navigate: (target: ExpoRouterNavigationTarget) => void;
  readonly back: () => void;
}

export interface ExpoRouterRouteBridge {
  readonly getSnapshot: () => ExpoRouterRouteSnapshot;
  readonly subscribe: (listener: () => void) => () => void;
  readonly navigate: (input: unknown) => void;
  readonly back: () => void;
  readonly capabilityHandlers: readonly ExpoRuntimeCapabilityHandler[];
}
