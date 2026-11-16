import { describe, expect, test } from 'bun:test';

import {
  createFlowApprovalNotificationData,
  parseFlowApprovalNotificationData,
} from './flowApprovalNotification';
import { getFlowApprovalRoutePath, parseFlowApprovalRoutePath } from './flowApprovalRoute';
import { resolveFlowApprovalRoute } from './resolveFlowApprovalRoute';

const ROUTE = {
  approvalId: 'approval-7',
  flow: { id: 'workflow/with space', version: 3 },
  runId: 'run-5',
} as const;

describe('Flow approval routes', () => {
  test('round-trips immutable workflow, run, and approval references without query data', () => {
    const path = getFlowApprovalRoutePath(ROUTE);

    expect(path).toBe('flows/workflow%2Fwith%20space/versions/3/runs/run-5/approvals/approval-7');
    expect(parseFlowApprovalRoutePath(path)).toEqual(ROUTE);
    expect(resolveFlowApprovalRoute(`ankh:///` + path)).toEqual(ROUTE);
    expect(resolveFlowApprovalRoute(`https://app.example/${path}`)).toEqual(ROUTE);
    expect(resolveFlowApprovalRoute(`https://app.example/${path}?token=forbidden`)).toBeUndefined();
  });

  test('rejects incomplete paths and non-positive versions', () => {
    expect(
      parseFlowApprovalRoutePath('flows/flow/versions/0/runs/run/approvals/approval'),
    ).toBeUndefined();
    expect(parseFlowApprovalRoutePath('flows/flow/versions/1/runs/run')).toBeUndefined();
    expect(resolveFlowApprovalRoute('not a link')).toBeUndefined();
  });
});

describe('Flow approval notification payloads', () => {
  test('uses references only and rejects unrelated payload fields', () => {
    const data = createFlowApprovalNotificationData(ROUTE);

    expect(data).toEqual({
      approvalId: 'approval-7',
      flowId: 'workflow/with space',
      flowVersion: 3,
      kind: 'ankhorage.flow.approval',
      runId: 'run-5',
    });
    expect(parseFlowApprovalNotificationData(data)).toEqual(ROUTE);
    expect(
      parseFlowApprovalNotificationData({ ...data, accessToken: 'must-not-be-read' }),
    ).toBeUndefined();
  });

  test('rejects notification data with absent identifiers or non-versioned flows', () => {
    expect(
      parseFlowApprovalNotificationData({
        approvalId: 'approval',
        flowId: 'flow',
        flowVersion: 0,
        kind: 'ankhorage.flow.approval',
        runId: 'run',
      }),
    ).toBeUndefined();
    expect(parseFlowApprovalNotificationData({ kind: 'unknown' })).toBeUndefined();
  });
});
