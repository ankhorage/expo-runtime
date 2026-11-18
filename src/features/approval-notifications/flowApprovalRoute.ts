import type { FlowApprovalRoute } from './types';

const ROUTE_SEGMENTS = ['flows', 'versions', 'runs', 'approvals'] as const;

/*** Builds the canonical, token-free path used by native and web approval links. */
export function getFlowApprovalRoutePath(route: FlowApprovalRoute): string {
  return [
    ROUTE_SEGMENTS[0],
    encodeURIComponent(route.flow.id),
    ROUTE_SEGMENTS[1],
    String(route.flow.version),
    ROUTE_SEGMENTS[2],
    encodeURIComponent(route.runId),
    ROUTE_SEGMENTS[3],
    encodeURIComponent(route.approvalId),
  ].join('/');
}

/*** Parses only the canonical approval path, rejecting incomplete and non-versioned destinations. */
export function parseFlowApprovalRoutePath(path: string): FlowApprovalRoute | undefined {
  const segments = path.split('/').filter(Boolean).map(decodePathSegment);
  if (
    segments.length !== 8 ||
    segments[0] !== ROUTE_SEGMENTS[0] ||
    segments[2] !== ROUTE_SEGMENTS[1] ||
    segments[4] !== ROUTE_SEGMENTS[2] ||
    segments[6] !== ROUTE_SEGMENTS[3]
  ) {
    return undefined;
  }

  const [flowId, versionValue, runId, approvalId] = [
    segments[1],
    segments[3],
    segments[5],
    segments[7],
  ];
  const version = Number(versionValue);
  if (
    !isIdentifier(flowId) ||
    !Number.isSafeInteger(version) ||
    version < 1 ||
    !isIdentifier(runId) ||
    !isIdentifier(approvalId)
  ) {
    return undefined;
  }

  return {
    approvalId,
    flow: { id: flowId, version },
    runId,
  };
}

/*** Decodes a URL path component without allowing a malformed escape to break routing. */
function decodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return '';
  }
}

/*** Requires an identifier value without interpreting it as a token or credential. */
function isIdentifier(value: string | undefined): value is string {
  return value !== undefined && value.length > 0;
}
