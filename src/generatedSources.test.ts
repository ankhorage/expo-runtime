import { describe, expect, it } from 'bun:test';

import {
  getExpoBarcodeScannerViewSource,
  getExpoReaderSurfaceViewSource,
} from './generatedSources';

describe('generated Expo runtime sources', () => {
  it('emits the barcode scanner view adapter in canonical source format', () => {
    expect(getExpoBarcodeScannerViewSource()).toBe(
      "export { ExpoBarcodeScannerAdapter as ExpoBarcodeScannerView } from '@ankhorage/expo-runtime/barcode-scanner';\n",
    );
  });

  it('emits the reader surface adapter through its capability-scoped entrypoint', () => {
    expect(getExpoReaderSurfaceViewSource()).toBe(
      "export { ExpoReaderSurfaceAdapter as ExpoReaderSurfaceView } from '@ankhorage/expo-runtime/reader';\n",
    );
  });
});
