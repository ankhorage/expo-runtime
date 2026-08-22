import { describe, expect, it } from 'bun:test';

import {
  BARCODE_SCAN_DEDUPE_WINDOW_MS,
  BARCODE_SCANNER_TYPES,
  dispatchExpoBarcodeScan,
  mapPermissionStatusToCameraPermissionStatus,
  normalizeExpoBarcodeScanResult,
  shouldIgnoreBarcodeScan,
} from './barcodeScanRuntime';

describe('Expo barcode event helpers', () => {
  it('normalizes Expo barcode scan payloads for the runtime event pipeline', () => {
    expect(
      normalizeExpoBarcodeScanResult({
        data: ' 0123456789 ',
        type: 'ean13',
      }),
    ).toEqual({
      value: '0123456789',
      type: 'ean13',
    });
  });

  it('drops empty scan payloads', () => {
    expect(
      normalizeExpoBarcodeScanResult({
        data: '   ',
        type: 'qr',
      }),
    ).toBeNull();
  });
});

describe('Expo barcode event deduplication', () => {
  it('suppresses repeated scans inside the dedupe window', () => {
    expect(
      shouldIgnoreBarcodeScan(
        {
          value: '0123456789',
          type: 'ean13',
          timestamp: 1_000,
        },
        {
          value: '0123456789',
          type: 'ean13',
        },
        1_000 + BARCODE_SCAN_DEDUPE_WINDOW_MS - 1,
      ),
    ).toBe(true);
    expect(
      shouldIgnoreBarcodeScan(
        {
          value: '0123456789',
          type: 'ean13',
          timestamp: 1_000,
        },
        {
          value: '0123456789',
          type: 'ean13',
        },
        1_000 + BARCODE_SCAN_DEDUPE_WINDOW_MS,
      ),
    ).toBe(false);
  });
});

describe('Expo barcode adapter configuration', () => {
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

  it.each([
    ['qr', 'https://ankhorage.dev'],
    ['ean13', '4006381333931'],
    ['ean8', '96385074'],
  ])('normalizes and forwards an accepted %s event', async (type, data) => {
    const forwarded: { value: string; type?: string }[] = [];
    let acceptedRecord: { value: string; type?: string; timestamp: number } | undefined;

    expect(
      await dispatchExpoBarcodeScan(
        { data, type },
        null,
        1_000,
        (result) => {
          forwarded.push(result);
        },
        (record) => {
          acceptedRecord = record;
        },
      ),
    ).toBe(true);
    expect(forwarded).toEqual([{ value: data, type }]);
    expect(acceptedRecord).toEqual({ value: data, type, timestamp: 1_000 });
  });
});
