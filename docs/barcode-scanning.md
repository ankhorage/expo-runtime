# Barcode scanning platform contract

`ExpoBarcodeScannerAdapter` keeps the ZORA scanner surface camera-neutral and emits one canonical
result shape: `{ value: string, type?: string }`.

## Proven failure boundary

Expo SDK 54 / `expo-camera` 17.x starts its web QR worker only when the requested barcode formats
include `qr`. That worker does not decode EAN or UPC. A granted permission and a live web preview
therefore prove that the camera path is active, but cannot make Expo's web implementation emit an
EAN-13 or EAN-8 result.

The native path is separate. It continues to use `CameraView` and Expo's native barcode analyzer;
no native decoder defect has been proven in this repository. Use the optional adapter diagnostics
to record camera-ready, mount-error, raw-result, normalized-result, and delivered-result boundaries
when validating a real Android or iOS device.

## Web implementation choice

Web uses `@zxing/browser` with a single rear-facing camera stream and continuous decoding for
EAN-13, EAN-8, UPC-A, UPC-E, and QR. The browser `BarcodeDetector` API is not used as the only
implementation because it is experimental and is not available in some widely used browsers.
ZXing adds bundle weight, but supplies the required cross-browser decoder without a remote runtime
or a second camera stream.

If the camera or decoder cannot start, the adapter routes the existing ZORA permission/fallback
surface to an explanatory state. Consumers that provide `onManualEntry` retain a usable manual
barcode path.

## Acceptance notes

Automated tests cover native barcode configuration, shared normalization and dedupe, adapter
callback wiring, web result mapping, web camera constraints, and native/web module selection.
Optical acceptance still requires valid-checksum physical barcodes in the generated app. Do not
use `7612345678901`, which is not a valid EAN-13.
