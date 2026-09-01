import { describe, expect, it } from 'bun:test';

interface PackageJson {
  readonly exports: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

describe('capability-scoped adapter entrypoints', () => {
  it('publishes focused provider, barcode scanner, and reader exports', async () => {
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
    expect(packageJson.exports['./reader']).toMatchObject({
      import: './dist/reader/index.js',
      'react-native': './src/reader/index.ts',
      types: './src/reader/index.ts',
    });
  });

  it('keeps document renderer ownership out of the providers entrypoint', async () => {
    const entrypoint = await Bun.file(
      new URL('./ExpoRuntimeProviders.tsx', import.meta.url),
    ).text();

    expect(entrypoint).not.toContain('@readium/');
    expect(entrypoint).not.toContain('@zip.js/zip.js');
    expect(entrypoint).not.toContain('pdfjs-dist');
  });

  it('keeps camera ownership out of the reader entrypoint', async () => {
    const entrypoint = await Bun.file(new URL('./reader/index.ts', import.meta.url)).text();
    const adapter = await Bun.file(
      new URL('./reader/ExpoReaderSurfaceAdapter.tsx', import.meta.url),
    ).text();

    expect(entrypoint).toContain("from './ExpoReaderSurfaceAdapter'");
    expect(`${entrypoint}\n${adapter}`).not.toContain('expo-camera');
    expect(`${entrypoint}\n${adapter}`).not.toContain('@ankhorage/permissions');
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
