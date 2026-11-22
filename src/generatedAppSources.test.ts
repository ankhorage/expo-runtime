import type { AppManifest } from '@ankhorage/contracts';
import { expect, test } from 'bun:test';

import { resolveExpoRuntimeGeneratedAppSources } from './generatedAppSources';

test('emits deterministic Runtime source and Navigator bindings for every referenced manifest screen', () => {
  const manifest = createManifest();

  const first = resolveExpoRuntimeGeneratedAppSources(manifest, undefined, {
    manifestModuleSpecifier: '../ankh.config.json',
    screenModuleSpecifier: '@/generated/runtimeManifestScreens',
  });
  const second = resolveExpoRuntimeGeneratedAppSources(manifest, undefined, {
    manifestModuleSpecifier: '../ankh.config.json',
    screenModuleSpecifier: '@/generated/runtimeManifestScreens',
  });

  expect(first).toEqual(second);
  expect(first.diagnostics).toEqual([]);
  expect(first.navigatorBindings).toEqual({
    guards: {},
    screens: {
      detail: {
        exportName: 'ManifestScreen0',
        module: '@/generated/runtimeManifestScreens',
      },
      home: {
        exportName: 'ManifestScreen1',
        module: '@/generated/runtimeManifestScreens',
      },
    },
  });
  expect(first.files).toEqual([
    expect.objectContaining({ relativePath: 'src/generated/runtimeManifestScreens.tsx' }),
  ]);
  expect(first.files[0]?.source).toContain("import { RuntimeScreen } from '@ankhorage/runtime';");
  expect(first.files[0]?.source).toContain('createManifestScreen("detail")');
  expect(first.files[0]?.source).toContain('createManifestScreen("home")');
});

test('fails closed with deterministic diagnostics when Navigator references no manifest screen', () => {
  const manifest = createManifest({ navigatorScreenId: 'missing' });

  const result = resolveExpoRuntimeGeneratedAppSources(manifest, undefined, {
    manifestModuleSpecifier: '../ankh.config.json',
    screenModuleSpecifier: '@/generated/runtimeManifestScreens',
  });

  expect(result.diagnostics).toEqual([
    {
      code: 'missing-manifest-screen',
      message:
        "Navigator references manifest screen 'missing', but no matching manifest screen exists.",
      screenId: 'missing',
      severity: 'error',
    },
  ]);
  expect(result.files).toEqual([]);
  expect(result.navigatorBindings).toEqual({ guards: {}, screens: {} });
});

test('reports an invalid caller module binding without emitting a fake Runtime screen', () => {
  const result = resolveExpoRuntimeGeneratedAppSources(createManifest(), undefined, {
    manifestModuleSpecifier: '',
    screenModuleSpecifier: '@/generated/runtimeManifestScreens',
  });

  expect(result.diagnostics).toEqual([
    {
      code: 'invalid-manifest-module-specifier',
      message: 'manifestModuleSpecifier must be a non-empty static module specifier.',
      severity: 'error',
    },
  ]);
  expect(result.files).toEqual([]);
});

/*** Create the smallest complete manifest needed to exercise generated Runtime screen ownership. */
function createManifest(options: { readonly navigatorScreenId?: string } = {}): AppManifest {
  const navigatorScreenId = options.navigatorScreenId ?? 'home';
  return {
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
      category: 'utilities_tools',
      name: 'Generated app',
      slug: 'generated-app',
      themeId: 'default',
      version: '1.0.0',
    },
    navigator: {
      routes: [
        { name: 'home', screenId: navigatorScreenId },
        {
          name: 'detail',
          navigator: { routes: [{ name: 'detail', screenId: 'detail' }], type: 'stack' },
        },
      ],
      type: 'stack',
    },
    screens: {
      detail: { id: 'detail', name: 'Detail', root: { id: 'detail-root', type: 'Screen' } },
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
  };
}
