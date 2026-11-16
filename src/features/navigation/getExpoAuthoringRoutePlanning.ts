import {
  AUTHORING_ANKH_ROUTE_DELIVERIES,
  type AuthoringRouteDeliveryDefinition,
} from '@ankhorage/studio-authoring';

export interface ExpoAuthoringRoutePlanning {
  readonly route: AuthoringRouteDeliveryDefinition;
  readonly status: 'requires-host-composition' | 'unresolved';
}

/*** Describe Authoring routes without generating an Expo Router module before host composition exists. */
export function getExpoAuthoringRoutePlanning(): readonly ExpoAuthoringRoutePlanning[] {
  return AUTHORING_ANKH_ROUTE_DELIVERIES.map(createExpoAuthoringRoutePlanning);
}

/*** Preserve Authoring owner boundaries in Expo planning rather than treating portable screens as routes. */
function createExpoAuthoringRoutePlanning(
  route: AuthoringRouteDeliveryDefinition,
): ExpoAuthoringRoutePlanning {
  return {
    route,
    status: route.screen.status === 'available' ? 'requires-host-composition' : 'unresolved',
  };
}
