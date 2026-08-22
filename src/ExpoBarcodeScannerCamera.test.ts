import { BarcodeFormat } from '@zxing/library';
import { describe, expect, it, mock } from 'bun:test';

import { BARCODE_SCANNER_TYPES } from './barcodeScanRuntime';
import {
  EXPO_BARCODE_SCANNER_IMPLEMENTATION as webImplementation,
  normalizeWebBarcodeScanResult,
  startWebBarcodeScanner,
} from './ExpoBarcodeScannerCamera.web';
import {
  createNativeBarcodeScannerCameraProps,
  NATIVE_BARCODE_SCANNER_TYPES,
} from './nativeBarcodeScannerCamera';

describe('Expo barcode scanner platform cameras', () => {
  it('selects distinct native and web implementations through platform files', async () => {
    const nativeModule = Bun.file(new URL('./ExpoBarcodeScannerCamera.tsx', import.meta.url));
    const webModule = Bun.file(new URL('./ExpoBarcodeScannerCamera.web.tsx', import.meta.url));

    expect(await nativeModule.exists()).toBe(true);
    expect(await webModule.exists()).toBe(true);
    expect(webImplementation).toBe('web');
  });

  it('configures the native Expo analyzer for retail barcodes and QR', () => {
    expect(BARCODE_SCANNER_TYPES).toContain('ean13');
    expect(BARCODE_SCANNER_TYPES).toContain('ean8');
    expect(BARCODE_SCANNER_TYPES).toContain('qr');
    expect(NATIVE_BARCODE_SCANNER_TYPES).toEqual(BARCODE_SCANNER_TYPES);
  });

  it('wires native Expo camera events and diagnostics to the adapter boundary', () => {
    const rawResults: unknown[] = [];
    const mountErrors: Error[] = [];
    const onCameraReady = mock(() => undefined);
    const cameraProps = createNativeBarcodeScannerCameraProps({
      onBarcodeScanned: (result) => rawResults.push(result),
      onCameraReady,
      onMountError: (error) => mountErrors.push(error),
    });
    const result = { data: '5901234123457', type: 'ean13' };

    cameraProps.onCameraReady();
    cameraProps.onBarcodeScanned(result);
    cameraProps.onMountError({ message: 'camera unavailable' });

    expect(onCameraReady).toHaveBeenCalledTimes(1);
    expect(rawResults).toEqual([result]);
    expect(mountErrors[0]?.message).toBe('camera unavailable');
  });

  it.each([
    ['5901234123457', 'EAN_13', 'ean13'],
    ['55123457', 'EAN_8', 'ean8'],
    ['https://ankhorage.com', 'QR_CODE', 'qr'],
  ] as const)(
    'maps web %s detections to the Expo-shaped adapter boundary',
    (value, format, type) => {
      expect(
        normalizeWebBarcodeScanResult({
          getBarcodeFormat: () => barcodeFormat(format),
          getText: () => value,
        }),
      ).toEqual({ data: value, type });
    },
  );

  it('wires continuous web detections into the shared scanner callback using one stream', async () => {
    const detected: unknown[] = [];
    let receivedConstraints: unknown;
    let receivedPreview: unknown;
    const controls = { stop: mock(() => undefined) };
    const result = {
      getBarcodeFormat: () => barcodeFormat('EAN_13'),
      getText: () => '5901234123457',
    };
    const reader = {
      decodeFromConstraints(
        constraints: unknown,
        preview: unknown,
        callback: (scanResult: typeof result | undefined) => void,
      ) {
        receivedConstraints = constraints;
        receivedPreview = preview;
        callback(result);
        return Promise.resolve(controls);
      },
    };
    const videoElement = {};

    const scannerControls = await startWebBarcodeScanner(
      reader as never,
      videoElement,
      (scanResult) => {
        detected.push(scanResult);
      },
    );

    expect(scannerControls).toBe(controls);
    expect(receivedConstraints).toEqual({
      audio: false,
      video: { facingMode: { ideal: 'environment' } },
    });
    expect(receivedPreview).toBe(videoElement);
    expect(detected).toEqual([{ data: '5901234123457', type: 'ean13' }]);
  });
});

function barcodeFormat(name: 'EAN_13' | 'EAN_8' | 'QR_CODE') {
  return BarcodeFormat[name];
}
