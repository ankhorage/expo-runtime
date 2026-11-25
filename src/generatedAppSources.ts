import type {
  AppManifest,
  NavigatorGenerationBindings,
  NavigatorNode,
  NavigatorScreenModule,
} from '@ankhorage/contracts';

import {
  type ExpoRuntimeGeneratedAppOutputPlan,
  resolveExpoRuntimeGeneratedAppOutput,
} from './generatedAppOutput';
import type { ExpoRuntimePlan } from './resolveExpoRuntimePlan';

export interface ExpoRuntimeGeneratedAppSourceFile {
  readonly relativePath: string;
  readonly source: string;
}

export interface ExpoRuntimeGeneratedAppSourceDiagnostic {
  readonly code: 'invalid-manifest-module-specifier' | 'missing-manifest-screen';
  readonly severity: 'error';
  readonly screenId?: string;
  readonly message: string;
}

export interface ExpoRuntimeGeneratedAppSources extends ExpoRuntimeGeneratedAppOutputPlan {
  readonly diagnostics: readonly ExpoRuntimeGeneratedAppSourceDiagnostic[];
  readonly files: readonly ExpoRuntimeGeneratedAppSourceFile[];
  readonly navigatorBindings: NavigatorGenerationBindings;
}

export interface ResolveExpoRuntimeGeneratedAppSourcesOptions {
  /** Static module specifier through which the caller exposes its immutable manifest. */
  readonly manifestModuleSpecifier: string;
  /** Static module specifier Navigator uses to import the generated manifest screen exports. */
  readonly screenModuleSpecifier: string;
}

/***
 * Emit the Runtime-owned, filesystem-independent source module and Navigator screen bindings for one manifest.
 *
 * The caller owns manifest materialization and file writes. This boundary intentionally emits no Authoring
 * routes: unresolved `/ankh` routes remain the responsibility of their published owner.
 */
export function resolveExpoRuntimeGeneratedAppSources(
  manifest: AppManifest,
  runtimePlan: ExpoRuntimePlan | undefined,
  options: ResolveExpoRuntimeGeneratedAppSourcesOptions,
): ExpoRuntimeGeneratedAppSources {
  const output = resolveExpoRuntimeGeneratedAppOutput(runtimePlan);
  const diagnostics = collectDiagnostics(manifest, options);
  const screenIds = collectNavigatorScreenIds(manifest.navigator);
  const navigatorBindings = createNavigatorBindings(screenIds, options.screenModuleSpecifier);

  return {
    ...output,
    diagnostics,
    files:
      diagnostics.length === 0
        ? [
            {
              relativePath: 'src/generated/runtimeManifestScreens.tsx',
              source: createRuntimeManifestScreensSource(manifest, options.manifestModuleSpecifier),
            },
          ]
        : [],
    navigatorBindings: diagnostics.length === 0 ? navigatorBindings : { guards: {}, screens: {} },
  };
}

/*** Collect every manifest screen identity that Navigator can render or reference as a native accessory. */
function collectNavigatorScreenIds(navigator: NavigatorNode): readonly string[] {
  return Array.from(collectNavigatorScreenIdSet(navigator)).sort();
}

/*** Traverse one navigator subtree without treating unowned Authoring paths as Runtime screens. */
function collectNavigatorScreenIdSet(navigator: NavigatorNode): ReadonlySet<string> {
  const screenIds = new Set<string>();
  for (const route of navigator.routes) {
    if (route.screenId !== undefined) screenIds.add(route.screenId);
    if (route.navigator !== undefined) {
      for (const screenId of collectNavigatorScreenIdSet(route.navigator)) screenIds.add(screenId);
    }
  }
  if (navigator.type === 'split-view') {
    screenIds.add(navigator.columns.primary.screenId);
    if (navigator.columns.supplementary !== undefined) {
      screenIds.add(navigator.columns.supplementary.screenId);
    }
    if (navigator.inspector !== undefined) screenIds.add(navigator.inspector.screenId);
  }
  if (navigator.type === 'tabs' && navigator.implementation === 'native') {
    if (navigator.bottomAccessory !== undefined) screenIds.add(navigator.bottomAccessory.screenId);
  }
  return screenIds;
}

/*** Report invalid caller module bindings and every Navigator screen that the manifest does not define. */
function collectDiagnostics(
  manifest: AppManifest,
  options: ResolveExpoRuntimeGeneratedAppSourcesOptions,
): readonly ExpoRuntimeGeneratedAppSourceDiagnostic[] {
  const invalidSpecifierDiagnostics: ExpoRuntimeGeneratedAppSourceDiagnostic[] = [
    ['manifestModuleSpecifier', options.manifestModuleSpecifier] as const,
    ['screenModuleSpecifier', options.screenModuleSpecifier] as const,
  ].flatMap(([name, value]) =>
    isStaticModuleSpecifier(value)
      ? []
      : [
          {
            code: 'invalid-manifest-module-specifier',
            severity: 'error',
            message: `${name} must be a non-empty static module specifier.`,
          } satisfies ExpoRuntimeGeneratedAppSourceDiagnostic,
        ],
  );
  const missingScreenDiagnostics: ExpoRuntimeGeneratedAppSourceDiagnostic[] =
    collectNavigatorScreenIds(manifest.navigator)
      .filter((screenId) => !Object.hasOwn(manifest.screens, screenId))
      .map(
        (screenId) =>
          ({
            code: 'missing-manifest-screen',
            severity: 'error',
            screenId,
            message: `Navigator references manifest screen '${screenId}', but no matching manifest screen exists.`,
          }) satisfies ExpoRuntimeGeneratedAppSourceDiagnostic,
      );
  return [...invalidSpecifierDiagnostics, ...missingScreenDiagnostics].sort((left, right) =>
    `${left.code}\0${left.screenId ?? ''}\0${left.message}`.localeCompare(
      `${right.code}\0${right.screenId ?? ''}\0${right.message}`,
    ),
  );
}

/*** Keep generated static imports safe without imposing a filesystem layout on the caller. */
function isStaticModuleSpecifier(value: string): boolean {
  return (
    value.trim().length > 0 &&
    Array.from(value).every(
      (character) => character.charCodeAt(0) >= 32 && !["'", '"', '`', '\\'].includes(character),
    )
  );
}

/*** Map each actual Navigator screen identity onto a stable named export in the generated Runtime module. */
function createNavigatorBindings(
  screenIds: readonly string[],
  screenModuleSpecifier: string,
): NavigatorGenerationBindings {
  return {
    guards: {},
    screens: Object.fromEntries(
      screenIds.map((screenId, index) => [
        screenId,
        {
          module: screenModuleSpecifier,
          exportName: getManifestScreenExportName(index),
        } satisfies NavigatorScreenModule,
      ]),
    ),
  };
}

/*** Produce a safe export name independently of user-authored screen identifiers. */
function getManifestScreenExportName(index: number): string {
  return `ManifestScreen${index}`;
}

/*** Render the one Runtime-owned module whose exports bind Navigator routes to actual manifest screens. */
function createRuntimeManifestScreensSource(
  manifest: AppManifest,
  manifestModuleSpecifier: string,
): string {
  const screenIds = collectNavigatorScreenIds(manifest.navigator);
  const exports = screenIds
    .map(
      (screenId, index) =>
        `export const ${getManifestScreenExportName(index)} = createManifestScreen(${JSON.stringify(screenId)});`,
    )
    .join('\n');
  return `import type { AppManifest } from '@ankhorage/contracts';
import { RuntimeScreen } from '@ankhorage/runtime';
import { createZoraComponentRegistry } from '@ankhorage/zora';
import runtimeManifest from ${JSON.stringify(manifestModuleSpecifier)};

const manifest = runtimeManifest as AppManifest;
const registry = createZoraComponentRegistry();

function createManifestScreen(screenId: string) {
  const screen = manifest.screens[screenId];
  if (screen === undefined) {
    throw new Error(\`Generated Runtime screen binding is missing manifest screen '\${screenId}'.\`);
  }
  return function ManifestScreen() {
    return <RuntimeScreen manifest={manifest} registry={registry} screen={screen} />;
  };
}

${exports}
`;
}
