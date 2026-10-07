import { type Capability, isCapability } from '@ankhorage/contracts/capabilities';

export interface ExpoRuntimeCapabilityHandlerArgs {
  readonly capability: Capability;
  readonly input: unknown;
}

export interface ExpoRuntimeCapabilityHandler {
  readonly capabilityId: Capability['id'];
  readonly execute: (args: ExpoRuntimeCapabilityHandlerArgs) => Promise<void> | void;
}

export interface ExecuteExpoRuntimeCapabilityArgs {
  readonly capability: unknown;
  readonly input?: unknown;
  readonly capabilityHandlers?: readonly ExpoRuntimeCapabilityHandler[];
  readonly alertImpl?: (message: string) => void;
}

export interface ExpoRuntimeRouteResolution {
  readonly resolvedPath: string;
  readonly unusedParams: Record<string, number | string>;
}

/*** Resolve Expo Router path parameters before passing the remaining values to the router. */
export function resolveExpoRuntimeRoutePath(
  pathname: string,
  params?: Record<string, number | string>,
): ExpoRuntimeRouteResolution {
  if (!params) return { resolvedPath: pathname, unusedParams: {} };

  const state = Object.entries(params).reduce(
    (current, [key, value]) => {
      return resolveRouteParameter(current, key, value);
    },
    { resolvedPath: pathname, unusedParams: { ...params } },
  );
  return state;
}

/*** Execute an Expo-owned capability or delegate another canonical capability to its runtime handler. */
export async function executeExpoRuntimeCapability(
  args: ExecuteExpoRuntimeCapabilityArgs,
): Promise<void> {
  const { capability, input, capabilityHandlers, alertImpl } = args;
  if (!isCapability(capability)) return;

  if (capability.id === 'expo.alert') {
    executeExpoAlert(input, alertImpl);
    return;
  }

  await findCapabilityHandler(capabilityHandlers, capability.id)?.({ capability, input });
}

/*** Find the configured executor for one canonical capability without dynamic record access. */
function findCapabilityHandler(
  capabilityHandlers: readonly ExpoRuntimeCapabilityHandler[] | undefined,
  capabilityId: Capability['id'],
): ((args: ExpoRuntimeCapabilityHandlerArgs) => Promise<void> | void) | undefined {
  return capabilityHandlers?.find((handler) => handler.capabilityId === capabilityId)?.execute;
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

/*** Display a valid Expo-owned alert invocation without exposing alert as a generic action. */
function executeExpoAlert(
  input: unknown,
  alertImpl: ((message: string) => void) | undefined,
): void {
  if (!isExpoAlertInput(input)) return;
  alertImpl?.(input.message);
}

/*** Validate the serializable input accepted by the Expo alert capability. */
function isExpoAlertInput(input: unknown): input is { readonly message: string } {
  return (
    typeof input === 'object' &&
    input !== null &&
    'message' in input &&
    typeof input.message === 'string'
  );
}
