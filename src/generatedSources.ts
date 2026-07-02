const EXPO_BARCODE_SCANNER_VIEW_SOURCE =
  "export { ExpoBarcodeScannerAdapter as ExpoBarcodeScannerView } from '@ankhorage/expo-runtime';\n";

export function getExpoBarcodeScannerViewSource(): string {
  return EXPO_BARCODE_SCANNER_VIEW_SOURCE;
}
