const EXPO_BARCODE_SCANNER_VIEW_SOURCE = [
  'export { ExpoBarcodeScannerAdapter as ExpoBarcodeScannerView }',
  " from '@ankhorage/expo-runtime/barcode-scanner';",
  '\n',
] as const;

const EXPO_READER_SURFACE_VIEW_SOURCE = [
  'export { ExpoReaderSurfaceAdapter as ExpoReaderSurfaceView }',
  " from '@ankhorage/expo-runtime/reader';",
  '\n',
] as const;

export function getExpoBarcodeScannerViewSource(): string {
  return EXPO_BARCODE_SCANNER_VIEW_SOURCE.join('');
}

export function getExpoReaderSurfaceViewSource(): string {
  return EXPO_READER_SURFACE_VIEW_SOURCE.join('');
}
