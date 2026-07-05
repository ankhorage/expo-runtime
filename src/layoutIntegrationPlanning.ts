import type { ExpoRuntimePlan } from './resolveExpoRuntimePlan';

export interface ExpoRuntimeLayoutIntegrationPlan {
  readonly imports: readonly string[];
  readonly moduleDeclarations: readonly string[];
  readonly providerStart: readonly string[];
  readonly providerEnd: readonly string[];
}

export function resolveExpoRuntimeLayoutIntegration(
  runtimePlan: ExpoRuntimePlan | undefined,
): ExpoRuntimeLayoutIntegrationPlan {
  const imports: string[] = [];
  const expoRuntimeImports: string[] = [];
  const moduleDeclarations: string[] = [];
  const providerStart: string[] = [];
  const providerEnd: string[] = [];

  if ((runtimePlan?.providers.length ?? 0) > 0) {
    expoRuntimeImports.push('ExpoRuntimeProviders');
    providerStart.push(
      `<ExpoRuntimeProviders providers={['${(runtimePlan?.providers ?? []).join("', '")}']}>`,
    );
    providerEnd.push('</ExpoRuntimeProviders>');
  }

  if (expoRuntimeImports.length > 0) {
    imports.push(
      `import { ${Array.from(new Set(expoRuntimeImports)).join(', ')} } from '@ankhorage/expo-runtime';`,
    );
  }

  return {
    imports,
    moduleDeclarations,
    providerStart,
    providerEnd,
  };
}
