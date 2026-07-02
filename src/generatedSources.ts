const GENERATED_SOURCE_QUOTE = '\u0027';
const EXPO_BARCODE_SCANNER_VIEW_SOURCE = [
  'export { ExpoBarcodeScannerAdapter as ExpoBarcodeScannerView }',
  ' from ',
  GENERATED_SOURCE_QUOTE,
  '@ankhorage/expo-runtime',
  GENERATED_SOURCE_QUOTE,
  ';',
  '\n',
] as const;

export function getExpoBarcodeScannerViewSource(): string {
  return EXPO_BARCODE_SCANNER_VIEW_SOURCE.join('');
}
