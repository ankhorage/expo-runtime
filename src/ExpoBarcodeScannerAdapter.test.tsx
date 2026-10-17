import { describe, expect, it } from 'bun:test';
import type { CameraViewProps } from 'expo-camera';

import {
  BARCODE_SCANNER_TYPES,
  mapPermissionStatusToCameraPermissionStatus,
} from './barcodeScanRuntime';
import type { ExpoBarcodeScannerAdapterProps } from './ExpoBarcodeScannerAdapter';

describe('Expo barcode adapter configuration', () => {
  it('uses the Expo Camera callback and payload contract at the adapter boundary', () => {
    const callback: NonNullable<CameraViewProps['onBarcodeScanned']> = (result) => {
      expect(result).toEqual({ data: '4006381333931', type: 'ean13' });
    };
    const props: ExpoBarcodeScannerAdapterProps = {
      onBarcodeScanned: callback,
      permissionStatus: 'granted',
    };

    expect(props.onBarcodeScanned).toBe(callback);
  });

  it('maps permission states into the ZORA camera permission surface', () => {
    expect(mapPermissionStatusToCameraPermissionStatus('unknown', false)).toBe('unknown');
    expect(mapPermissionStatusToCameraPermissionStatus('granted', false)).toBe('granted');
    expect(mapPermissionStatusToCameraPermissionStatus('denied', false)).toBe('denied');
    expect(mapPermissionStatusToCameraPermissionStatus('blocked', true)).toBe('requesting');
  });

  it('configures the Expo camera for the capability-supported barcode formats', () => {
    expect(BARCODE_SCANNER_TYPES).toEqual([
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
    ]);
  });
});
