import { parseFlowApprovalRoutePath } from './flowApprovalRoute';
import type { FlowApprovalRoute } from './types';

/*** Resolves an approval route from a custom-scheme or HTTPS link without reading query credentials. */
export function resolveFlowApprovalRoute(url: string): FlowApprovalRoute | undefined {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  if (parsed.search.length > 0 || parsed.hash.length > 0) return undefined;

  const path = parsed.hostname === 'flows' ? `flows${parsed.pathname}` : parsed.pathname;
  return parseFlowApprovalRoutePath(path);
}
