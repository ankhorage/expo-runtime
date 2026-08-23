import { describe, expect, test } from 'bun:test';

import { executeExpoRuntimeAction, resolveExpoRuntimeRoutePath } from './actionBridge';

describe('action bridge entrypoint', () => {
  test('exports the standalone action helpers', () => {
    expect(typeof executeExpoRuntimeAction).toBe('function');
    expect(typeof resolveExpoRuntimeRoutePath).toBe('function');
  });
});
