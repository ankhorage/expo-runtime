import { describe, expect, it } from 'bun:test';

import {
  BARCODE_SCAN_DEDUPE_WINDOW_MS,
  BARCODE_SCANNER_TYPES,
  createBarcodeScanHandler,
  mapPermissionStatusToCameraPermissionStatus,
  normalizeExpoBarcodeScanResult,
  shouldIgnoreBarcodeScan,
} from './barcodeScanRuntime';

describe('ExpoBarcodeScannerAdapter helpers', () => {
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

  it('maps permission states into the ZORA camera permission surface', () => {
    expect(mapPermissionStatusToCameraPermissionStatus('unknown', false)).toBe('unknown');
    expect(mapPermissionStatusToCameraPermissionStatus('granted', false)).toBe('granted');
    expect(mapPermissionStatusToCameraPermissionStatus('denied', false)).toBe('denied');
    expect(mapPermissionStatusToCameraPermissionStatus('blocked', true)).toBe('requesting');
  });

  it('keeps the exported scanner barcode type allowlist intact', () => {
    expect(BARCODE_SCANNER_TYPES).toContain('qr');
    expect(BARCODE_SCANNER_TYPES).toContain('ean13');
    expect(BARCODE_SCANNER_TYPES).toContain('ean8');
  });

  it('wires raw platform events to the canonical callback with normalization and dedupe', async () => {
    const delivered: unknown[] = [];
    const normalized: unknown[] = [];
    const raw: unknown[] = [];
    const scanned: unknown[] = [];
    const lastScanRef = { current: null };
    const handleBarcodeScanned = createBarcodeScanHandler({
      lastScanRef,
      now: () => 1_000,
      onBarcodeDelivered: (result) => delivered.push(result),
      onBarcodeNormalized: (result) => normalized.push(result),
      onBarcodeScanned: (result) => {
        scanned.push(result);
      },
      onRawBarcodeScanned: (result) => raw.push(result),
    });

    handleBarcodeScanned({ data: ' 5901234123457 ', type: 'ean13' });
    handleBarcodeScanned({ data: ' 5901234123457 ', type: 'ean13' });
    handleBarcodeScanned({ data: '   ', type: 'ean8' });
    await Promise.resolve();

    const canonicalResult = { value: '5901234123457', type: 'ean13' };
    expect(raw).toHaveLength(3);
    expect(normalized).toEqual([canonicalResult, canonicalResult]);
    expect(scanned).toEqual([canonicalResult]);
    expect(delivered).toEqual([canonicalResult]);
  });
});
