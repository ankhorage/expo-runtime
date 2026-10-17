import { Permission, usePermission } from '@ankhorage/permissions';
import { BarcodeScannerView, type BarcodeScannerViewProps } from '@ankhorage/zora';
import { type BarcodeType, CameraView, type CameraViewProps } from 'expo-camera';
import React from 'react';
import { StyleSheet } from 'react-native';

import {
  BARCODE_SCANNER_TYPES,
  mapPermissionStatusToCameraPermissionStatus,
} from './barcodeScanRuntime';

const CAMERA_BARCODE_TYPES: BarcodeType[] = [...BARCODE_SCANNER_TYPES];

export interface ExpoBarcodeScannerAdapterProps extends BarcodeScannerViewProps {
  readonly onBarcodeScanned?: CameraViewProps['onBarcodeScanned'];
}

/*** Renders the ZORA scanner surface with Expo Camera and its native scan callback. */
export function ExpoBarcodeScannerAdapter(props: ExpoBarcodeScannerAdapterProps) {
  const { onBarcodeScanned, onRequestPermission, ...viewProps } = props;
  const cameraPermission = usePermission(Permission.Camera);
  const [isRequestingPermission, setIsRequestingPermission] = React.useState(false);

  const permissionStatus = mapPermissionStatusToCameraPermissionStatus(
    cameraPermission.status,
    isRequestingPermission,
  );

  const handleRequestPermission = React.useCallback(async () => {
    setIsRequestingPermission(true);
    try {
      await cameraPermission.request();
      await onRequestPermission?.();
    } finally {
      setIsRequestingPermission(false);
    }
  }, [cameraPermission, onRequestPermission]);

  const camera =
    permissionStatus === 'granted' ? (
      <CameraView
        barcodeScannerSettings={{ barcodeTypes: CAMERA_BARCODE_TYPES }}
        onBarcodeScanned={onBarcodeScanned}
        style={styles.camera}
      />
    ) : undefined;

  return (
    <BarcodeScannerView
      {...viewProps}
      camera={camera}
      onRequestPermission={handleRequestPermission}
      permissionStatus={permissionStatus}
    />
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
});
