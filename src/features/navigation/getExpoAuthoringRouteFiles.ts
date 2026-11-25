import type {
  AuthoringRouteDeliveryDefinition,
  AvailableAuthoringRouteScreen,
} from '@ankhorage/studio-authoring';

import type {
  ExpoAuthoringRouteFile,
  ExpoAuthoringRouteHostPort,
  ExpoAuthoringRouteHostPorts,
} from '../../types/expoAuthoringRouteDelivery';

/*** Translate available portable Authoring screens into deterministic, host-composed Expo Router files. */
export function getExpoAuthoringRouteFiles(
  routes: readonly AuthoringRouteDeliveryDefinition[],
  hostPorts: ExpoAuthoringRouteHostPorts,
): readonly ExpoAuthoringRouteFile[] {
  return routes
    .filter(isAvailableAuthoringRoute)
    .map((route) => createExpoAuthoringRouteFile(route, requireHostPort(route, hostPorts)));
}

/*** Limit delivery to routes whose owner has published a concrete screen module. */
function isAvailableAuthoringRoute(
  route: AuthoringRouteDeliveryDefinition,
): route is AuthoringRouteDeliveryDefinition & { readonly screen: AvailableAuthoringRouteScreen } {
  return route.screen.status === 'available';
}

/*** Refuse to synthesize a route when its host has not explicitly accepted its composition boundary. */
function requireHostPort(
  route: AuthoringRouteDeliveryDefinition,
  hostPorts: ExpoAuthoringRouteHostPorts,
): ExpoAuthoringRouteHostPort {
  const hostPort = hostPorts[route.id];
  if (!hostPort) {
    throw new Error(`Authoring route '${route.id}' requires an explicit host composition port.`);
  }
  return hostPort;
}

/*** Render one Expo Router file from one published portable screen and one declared host props factory. */
function createExpoAuthoringRouteFile(
  route: AuthoringRouteDeliveryDefinition & { readonly screen: AvailableAuthoringRouteScreen },
  hostPort: ExpoAuthoringRouteHostPort,
): ExpoAuthoringRouteFile {
  const relativePath = getExpoRouterRelativePath(route);
  assertSafeSourceIdentifiers(route, hostPort);
  const componentName = getRouteComponentName(relativePath);
  return {
    relativePath,
    route,
    source: [
      `import { ${route.screen.exportName} } from ${JSON.stringify(route.screen.moduleSpecifier)};`,
      `import { ${hostPort.getPropsExportName} } from ${JSON.stringify(hostPort.moduleSpecifier)};`,
      '',
      `export default function ${componentName}() {`,
      `  return <${route.screen.exportName} {...${hostPort.getPropsExportName}()} />;`,
      '}',
      '',
    ].join('\n'),
  };
}

/*** Refuse values that would turn a published route or host port into arbitrary generated source. */
function assertSafeSourceIdentifiers(
  route: AuthoringRouteDeliveryDefinition & { readonly screen: AvailableAuthoringRouteScreen },
  hostPort: ExpoAuthoringRouteHostPort,
): void {
  if (
    !isSafeJavaScriptIdentifier(route.screen.exportName) ||
    !isSafeJavaScriptIdentifier(hostPort.getPropsExportName)
  ) {
    throw new Error(`Authoring route '${route.id}' has an unsafe screen or host export name.`);
  }
}

/*** Convert a published pathname template to a confined Expo Router-relative TSX path. */
function getExpoRouterRelativePath(route: AuthoringRouteDeliveryDefinition): string {
  const segments = route.pathPattern.split('/').slice(1);
  const parameters = new Set(route.parameters.map(({ name }) => name));
  const relativeSegments = segments.map((segment) => getExpoRouterSegment(segment, parameters));
  if (relativeSegments.length === 0 || parameters.size !== 0) {
    throw new Error(`Authoring route '${route.id}' has an invalid path parameter declaration.`);
  }
  return `${relativeSegments.join('/')}.tsx`;
}

/*** Validate one path segment before translating a declared parameter to Expo Router syntax. */
function getExpoRouterSegment(segment: string, parameters: Set<string>): string {
  const parameterName = segment.startsWith(':') ? segment.slice(1) : undefined;
  if (parameterName) {
    if (!parameters.delete(parameterName) || !isSafeRouteParameterName(parameterName)) {
      throw new Error(`Authoring route contains an invalid path parameter '${segment}'.`);
    }
    return `[${parameterName}]`;
  }
  if (!isSafeRouteIdentifier(segment)) {
    throw new Error(`Authoring route contains an unsafe path segment '${segment}'.`);
  }
  return segment;
}

/*** Accept only non-empty route identifiers that cannot escape the generated app directory. */
function isSafeRouteIdentifier(value: string): boolean {
  return /^[a-z][a-z0-9-]*$/u.test(value);
}

/*** Accept the published camel-case parameter names while retaining single-segment route safety. */
function isSafeRouteParameterName(value: string): boolean {
  return /^[a-z][A-Za-z0-9]*$/u.test(value);
}

/*** Accept a JavaScript identifier only when it can be inserted into generated import and JSX syntax. */
function isSafeJavaScriptIdentifier(value: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(value);
}

/*** Derive a stable default-export component name from the generated route filename. */
function getRouteComponentName(relativePath: string): string {
  return `${relativePath
    .replace(/\.tsx$/u, '')
    .split('/')
    .map((segment) => segment.replace(/\[|\]|-/gu, ''))
    .map((segment) => `${segment.slice(0, 1).toUpperCase()}${segment.slice(1)}`)
    .join('')}Route`;
}
