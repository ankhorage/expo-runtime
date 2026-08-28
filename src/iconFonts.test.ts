import { expect, test } from 'bun:test';

import { ExpoZoraIconFontProvider } from './ExpoZoraIconFontProvider';

test('exports the icon font boundary through its focused subpath', async () => {
  const packageJson = (await Bun.file(new URL('../package.json', import.meta.url)).json()) as {
    readonly exports: Readonly<Record<string, Readonly<Record<string, string>>>>;
  };

  const iconFontExport = packageJson.exports['./icon-fonts'];

  expect(Object.keys(iconFontExport)).toEqual([
    'browser',
    'react-native',
    'types',
    'node',
    'import',
    'default',
  ]);
  expect(iconFontExport).toEqual({
    browser: './src/ExpoZoraIconFontProvider.web.tsx',
    'react-native': './src/ExpoZoraIconFontProvider.tsx',
    types: './src/ExpoZoraIconFontProvider.tsx',
    node: './src/ExpoZoraIconFontProvider.web.tsx',
    import: './dist/ExpoZoraIconFontProvider.js',
    default: './dist/ExpoZoraIconFontProvider.js',
  });
  expect(ExpoZoraIconFontProvider).toBeFunction();
});
