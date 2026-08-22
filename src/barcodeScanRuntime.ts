import type { PermissionStatus } from '@ankhorage/permissions';
import type { BarcodeScanResult, CameraPermissionStatus } from '@ankhorage/zora';

export const BARCODE_SCAN_DEDUPE_WINDOW_MS = 1500;

export const BARCODE_SCANNER_TYPES = [
  'aztec',
  'code128',
  'code39',
  'code93',
  'datamatrix',
  'ean13',
  'ean8',
  'itf14',
  'pdf417',
  'qr',
  'upc_a',
  'upc_e',
] as const;

export interface BarcodeScanRecord extends BarcodeScanResult {
  readonly timestamp: number;
}

export interface BarcodeScanRecordRef {
  current: BarcodeScanRecord | null;
}

export interface ExpoBarcodeScanResultLike {
  readonly data: string;
  readonly type?: string;
}

export interface CreateBarcodeScanHandlerOptions {
  readonly lastScanRef: BarcodeScanRecordRef;
  readonly now?: () => number;
  readonly onBarcodeDelivered?: (result: BarcodeScanResult) => void;
  readonly onBarcodeNormalized?: (result: BarcodeScanResult) => void;
  readonly onBarcodeScanned?: (result: BarcodeScanResult) => void | Promise<void>;
  readonly onRawBarcodeScanned?: (result: ExpoBarcodeScanResultLike) => void;
}

export function createBarcodeScanHandler({
  lastScanRef,
  now = Date.now,
  onBarcodeDelivered,
  onBarcodeNormalized,
  onBarcodeScanned,
  onRawBarcodeScanned,
}: CreateBarcodeScanHandlerOptions): (result: ExpoBarcodeScanResultLike) => void {
  return (result) => {
    void (async () => {
      onRawBarcodeScanned?.(result);
      const normalizedResult = normalizeExpoBarcodeScanResult(result);
      if (normalizedResult === null) {
        return;
      }
      onBarcodeNormalized?.(normalizedResult);

      const timestamp = now();
      if (shouldIgnoreBarcodeScan(lastScanRef.current, normalizedResult, timestamp)) {
        return;
      }

      lastScanRef.current = {
        ...normalizedResult,
        timestamp,
      };
      await onBarcodeScanned?.(normalizedResult);
      onBarcodeDelivered?.(normalizedResult);
    })();
  };
}

export function mapPermissionStatusToCameraPermissionStatus(
  status: PermissionStatus,
  isRequestingPermission: boolean,
): CameraPermissionStatus {
  if (isRequestingPermission) {
    return 'requesting';
  }

  switch (status) {
    case 'granted':
      return 'granted';
    case 'unknown':
      return 'unknown';
    default:
      return 'denied';
  }
}

export function normalizeExpoBarcodeScanResult(
  result: ExpoBarcodeScanResultLike,
): BarcodeScanResult | null {
  const value = result.data.trim();
  if (value.length === 0) {
    return null;
  }

  const type = typeof result.type === 'string' && result.type.length > 0 ? result.type : undefined;

  return {
    value,
    type,
  };
}

export function shouldIgnoreBarcodeScan(
  previous: BarcodeScanRecord | null,
  next: BarcodeScanResult,
  now: number,
): boolean {
  if (previous === null) {
    return false;
  }

  return (
    previous.value === next.value &&
    previous.type === next.type &&
    now - previous.timestamp < BARCODE_SCAN_DEDUPE_WINDOW_MS
  );
}
