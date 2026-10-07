import type { Capability } from '@ankhorage/contracts/capabilities';

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
