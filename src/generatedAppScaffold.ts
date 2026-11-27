import type { AppManifest } from '@ankhorage/contracts';

import { resolveExpoRuntimeGeneratedAppOutput } from './generatedAppOutput';
import { GENERATED_APP_SCREEN_SOURCE_DEPENDENCIES } from './generatedAppSources';
import { EXPO_PLATFORM } from './platform';
import type { ExpoRuntimePlan } from './resolveExpoRuntimePlan';

export interface ExpoRuntimeGeneratedAppScaffoldFile {
  readonly relativePath: 'package.json' | 'app.config.ts' | 'src/generated/runtimeShell.tsx';
  readonly source: string;
}

export interface ExpoRuntimeGeneratedAppScaffold {
  readonly files: readonly ExpoRuntimeGeneratedAppScaffoldFile[];
}

/*** Emit the Runtime-owned files needed to finish a generated Expo application without writing to disk. */
export function resolveExpoRuntimeGeneratedAppScaffold(
  manifest: Pick<AppManifest, 'metadata'>,
  runtimePlan: ExpoRuntimePlan | undefined,
): ExpoRuntimeGeneratedAppScaffold {
  const output = resolveExpoRuntimeGeneratedAppOutput(runtimePlan);

  return {
    files: [
      {
        relativePath: 'package.json',
        source: createPackageSource(manifest, {
          ...output.dependencies,
          ...GENERATED_APP_SCREEN_SOURCE_DEPENDENCIES,
        }),
      },
      {
        relativePath: 'app.config.ts',
        source: createExpoConfigSource(manifest, output.native),
      },
      {
        relativePath: 'src/generated/runtimeShell.tsx',
        source: createRuntimeShellSource(runtimePlan?.providers ?? []),
      },
    ],
  };
}

/*** Render the independently installable Expo Router package boundary for one generated application. */
function createPackageSource(
  manifest: Pick<AppManifest, 'metadata'>,
  dependencies: Readonly<Record<string, string>>,
): string {
  return `${JSON.stringify(
    {
      name: manifest.metadata.slug,
      version: manifest.metadata.version,
      private: true,
      type: 'module',
      main: 'expo-router/entry',
      dependencies: {
        ...dependencies,
        '@ankhorage/expo-runtime': '^7.3.0',
        '@expo/metro-runtime': EXPO_PLATFORM.packages.metroRuntime.version,
        expo: EXPO_PLATFORM.runtime.expo.version,
        'expo-router': EXPO_PLATFORM.navigation.expoRouter.version,
        react: EXPO_PLATFORM.runtime.react.version,
        'react-dom': EXPO_PLATFORM.runtime.reactDom.version,
        'react-native': EXPO_PLATFORM.runtime.reactNative.version,
        'react-native-safe-area-context': EXPO_PLATFORM.navigation.safeArea.version,
        'react-native-screens': EXPO_PLATFORM.navigation.screens.version,
        'react-native-web': EXPO_PLATFORM.runtime.reactNativeWeb.version,
      },
    },
    null,
    2,
  )}\n`;
}

/*** Render the native Expo configuration fragment from Runtime's resolved plugin and permission plan. */
function createExpoConfigSource(
  manifest: Pick<AppManifest, 'metadata'>,
  native: ReturnType<typeof resolveExpoRuntimeGeneratedAppOutput>['native'],
): string {
  return `export default {
  expo: {
    name: ${JSON.stringify(manifest.metadata.name)},
    slug: ${JSON.stringify(manifest.metadata.slug)},
    scheme: ${JSON.stringify(manifest.metadata.slug)},
    android: ${JSON.stringify({ permissions: native.androidPermissions }, null, 4)},
    plugins: ${JSON.stringify(native.configPlugins, null, 4)},
  },
} as const;\n`;
}

/*** Render the canonical Runtime provider shell while leaving application composition to the caller. */
function createRuntimeShellSource(providers: readonly string[]): string {
  return `import type { ReactNode } from 'react';
import { ExpoRuntimeProviders } from '@ankhorage/expo-runtime/providers';
import { ResponsiveProvider } from '@ankhorage/surface';
import { ZoraProvider } from '@ankhorage/zora';

export function GeneratedRuntimeShell({ children }: { readonly children: ReactNode }) {
  return (
    <ResponsiveProvider>
      <ZoraProvider>
        <ExpoRuntimeProviders providers={${JSON.stringify(providers)}}>{children}</ExpoRuntimeProviders>
      </ZoraProvider>
    </ResponsiveProvider>
  );
}
`;
}
