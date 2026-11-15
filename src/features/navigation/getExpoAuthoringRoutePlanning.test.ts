import { describe, expect, test } from 'bun:test';

import { getExpoAuthoringRoutePlanning } from './getExpoAuthoringRoutePlanning';

describe('getExpoAuthoringRoutePlanning', () => {
  test('requires host composition for the published portable screen', () => {
    const planning = getExpoAuthoringRoutePlanning();

    expect(planning.find(({ route }) => route.id === 'screens')).toMatchObject({
      status: 'requires-host-composition',
      route: { pathPattern: '/ankh/screens' },
    });
  });

  test('preserves every unresolved Authoring route without generating router source', () => {
    const planning = getExpoAuthoringRoutePlanning();

    expect(planning).toHaveLength(13);
    expect(planning.filter(({ status }) => status === 'unresolved')).toHaveLength(12);
    expect(planning.every((route) => !('routeFilePath' in route) && !('source' in route))).toBe(
      true,
    );
  });
});
