import type { AnkhRouteId, AuthoringRouteDeliveryDefinition } from '@ankhorage/studio-authoring';

/*** Describe the host-owned props factory that composes one portable Authoring screen. */
export interface ExpoAuthoringRouteHostPort {
  readonly getPropsExportName: string;
  readonly moduleSpecifier: string;
}

/*** Supply every host composition port needed by the available Authoring screen routes. */
export type ExpoAuthoringRouteHostPorts = Readonly<
  Partial<Record<AnkhRouteId, ExpoAuthoringRouteHostPort>>
>;

/*** Record one deterministic Expo Router file without performing filesystem I/O. */
export interface ExpoAuthoringRouteFile {
  readonly relativePath: string;
  readonly route: AuthoringRouteDeliveryDefinition;
  readonly source: string;
}
