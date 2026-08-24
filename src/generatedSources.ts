const EXPO_BARCODE_SCANNER_VIEW_SOURCE = [
  'export { ExpoBarcodeScannerAdapter as ExpoBarcodeScannerView }',
  " from '@ankhorage/expo-runtime';",
  '\n',
] as const;

export function getExpoBarcodeScannerViewSource(): string {
  return EXPO_BARCODE_SCANNER_VIEW_SOURCE.join('');
}
