import { CameraView } from 'expo-camera';
import { StyleSheet } from 'react-native';

import type { ExpoBarcodeScanResultLike } from './barcodeScanRuntime';
import { createNativeBarcodeScannerCameraProps } from './nativeBarcodeScannerCamera';

export const EXPO_BARCODE_SCANNER_IMPLEMENTATION = 'native' as const;

export interface ExpoBarcodeScannerCameraProps {
  readonly onBarcodeScanned: (result: ExpoBarcodeScanResultLike) => void;
  readonly onCameraReady?: () => void;
  readonly onMountError?: (error: Error) => void;
}

export function ExpoBarcodeScannerCamera({
  onBarcodeScanned,
  onCameraReady,
  onMountError,
}: ExpoBarcodeScannerCameraProps) {
  const cameraProps = createNativeBarcodeScannerCameraProps({
    onBarcodeScanned,
    onCameraReady,
    onMountError,
  });

  return <CameraView {...cameraProps} style={styles.camera} />;
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
});
