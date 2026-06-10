import { describe, expect, test } from 'bun:test';

import { resolveExpoRuntimePlan } from './planning';

describe('planning entrypoint', () => {
  test('exports resolveExpoRuntimePlan', () => {
    expect(typeof resolveExpoRuntimePlan).toBe('function');
  });
});
