import { describe, expect, it } from 'bun:test';

import { resolveExpoRuntimePlan } from './resolveExpoRuntimePlan';

interface PackageJson {
  readonly exports: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

describe('capability-scoped adapter entrypoints', () => {
  it('publishes focused provider and barcode scanner exports without a legacy reader alias', async () => {
    const packageJson = (await Bun.file(
      new URL('../package.json', import.meta.url),
    ).json()) as PackageJson;

    expect(packageJson.exports['./providers']).toMatchObject({
      import: './dist/ExpoRuntimeProviders.js',
      'react-native': './src/ExpoRuntimeProviders.tsx',
      types: './src/ExpoRuntimeProviders.tsx',
    });
    expect(packageJson.exports['./barcode-scanner']).toMatchObject({
      import: './dist/barcodeScanner.js',
      'react-native': './src/barcodeScanner.ts',
      types: './src/barcodeScanner.ts',
    });
    expect(packageJson.exports).not.toHaveProperty('./reader');
  });

  it('keeps document renderer ownership out of the providers entrypoint', async () => {
    const entrypoint = await Bun.file(
      new URL('./ExpoRuntimeProviders.tsx', import.meta.url),
    ).text();

    expect(entrypoint).not.toContain('@readium/');
    expect(entrypoint).not.toContain('@zip.js/zip.js');
    expect(entrypoint).not.toContain('pdfjs-dist');
  });
});

describe('standalone reader capability isolation', () => {
  it('plans standalone Reader without camera, permissions or a custom Expo adapter', () => {
    const plan = resolveExpoRuntimePlan({
      screens: {
        library: {
          requires: {
            capabilities: { ebookReader: true },
          },
        },
      },
    });

    expect(plan.dependencies.map(({ name }) => name)).toEqual(['@ankhorage/reader']);
    expect(plan.permissions).toEqual([]);
    expect(plan.impliedPermissions).toEqual([]);
    expect(plan.providers).toEqual([]);
    expect(plan.runtimeAdapters).toEqual([]);
    expect(plan.usesExpoRuntimeRegistry).toBe(false);
    expect(plan.nativeConfig.plugins).toEqual([]);
  });

  it('keeps document renderer ownership out of the scanner entrypoint', async () => {
    const entrypoint = await Bun.file(new URL('./barcodeScanner.ts', import.meta.url)).text();
    const adapter = await Bun.file(
      new URL('./ExpoBarcodeScannerAdapter.tsx', import.meta.url),
    ).text();
    const source = `${entrypoint}\n${adapter}`;

    expect(entrypoint).toContain("from './ExpoBarcodeScannerAdapter'");
    expect(source).not.toContain('@readium/');
    expect(source).not.toContain('@zip.js/zip.js');
    expect(source).not.toContain('pdfjs-dist');
  });
});
