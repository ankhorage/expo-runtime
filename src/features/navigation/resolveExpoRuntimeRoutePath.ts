import type { ExpoRuntimeRouteResolution } from '../../types/expoRuntimeRoute';

/*** Resolve Expo Router path parameters before passing the remaining values to the router. */
export function resolveExpoRuntimeRoutePath(
  pathname: string,
  params?: Record<string, number | string>,
): ExpoRuntimeRouteResolution {
  if (!params) return { resolvedPath: pathname, unusedParams: {} };

  return Object.entries(params).reduce(
    (current, [key, value]) => resolveRouteParameter(current, key, value),
    { resolvedPath: pathname, unusedParams: { ...params } },
  );
}

/*** Replace one dynamic route placeholder and retain values that belong in the navigation query. */
function resolveRouteParameter(
  state: ExpoRuntimeRouteResolution,
  key: string,
  value: number | string,
): ExpoRuntimeRouteResolution {
  const placeholder = `[${key}]`;
  if (!state.resolvedPath.includes(placeholder)) return state;

  return {
    resolvedPath: state.resolvedPath.replace(placeholder, String(value)),
    unusedParams: Object.fromEntries(
      Object.entries(state.unusedParams).filter(([parameter]) => parameter !== key),
    ),
  };
}
