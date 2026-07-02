import { describe, expect, test } from 'bun:test';

import { getExpoBarcodeScannerViewSource } from './generatedSources';

describe('generated Expo runtime sources', () => {
  test('generates the barcode scanner adapter bridge source', () => {
    const source = getExpoBarcodeScannerViewSource();

    expect(source).toContain('ExpoBarcodeScannerAdapter');
    expect(source).toContain('ExpoBarcodeScannerView');
    expect(source).toContain('@ankhorage/expo-runtime');
    expect(source).toEndWith('\n');
  });
});
