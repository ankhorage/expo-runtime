import type { PermissionStatus } from '@ankhorage/permissions';
import type { CameraPermissionStatus } from '@ankhorage/zora';
import type { BarcodeType } from 'expo-camera';

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

/*** Maps the Permissions owner status to ZORA's documented camera UI status. */
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
