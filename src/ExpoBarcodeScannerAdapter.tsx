import { Permission, usePermission } from '@ankhorage/permissions';
import { BarcodeScannerView, type BarcodeScannerViewProps } from '@ankhorage/zora';
import { type BarcodeScanningResult, type BarcodeType, CameraView } from 'expo-camera';
import React from 'react';
import { StyleSheet } from 'react-native';

import {
  BARCODE_SCANNER_TYPES,
  type BarcodeScanRecord,
  mapPermissionStatusToCameraPermissionStatus,
  normalizeExpoBarcodeScanResult,
  shouldIgnoreBarcodeScan,
} from './barcodeScanRuntime';

const CAMERA_BARCODE_TYPES: BarcodeType[] = [...BARCODE_SCANNER_TYPES];

export function ExpoBarcodeScannerAdapter(props: BarcodeScannerViewProps) {
  const { onBarcodeScanned, onRequestPermission, ...viewProps } = props;
  const cameraPermission = usePermission(Permission.Camera);
  const [isRequestingPermission, setIsRequestingPermission] = React.useState(false);
  const lastScanRef = React.useRef<BarcodeScanRecord | null>(null);

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

  const handleBarcodeScanned = React.useCallback(
    (result: BarcodeScanningResult) => {
      void (async () => {
        const normalizedResult = normalizeExpoBarcodeScanResult(result);
        if (normalizedResult === null) {
          return;
        }

        const now = Date.now();
        if (shouldIgnoreBarcodeScan(lastScanRef.current, normalizedResult, now)) {
          return;
        }

        lastScanRef.current = {
          ...normalizedResult,
          timestamp: now,
        };
        await onBarcodeScanned?.(normalizedResult);
      })();
    },
    [onBarcodeScanned],
  );

  const camera =
    permissionStatus === 'granted' ? (
      <CameraView
        barcodeScannerSettings={{ barcodeTypes: CAMERA_BARCODE_TYPES }}
        onBarcodeScanned={handleBarcodeScanned}
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
