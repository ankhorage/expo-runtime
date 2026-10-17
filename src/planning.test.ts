import { describe, expect, test } from 'bun:test';

import { resolveExpoRuntimePlan } from './planning';

describe('planning entrypoint', () => {
  test('exports resolveExpoRuntimePlan', () => {
    expect(typeof resolveExpoRuntimePlan).toBe('function');
  });

  test('plans the released Permissions 0.3 owner version', () => {
    const plan = resolveExpoRuntimePlan({
      screens: {
        camera: {
          requires: {
            permissions: { camera: true },
          },
        },
      },
    });
    expect(plan.dependencies).toContainEqual({
      name: '@ankhorage/permissions',
      version: '^0.3.6',
      reasons: ['permission:camera'],
    });
  });
});
