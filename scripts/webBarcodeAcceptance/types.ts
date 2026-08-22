export interface BarcodeAcceptanceScenario {
  readonly asset: string;
  readonly generator: string;
  readonly type: 'ean13' | 'ean8' | 'qr';
  readonly value: string;
}

export interface BarcodeAcceptanceImage {
  readonly data: Uint8Array;
  readonly height: number;
  readonly width: number;
}

interface CanonicalBarcodeResult {
  readonly type?: string;
  readonly value: string;
}

export interface BarcodeAcceptanceWindow extends Window {
  __ankhorageScans: CanonicalBarcodeResult[];
}
