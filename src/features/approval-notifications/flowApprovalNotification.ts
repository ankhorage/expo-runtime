import type { FlowApprovalRoute } from './types';

const NOTIFICATION_KIND = 'ankhorage.flow.approval';

/** A minimal push payload that deliberately contains references only. */
export interface FlowApprovalNotificationData {
  readonly approvalId: string;
  readonly flowId: string;
  readonly flowVersion: number;
  readonly kind: typeof NOTIFICATION_KIND;
  readonly runId: string;
}

/*** Creates the token-free notification data understood by the Expo host boundary. */
export function createFlowApprovalNotificationData(
  route: FlowApprovalRoute,
): FlowApprovalNotificationData {
  return {
    approvalId: route.approvalId,
    flowId: route.flow.id,
    flowVersion: route.flow.version,
    kind: NOTIFICATION_KIND,
    runId: route.runId,
  };
}

/*** Accepts only a minimal approval reference from an untrusted notification payload. */
export function parseFlowApprovalNotificationData(value: unknown): FlowApprovalRoute | undefined {
  if (!isRecord(value) || value.kind !== NOTIFICATION_KIND) return undefined;
  if (!hasOnlyKeys(value, ['approvalId', 'flowId', 'flowVersion', 'kind', 'runId'])) {
    return undefined;
  }
  if (
    !isIdentifier(value.approvalId) ||
    !isIdentifier(value.flowId) ||
    !isPositiveVersion(value.flowVersion) ||
    !isIdentifier(value.runId)
  ) {
    return undefined;
  }

  return {
    approvalId: value.approvalId,
    flow: { id: value.flowId, version: value.flowVersion },
    runId: value.runId,
  };
}

/*** Narrows an untrusted payload to a serializable object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/*** Rejects metadata additions so notification payloads cannot quietly become a secret transport. */
function hasOnlyKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  return Object.keys(value).every((key) => expected.includes(key));
}

/*** Requires identifiers to be non-empty without imposing provider-specific syntax. */
function isIdentifier(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/*** Restricts immutable Flow revisions to positive safe integer versions. */
function isPositiveVersion(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}
