import type { BarcodeType } from 'expo-camera';

import { BARCODE_SCANNER_TYPES, type ExpoBarcodeScanResultLike } from './barcodeScanRuntime';

export const NATIVE_BARCODE_SCANNER_TYPES: readonly BarcodeType[] = [...BARCODE_SCANNER_TYPES];

export interface NativeBarcodeScannerCameraCallbacks {
  readonly onBarcodeScanned: (result: ExpoBarcodeScanResultLike) => void;
  readonly onCameraReady?: () => void;
  readonly onMountError?: (error: Error) => void;
}

export function createNativeBarcodeScannerCameraProps({
  onBarcodeScanned,
  onCameraReady,
  onMountError,
}: NativeBarcodeScannerCameraCallbacks) {
  return {
    barcodeScannerSettings: { barcodeTypes: [...NATIVE_BARCODE_SCANNER_TYPES] },
    onBarcodeScanned,
    onCameraReady,
    onMountError: (event: { readonly message: string }) => {
      onMountError?.(new Error(event.message));
    },
  };
}
