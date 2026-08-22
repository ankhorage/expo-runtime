import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType, type Result } from '@zxing/library';
import React from 'react';

import type { ExpoBarcodeScanResultLike } from './barcodeScanRuntime';
import type { ExpoBarcodeScannerCameraProps } from './ExpoBarcodeScannerCamera';

export const EXPO_BARCODE_SCANNER_IMPLEMENTATION = 'web' as const;

const WEB_BARCODE_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.QR_CODE,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
] as const;

const WEB_BARCODE_TYPE_BY_FORMAT: Readonly<Partial<Record<BarcodeFormat, string>>> = {
  [BarcodeFormat.EAN_13]: 'ean13',
  [BarcodeFormat.EAN_8]: 'ean8',
  [BarcodeFormat.QR_CODE]: 'qr',
  [BarcodeFormat.UPC_A]: 'upc_a',
  [BarcodeFormat.UPC_E]: 'upc_e',
};

interface WebVideoElementLike {
  readonly srcObject?: unknown;
}

interface WebBarcodeReaderLike {
  decodeFromConstraints(
    constraints: Parameters<BrowserMultiFormatReader['decodeFromConstraints']>[0],
    previewElement: Parameters<BrowserMultiFormatReader['decodeFromConstraints']>[1],
    callback: (result: Result | undefined) => void,
  ): Promise<IScannerControls>;
}

export interface WebBarcodeScanResultLike {
  readonly getBarcodeFormat: () => BarcodeFormat;
  readonly getText: () => string;
}

export function normalizeWebBarcodeScanResult(
  result: WebBarcodeScanResultLike,
): ExpoBarcodeScanResultLike {
  const format = result.getBarcodeFormat();

  return {
    data: result.getText(),
    type: WEB_BARCODE_TYPE_BY_FORMAT[format] ?? BarcodeFormat[format].toLowerCase(),
  };
}

export async function startWebBarcodeScanner(
  reader: WebBarcodeReaderLike,
  videoElement: WebVideoElementLike,
  onBarcodeScanned: (result: ExpoBarcodeScanResultLike) => void,
): Promise<IScannerControls> {
  return reader.decodeFromConstraints(
    {
      audio: false,
      video: { facingMode: { ideal: 'environment' } },
    },
    videoElement as Parameters<BrowserMultiFormatReader['decodeFromConstraints']>[1],
    (result: Result | undefined) => {
      if (result !== undefined) {
        onBarcodeScanned(normalizeWebBarcodeScanResult(result));
      }
    },
  );
}

export function ExpoBarcodeScannerCamera({
  onBarcodeScanned,
  onCameraReady,
  onMountError,
}: ExpoBarcodeScannerCameraProps) {
  const [videoElement, setVideoElement] = React.useState<WebVideoElementLike | null>(null);

  React.useEffect(() => {
    if (videoElement === null) {
      return;
    }

    const hints = new Map<DecodeHintType, unknown>([
      [DecodeHintType.POSSIBLE_FORMATS, WEB_BARCODE_FORMATS],
    ]);
    const reader = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 250,
      delayBetweenScanSuccess: 250,
    });
    let controls: IScannerControls | undefined;
    let isDisposed = false;

    void startWebBarcodeScanner(reader, videoElement, onBarcodeScanned)
      .then((scannerControls) => {
        if (isDisposed) {
          scannerControls.stop();
          return;
        }

        controls = scannerControls;
        onCameraReady?.();
      })
      .catch((error: unknown) => {
        if (!isDisposed) {
          onMountError?.(toError(error));
        }
      });

    return () => {
      isDisposed = true;
      controls?.stop();
    };
  }, [onBarcodeScanned, onCameraReady, onMountError, videoElement]);

  return React.createElement('video', {
    autoPlay: true,
    muted: true,
    playsInline: true,
    ref: setVideoElement,
    style: {
      height: '100%',
      objectFit: 'cover',
      width: '100%',
    },
  });
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
