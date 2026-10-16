import type { Capability } from '@ankhorage/contracts/capability';

export interface ExpoRuntimeCapabilityHandlerArgs {
  readonly capability: Capability;
  readonly input: unknown;
}

export interface ExpoRuntimeCapabilityHandler {
  readonly capabilityId: Capability['id'];
  readonly execute: (args: ExpoRuntimeCapabilityHandlerArgs) => Promise<void> | void;
}

export type ExpoRuntimeCapabilityDiagnosticCode =
  | 'invalid-capability-descriptor'
  | 'invalid-expo-alert-input'
  | 'missing-capability-handler'
  | 'missing-expo-alert-handler';

export interface ExpoRuntimeCapabilityDiagnostic {
  readonly code: ExpoRuntimeCapabilityDiagnosticCode;
  readonly message: string;
}

export type ExpoRuntimeCapabilityExecutionResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly diagnostics: readonly ExpoRuntimeCapabilityDiagnostic[];
    };

export interface ExecuteExpoRuntimeCapabilityArgs {
  readonly capability: unknown;
  readonly input?: unknown;
  readonly capabilityHandlers?: readonly ExpoRuntimeCapabilityHandler[];
  readonly alertImpl?: (message: string) => void;
}
