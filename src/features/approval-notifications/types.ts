import type { FlowDefinitionRef, FlowRunId } from '@ankhorage/contracts/flow';

/** A non-secret, version-pinned destination for a Flow approval. */
export interface FlowApprovalRoute {
  readonly approvalId: string;
  readonly flow: FlowDefinitionRef;
  readonly runId: FlowRunId;
}

/** The current server-authoritative availability of an approval destination. */
export type FlowApprovalAvailability =
  'available' | 'expired' | 'missing-provider' | 'offline' | 'revoked';

/** The result of an explicit notification-permission request. */
export type ExpoApprovalNotificationPermission = 'denied' | 'granted' | 'unsupported';

/** Host-owned navigation and availability boundaries for approval notifications. */
export interface ExpoApprovalNotificationRuntimeOptions {
  readonly navigateAsync: (route: FlowApprovalRoute) => Promise<void> | void;
  readonly onUnavailableAsync: (
    route: FlowApprovalRoute,
    availability: Exclude<FlowApprovalAvailability, 'available'>,
  ) => Promise<void> | void;
  readonly resolveAvailabilityAsync?: (
    route: FlowApprovalRoute,
  ) => Promise<FlowApprovalAvailability>;
}

/** Lifecycle controls for the native or web approval-notification boundary. */
export interface ExpoApprovalNotificationRuntime {
  readonly dispose: () => void;
  readonly requestPermissionAsync: () => Promise<ExpoApprovalNotificationPermission>;
  readonly startAsync: () => Promise<void>;
}
