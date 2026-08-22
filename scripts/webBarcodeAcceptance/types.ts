export interface BarcodeAcceptanceScenario {
  readonly asset: string;
  readonly generator: string;
  readonly type: 'ean13' | 'ean8' | 'qr';
  readonly value: string;
}

interface CanonicalBarcodeResult {
  readonly type?: string;
  readonly value: string;
}

interface SyntheticCameraControl {
  readonly showBarcode: (url: string) => Promise<void>;
}

export interface BarcodeAcceptanceWindow extends Window {
  __ankhorageCameraFixture: SyntheticCameraControl;
  __ankhorageScans: CanonicalBarcodeResult[];
}
