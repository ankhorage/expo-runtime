import { isCapability } from '@ankhorage/capability';
import type { Capability } from '@ankhorage/contracts/capability';

import type {
  ExecuteExpoRuntimeCapabilityArgs,
  ExpoRuntimeCapabilityDiagnostic,
  ExpoRuntimeCapabilityExecutionResult,
  ExpoRuntimeCapabilityHandler,
  ExpoRuntimeCapabilityHandlerArgs,
} from '../../types/expoRuntimeCapability';

/*** Execute an Expo-owned capability or delegate another canonical capability to its runtime handler. */
export async function executeExpoRuntimeCapabilityAsync(
  args: ExecuteExpoRuntimeCapabilityArgs,
): Promise<ExpoRuntimeCapabilityExecutionResult> {
  const { capability, input, capabilityHandlers, alertImpl } = args;
  if (!isCapability(capability)) {
    return rejectCapabilityExecution({
      code: 'invalid-capability-descriptor',
      message: 'The capability descriptor is invalid.',
    });
  }

  if (capability.id === 'expo.alert') {
    return executeExpoAlert(input, alertImpl);
  }

  const handler = findCapabilityHandler(capabilityHandlers, capability.id);
  if (!handler) {
    return rejectCapabilityExecution({
      code: 'missing-capability-handler',
      message: `No Expo Runtime capability handler is configured for '${capability.id}'.`,
    });
  }
  return executeForeignCapabilityHandlerAsync(handler, capability, input);
}

/*** Execute a foreign capability handler and translate its failure into the bridge result contract. */
async function executeForeignCapabilityHandlerAsync(
  handler: (args: ExpoRuntimeCapabilityHandlerArgs) => Promise<void> | void,
  capability: Capability,
  input: unknown,
): Promise<ExpoRuntimeCapabilityExecutionResult> {
  try {
    await handler({ capability, input });
    return { ok: true };
  } catch (error) {
    return rejectCapabilityExecution({
      code: 'capability-handler-failed',
      message: `The handler for '${capability.id}' failed: ${getFailureMessage(error)}`,
    });
  }
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
): ExpoRuntimeCapabilityExecutionResult {
  if (!isExpoAlertInput(input)) {
    return rejectCapabilityExecution({
      code: 'invalid-expo-alert-input',
      message: "The 'expo.alert' capability requires an input object with only a string 'message'.",
    });
  }
  if (!alertImpl) {
    return rejectCapabilityExecution({
      code: 'missing-expo-alert-handler',
      message: "No Expo alert host callback is configured for 'expo.alert'.",
    });
  }
  alertImpl(input.message);
  return { ok: true };
}

/*** Validate the serializable input accepted by the Expo alert capability. */
function isExpoAlertInput(input: unknown): input is { readonly message: string } {
  if (
    typeof input !== 'object' ||
    input === null ||
    Array.isArray(input) ||
    !('message' in input)
  ) {
    return false;
  }
  const entries = Object.entries(input);
  return entries.length === 1 && typeof input.message === 'string';
}

/*** Report a rejected capability invocation with a diagnostic that a runtime owner can surface. */
function rejectCapabilityExecution(
  diagnostic: ExpoRuntimeCapabilityDiagnostic,
): ExpoRuntimeCapabilityExecutionResult {
  return { ok: false, diagnostics: [diagnostic] };
}

/*** Convert any foreign handler failure into a diagnostic-safe message. */
function getFailureMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
