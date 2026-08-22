import type { PermissionStatus } from '@ankhorage/permissions';
import type { BarcodeScanResult, CameraPermissionStatus } from '@ankhorage/zora';
import type { BarcodeType } from 'expo-camera';

export const BARCODE_SCAN_DEDUPE_WINDOW_MS = 1500;

export const BARCODE_SCANNER_TYPES = [
  'aztec',
  'codabar',
  'code39',
  'code93',
  'code128',
  'datamatrix',
  'ean13',
  'ean8',
  'itf14',
  'pdf417',
  'qr',
  'upc_a',
  'upc_e',
] as const satisfies readonly BarcodeType[];

export interface BarcodeScanRecord extends BarcodeScanResult {
  readonly timestamp: number;
}

export interface ExpoBarcodeScanResultLike {
  readonly data: string;
  readonly type?: string;
}

type ExpoBarcodeScanCallback = (result: BarcodeScanResult) => Promise<void> | void;

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

export async function dispatchExpoBarcodeScan(
  result: ExpoBarcodeScanResultLike,
  previous: BarcodeScanRecord | null,
  now: number,
  onBarcodeScanned: ExpoBarcodeScanCallback | undefined,
  onAccepted: (record: BarcodeScanRecord) => void,
): Promise<boolean> {
  const normalizedResult = normalizeExpoBarcodeScanResult(result);
  if (normalizedResult === null || shouldIgnoreBarcodeScan(previous, normalizedResult, now)) {
    return false;
  }

  const record = {
    ...normalizedResult,
    timestamp: now,
  };
  onAccepted(record);
  await onBarcodeScanned?.(normalizedResult);
  return true;
}
