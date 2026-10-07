import { type Capability, isCapability } from '@ankhorage/contracts/capabilities';

import type {
  ExecuteExpoRuntimeCapabilityArgs,
  ExpoRuntimeCapabilityHandler,
  ExpoRuntimeCapabilityHandlerArgs,
} from '../../types/expoRuntimeCapability';

/*** Execute an Expo-owned capability or delegate another canonical capability to its runtime handler. */
export async function executeExpoRuntimeCapabilityAsync(
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
