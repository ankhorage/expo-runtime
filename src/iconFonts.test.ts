import { expect, test } from 'bun:test';

import { ExpoZoraIconFontProvider } from './ExpoZoraIconFontProvider';

test('exports the icon font boundary through its focused subpath', async () => {
  const packageJson = (await Bun.file(new URL('../package.json', import.meta.url)).json()) as {
    readonly exports: Readonly<Record<string, unknown>>;
  };

  expect(packageJson.exports['./icon-fonts']).toEqual({
    'react-native': './src/ExpoZoraIconFontProvider.tsx',
    browser: './src/ExpoZoraIconFontProvider.web.tsx',
    types: './src/ExpoZoraIconFontProvider.tsx',
    import: './dist/ExpoZoraIconFontProvider.js',
    default: './dist/ExpoZoraIconFontProvider.js',
  });
  expect(ExpoZoraIconFontProvider).toBeFunction();
});
