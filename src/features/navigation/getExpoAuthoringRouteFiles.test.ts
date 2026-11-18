import { AUTHORING_ANKH_ROUTE_DELIVERIES } from '@ankhorage/studio-authoring';
import { describe, expect, test } from 'bun:test';

import { getExpoAuthoringRouteFiles } from './getExpoAuthoringRouteFiles';

const screensHost = {
  screens: {
    moduleSpecifier: '../../authoring/screensHost',
    getPropsExportName: 'getScreensAuthoringScreenProps',
  },
} as const;

describe('getExpoAuthoringRouteFiles', () => {
  test('maps only the published screen to its deterministic Expo Router file', () => {
    const [file] = getExpoAuthoringRouteFiles(AUTHORING_ANKH_ROUTE_DELIVERIES, screensHost);

    expect(file?.relativePath).toBe('ankh/screens.tsx');
    expect(file?.route.id).toBe('screens');
    expect(file?.source).toContain(
      'import { ScreensAuthoringScreen } from "@ankhorage/studio-authoring/screens";',
    );
  });

  test('preserves the host props factory without inventing optional props', () => {
    const [file] = getExpoAuthoringRouteFiles(AUTHORING_ANKH_ROUTE_DELIVERIES, screensHost);

    expect(file?.source).toContain(
      '<ScreensAuthoringScreen {...getScreensAuthoringScreenProps()} />',
    );
  });

  test('encodes declared path parameters as Expo Router segments', () => {
    const route = AUTHORING_ANKH_ROUTE_DELIVERIES.find(({ id }) => id === 'screen-detail');
    if (!route) throw new Error('Missing screen-detail route fixture.');

    expect(
      getExpoAuthoringRouteFiles([{ ...route, screen: getAvailableScreenRoute().screen }], {
        'screen-detail': screensHost.screens,
      })[0]?.relativePath,
    ).toBe('ankh/screens/[screenId].tsx');
  });

  test('fails closed when the available screen has no declared host port', () => {
    expect(() => getExpoAuthoringRouteFiles(AUTHORING_ANKH_ROUTE_DELIVERIES, {})).toThrow(
      "Authoring route 'screens' requires an explicit host composition port.",
    );
  });
});

describe('getExpoAuthoringRouteFiles safety', () => {
  test('rejects unsafe route segments and remains deterministic for identical inputs', () => {
    const availableRoute = getAvailableScreenRoute();
    expect(() =>
      getExpoAuthoringRouteFiles(
        [{ ...availableRoute, pathPattern: '/ankh/../screens' }],
        screensHost,
      ),
    ).toThrow('unsafe path segment');
    expect(() =>
      getExpoAuthoringRouteFiles(AUTHORING_ANKH_ROUTE_DELIVERIES, {
        screens: { ...screensHost.screens, getPropsExportName: 'props; throw new Error()' },
      }),
    ).toThrow('unsafe screen or host export name');
    expect(getExpoAuthoringRouteFiles(AUTHORING_ANKH_ROUTE_DELIVERIES, screensHost)).toEqual(
      getExpoAuthoringRouteFiles(AUTHORING_ANKH_ROUTE_DELIVERIES, screensHost),
    );
  });
});

function getAvailableScreenRoute() {
  const route = AUTHORING_ANKH_ROUTE_DELIVERIES.find(({ screen }) => screen.status === 'available');
  if (route?.screen.status !== 'available') {
    throw new Error('Missing available Authoring screen route fixture.');
  }
  return route;
}
