# Components

## ExpoBarcodeScannerAdapter

Source: `src/ExpoBarcodeScannerAdapter.tsx:17:1`

Export paths: `src/index.ts`

| Prop                   | Type                                                                | Required | Default | Description |
| ---------------------- | ------------------------------------------------------------------- | -------- | ------- | ----------- |
| camera                 | `React.ReactNode \| undefined`                                      | no       | —       |             |
| children               | `React.ReactNode \| undefined`                                      | no       | —       |             |
| cornerLabel            | `React.ReactNode \| undefined`                                      | no       | —       |             |
| deniedPermissionLabel  | `React.ReactNode \| undefined`                                      | no       | —       |             |
| description            | `React.ReactNode \| undefined`                                      | no       | —       |             |
| manualEntryLabel       | `React.ReactNode \| undefined`                                      | no       | —       |             |
| mode                   | `ZoraThemeMode \| undefined`                                        | no       | —       |             |
| onBarcodeScanned       | `(result: BarcodeScanResult) => void \| Promise<void> \| undefined` | no       | —       |             |
| onManualEntry          | `() => void \| Promise<void> \| undefined`                          | no       | —       |             |
| onRequestPermission    | `() => void \| Promise<void> \| undefined`                          | no       | —       |             |
| overlayDescription     | `React.ReactNode \| undefined`                                      | no       | —       |             |
| overlayTitle           | `React.ReactNode \| undefined`                                      | no       | —       |             |
| permissionStatus       | `CameraPermissionStatus`                                            | yes      | —       |             |
| requestPermissionLabel | `React.ReactNode \| undefined`                                      | no       | —       |             |
| testID                 | `string \| undefined`                                               | no       | —       |             |
| themeId                | `ZoraThemeId \| undefined`                                          | no       | —       |             |
| title                  | `React.ReactNode \| undefined`                                      | no       | —       |             |

## ExpoRuntimeProviders

Source: `src/ExpoRuntimeProviders.tsx:13:1`

Export paths: `src/index.ts`

| Prop      | Type                                            | Required | Default | Description |
| --------- | ----------------------------------------------- | -------- | ------- | ----------- |
| children  | `React.ReactNode \| undefined`                  | no       | —       |             |
| providers | `readonly ExpoRuntimeProviderId[] \| undefined` | no       | —       |             |
