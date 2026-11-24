import { resolveExpoRuntimeGeneratedAppOutput } from './generatedAppOutput';
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
  runtimePlan: ExpoRuntimePlan | undefined,
): ExpoRuntimeGeneratedAppScaffold {
  const output = resolveExpoRuntimeGeneratedAppOutput(runtimePlan);

  return {
    files: [
      {
        relativePath: 'package.json',
        source: `${JSON.stringify({ dependencies: output.dependencies }, null, 2)}\n`,
      },
      {
        relativePath: 'app.config.ts',
        source: createExpoConfigSource(output.native),
      },
      {
        relativePath: 'src/generated/runtimeShell.tsx',
        source: createRuntimeShellSource(runtimePlan?.providers ?? []),
      },
    ],
  };
}

/*** Render the native Expo configuration fragment from Runtime's resolved plugin and permission plan. */
function createExpoConfigSource(
  native: ReturnType<typeof resolveExpoRuntimeGeneratedAppOutput>['native'],
): string {
  return `export default {
  expo: {
    android: ${JSON.stringify({ permissions: native.androidPermissions }, null, 4)},
    plugins: ${JSON.stringify(native.configPlugins, null, 4)},
  },
} as const;\n`;
}

/*** Render the canonical Runtime provider shell while leaving application composition to the caller. */
function createRuntimeShellSource(providers: readonly string[]): string {
  return `import type { ReactNode } from 'react';
import { ExpoRuntimeProviders } from '@ankhorage/expo-runtime/providers';

export function GeneratedRuntimeShell({ children }: { readonly children: ReactNode }) {
  return <ExpoRuntimeProviders providers={${JSON.stringify(providers)}}>{children}</ExpoRuntimeProviders>;
}
`;
}
