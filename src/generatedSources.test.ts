import { describe, expect, it } from 'bun:test';

import { getExpoBarcodeScannerViewSource } from './generatedSources';

describe('generated Expo runtime sources', () => {
  it('emits the barcode scanner view adapter in canonical source format', () => {
    expect(getExpoBarcodeScannerViewSource()).toBe(
      "export { ExpoBarcodeScannerAdapter as ExpoBarcodeScannerView } from '@ankhorage/expo-runtime';\n",
    );
  });
});
