export interface ExpoRuntimeRouteResolution {
  readonly resolvedPath: string;
  readonly unusedParams: Record<string, number | string>;
}
