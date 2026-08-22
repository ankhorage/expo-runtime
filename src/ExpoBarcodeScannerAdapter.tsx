import { Permission, usePermission } from '@ankhorage/permissions';
import {
  BarcodeScannerView,
  type BarcodeScannerViewProps,
  type BarcodeScanResult,
} from '@ankhorage/zora';
import React from 'react';

import {
  type BarcodeScanRecord,
  createBarcodeScanHandler,
  type ExpoBarcodeScanResultLike,
  mapPermissionStatusToCameraPermissionStatus,
} from './barcodeScanRuntime';
import { ExpoBarcodeScannerCamera } from './ExpoBarcodeScannerCamera';

export interface ExpoBarcodeScannerDiagnostics {
  readonly onBarcodeDelivered?: (result: BarcodeScanResult) => void;
  readonly onBarcodeNormalized?: (result: BarcodeScanResult) => void;
  readonly onCameraReady?: () => void;
  readonly onMountError?: (error: Error) => void;
  readonly onRawBarcodeScanned?: (result: ExpoBarcodeScanResultLike) => void;
}

export interface ExpoBarcodeScannerAdapterProps extends BarcodeScannerViewProps {
  readonly diagnostics?: ExpoBarcodeScannerDiagnostics;
}

export function ExpoBarcodeScannerAdapter(props: ExpoBarcodeScannerAdapterProps) {
  const { diagnostics, onBarcodeScanned, onRequestPermission, ...viewProps } = props;
  const cameraPermission = usePermission(Permission.Camera);
  const [cameraError, setCameraError] = React.useState<Error | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = React.useState(false);
  const lastScanRef = React.useRef<BarcodeScanRecord | null>(null);

  const permissionStatus = mapPermissionStatusToCameraPermissionStatus(
    cameraPermission.status,
    isRequestingPermission,
  );

  const handleRequestPermission = React.useCallback(async () => {
    setCameraError(null);
    setIsRequestingPermission(true);
    try {
      await cameraPermission.request();
      await onRequestPermission?.();
    } finally {
      setIsRequestingPermission(false);
    }
  }, [cameraPermission, onRequestPermission]);

  const handleBarcodeScanned = React.useCallback(
    createBarcodeScanHandler({
      lastScanRef,
      onBarcodeDelivered: diagnostics?.onBarcodeDelivered,
      onBarcodeNormalized: diagnostics?.onBarcodeNormalized,
      onBarcodeScanned,
      onRawBarcodeScanned: diagnostics?.onRawBarcodeScanned,
    }),
    [diagnostics, onBarcodeScanned],
  );

  const handleMountError = React.useCallback(
    (error: Error) => {
      setCameraError(error);
      diagnostics?.onMountError?.(error);
    },
    [diagnostics],
  );

  const camera =
    permissionStatus === 'granted' && cameraError === null ? (
      <ExpoBarcodeScannerCamera
        onBarcodeScanned={handleBarcodeScanned}
        onCameraReady={diagnostics?.onCameraReady}
        onMountError={handleMountError}
      />
    ) : undefined;

  const effectivePermissionStatus = cameraError === null ? permissionStatus : 'denied';
  const deniedPermissionLabel =
    cameraError === null
      ? viewProps.deniedPermissionLabel
      : (viewProps.deniedPermissionLabel ??
        'Automatic barcode scanning is unavailable. Try again or enter the barcode manually.');

  return (
    <BarcodeScannerView
      {...viewProps}
      camera={camera}
      deniedPermissionLabel={deniedPermissionLabel}
      onRequestPermission={handleRequestPermission}
      permissionStatus={effectivePermissionStatus}
    />
  );
}
