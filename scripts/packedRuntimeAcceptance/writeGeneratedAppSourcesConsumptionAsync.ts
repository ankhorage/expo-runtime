import path from 'node:path';

/*** Write the packed consumer script that composes published Templates, Runtime, and Navigator APIs. */
export async function writeGeneratedAppSourcesConsumptionAsync(
  consumerRoot: string,
): Promise<void> {
  await Bun.write(
    path.join(consumerRoot, 'src/generatedAppSources.ts'),
    createGeneratedAppSourcesConsumptionSource(),
  );
}

/*** Assemble the consumer-owned manifest that drives published template materialization and Router generation. */
function createGeneratedAppSourcesConsumptionSource(): string {
  return `${createConsumerImports()}

${createConsumerManifest()}
${createConsumerComposition()}`;
}

/*** Render the complete published API imports required by the packed consumer composition proof. */
function createConsumerImports(): string {
  return `import { mkdir } from 'node:fs/promises';

import type { AppManifest } from '@ankhorage/contracts';
import { resolveExpoRuntimeGeneratedAppSources } from '@ankhorage/expo-runtime/generated-app';
import { createNavigatorPlan, generateNavigator } from '@ankhorage/navigator';
import { materializeTemplateRevision } from '@ankhorage/templates';`;
}

/*** Render the smallest complete published Contracts manifest accepted by Runtime, Templates, and Navigator. */
function createConsumerManifest(): string {
  return `const manifest: AppManifest = {
  activeThemeId: 'default',
  infra: {
    environments: {
      local: {
        deployment: {
          compute: { provider: 'local' },
          runtime: { provider: 'minikube' },
        },
      },
    },
    modules: {},
  },
  metadata: {
    category: 'games',
    name: 'Packed consumer',
    slug: 'packed-consumer',
    themeId: 'default',
    version: '1.0.0',
  },
  navigator: { routes: [{ name: 'home', screenId: 'home' }], type: 'stack' },
  screens: {
    home: { id: 'home', name: 'Home', root: { id: 'home-root', type: 'Screen' } },
  },
  settings: { localization: { defaultLocale: 'en', locales: ['en'] } },
  themes: {
    default: {
      dark: { harmony: 'analogous', primaryColor: '#000000' },
      id: 'default',
      light: { harmony: 'analogous', primaryColor: '#ffffff' },
      name: 'Default',
    },
  },
};`;
}

/*** Render the materialization, generated Runtime bindings, Router emission, and fail-closed proof. */
function createConsumerComposition(): string {
  return `const materialized = await materializeTemplateRevision({
  cwd: process.cwd(),
  manifest,
  projectSlug: 'template-revision',
  template: { category: 'games', slug: 'grossmeister' },
});
const output = resolveExpoRuntimeGeneratedAppSources(manifest, undefined, {
  manifestModuleSpecifier: '../../template-revision/ankh.config.json',
  screenModuleSpecifier: '../generated/runtimeManifestScreens',
});
const navigator = generateNavigator(
  createNavigatorPlan(manifest.navigator, { expoRouterVersion: '57.0.31', platform: 'web' }),
  output.navigatorBindings,
);
await mkdir('src/generated', { recursive: true });
await Promise.all([
  ...output.files.map((file) => Bun.write(file.relativePath, file.source)),
  ...navigator.files.map((file) => Bun.write(file.path, file.contents)),
]);

if (
  !materialized.createdFiles.includes('ankh.config.json') ||
  materialized.createdFiles.length <= 3 ||
  output.diagnostics.length !== 0 ||
  output.files[0]?.relativePath !== 'src/generated/runtimeManifestScreens.tsx' ||
  output.navigatorBindings.screens.home?.exportName !== 'ManifestScreen0' ||
  navigator.diagnostics.length !== 0 ||
  navigator.files.find((file) => file.path === 'src/app/home.tsx')?.contents !==
    "export { ManifestScreen0 as default } from '../generated/runtimeManifestScreens';\\n"
) {
  throw new Error('Packed Expo Runtime, Templates, and Navigator did not compose a generated app.');
}`;
}
