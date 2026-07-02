const EXPO_BARCODE_SCANNER_VIEW_SOURCE = [
  'export { ExpoBarcodeScannerAdapter as ExpoBarcodeScannerView }',
  " from '@ankhorage/expo-runtime';",
  '\n',
].join('');

export function getExpoBarcodeScannerViewSource(): string {
  return EXPO_BARCODE_SCANNER_VIEW_SOURCE;
}
