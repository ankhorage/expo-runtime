import type { Action } from '@ankhorage/contracts';

export type ExpoRuntimeThemeMode = 'dark' | 'light';

export interface ExpoRuntimeRouterLike {
  push: (args: { pathname: string; params: Record<string, number | string> }) => void;
}

export interface ExpoRuntimeActionHandlerArgs {
  action: Action;
}

export type ExpoRuntimeActionHandlers = Record<
  string,
  (args: ExpoRuntimeActionHandlerArgs) => Promise<void> | void
>;

export interface ExecuteExpoRuntimeActionArgs {
  action: unknown;
  router: ExpoRuntimeRouterLike;
  mode: ExpoRuntimeThemeMode;
  setMode: (mode: ExpoRuntimeThemeMode) => void;
  actionHandlers?: ExpoRuntimeActionHandlers;
  requestAnimationFrameImpl?: (callback: () => void) => number | void;
  alertImpl?: (message: string) => void;
  consoleImpl?: Pick<typeof console, 'log'>;
}

export interface ExpoRuntimeRouteResolution {
  resolvedPath: string;
  unusedParams: Record<string, number | string>;
}

export function resolveExpoRuntimeRoutePath(
  pathname: string,
  params?: Record<string, number | string>,
): ExpoRuntimeRouteResolution {
  if (!params) {
    return { resolvedPath: pathname, unusedParams: {} };
  }

  let resolvedPath = pathname;
  const unusedParams: Record<string, number | string> = { ...params };

  Object.keys(params).forEach((key) => {
    const placeholder = `[${key}]`;
    if (!resolvedPath.includes(placeholder)) {
      return;
    }

    resolvedPath = resolvedPath.replace(placeholder, String(params[key]));
    delete unusedParams[key];
  });

  return { resolvedPath, unusedParams };
}

function isAction(value: unknown): value is Action {
  return typeof value === 'object' && value !== null && 'type' in value;
}

function isActionCallback(value: unknown): value is () => void {
  return typeof value === 'function';
}

export async function executeExpoRuntimeAction(args: ExecuteExpoRuntimeActionArgs): Promise<void> {
  const {
    action,
    router,
    mode,
    setMode,
    actionHandlers,
    requestAnimationFrameImpl = (callback) => {
      callback();
    },
    alertImpl,
    consoleImpl = console,
  } = args;

  if (!action) {
    return;
  }

  if (isActionCallback(action)) {
    action();
    return;
  }

  if (!isAction(action)) {
    return;
  }

  if (action.type === 'navigate' && action.payload.route) {
    const { route, params } = action.payload;
    requestAnimationFrameImpl(() => {
      let pathname = route;
      if (!pathname.startsWith('/') && !pathname.startsWith('(')) {
        pathname = `/${pathname}`;
      }

      const { resolvedPath, unusedParams } = resolveExpoRuntimeRoutePath(pathname, params);
      router.push({
        pathname: resolvedPath,
        params: unusedParams,
      });
    });
    return;
  }

  if (action.type === 'toggleDarkMode') {
    setMode(mode === 'dark' ? 'light' : 'dark');
    return;
  }

  if (action.type === 'search') {
    consoleImpl.log('[Ankh Action] Search:', action.payload);
    return;
  }

  if (action.type === 'filter') {
    consoleImpl.log('[Ankh Action] Filter:', action.payload);
    return;
  }

  if (action.type === 'alert') {
    const message = action.payload?.message ?? JSON.stringify(action.payload);
    alertImpl?.(message);
    return;
  }

  if (action.type === 'console') {
    consoleImpl.log('[Ankh Action]', action.payload);
    return;
  }

  const configuredHandler = actionHandlers?.[action.type];
  if (configuredHandler) {
    await configuredHandler({ action });
  }
}
