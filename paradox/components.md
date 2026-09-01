# Components

## ExpoBarcodeScannerAdapter

Source: `src/ExpoBarcodeScannerAdapter.tsx:16:1`

Export paths: `src/index.ts`

| Prop | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| camera | `React.ReactNode \| undefined` | no | — |  |
| children | `React.ReactNode \| undefined` | no | — |  |
| cornerLabel | `React.ReactNode \| undefined` | no | — |  |
| deniedPermissionLabel | `React.ReactNode \| undefined` | no | — |  |
| description | `React.ReactNode \| undefined` | no | — |  |
| interactionPolicy | `InteractionPolicy \| undefined` | no | — |  |
| manualEntryLabel | `React.ReactNode \| undefined` | no | — |  |
| mode | `ZoraThemeMode \| undefined` | no | — |  |
| onBarcodeScanned | `(result: BarcodeScanResult) => void \| Promise<void> \| undefined` | no | — |  |
| onManualEntry | `() => void \| Promise<void> \| undefined` | no | — |  |
| onRequestPermission | `() => void \| Promise<void> \| undefined` | no | — |  |
| overlayDescription | `React.ReactNode \| undefined` | no | — |  |
| overlayTitle | `React.ReactNode \| undefined` | no | — |  |
| permissionStatus | `CameraPermissionStatus` | yes | — |  |
| requestPermissionLabel | `React.ReactNode \| undefined` | no | — |  |
| testID | `string \| undefined` | no | — |  |
| themeId | `ZoraThemeId \| undefined` | no | — |  |
| title | `React.ReactNode \| undefined` | no | — |  |

## ExpoReaderSurfaceAdapter

Source: `src/reader/ExpoReaderSurfaceAdapter.tsx:16:1`

Export paths: `src/index.ts`

| Prop | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| appearanceLabel | `string \| undefined` | no | — |  |
| canGoNext | `boolean \| undefined` | no | — |  |
| canGoPrevious | `boolean \| undefined` | no | — |  |
| chapterLabel | `string \| undefined` | no | — |  |
| contentsLabel | `string \| undefined` | no | — |  |
| errorTitle | `string \| undefined` | no | — |  |
| fontScale | `number \| undefined` | no | — |  |
| footerActions | `React.ReactNode \| undefined` | no | — |  |
| format | `ReaderDocumentFormat` | yes | — |  |
| headerActions | `React.ReactNode \| undefined` | no | — |  |
| highlighted | `boolean \| undefined` | no | — |  |
| highlightLabel | `string \| undefined` | no | — |  |
| interactionPolicy | `InteractionPolicy \| undefined` | no | — |  |
| lineHeight | `ReaderLineHeight \| undefined` | no | — |  |
| loadingLabel | `string \| undefined` | no | — |  |
| location | `string \| undefined` | no | — |  |
| mode | `ZoraThemeMode \| undefined` | no | — |  |
| nextPageLabel | `string \| undefined` | no | — |  |
| onLocationChange | `(event: ReaderLocationChangeEvent) => void \| Promise<void> \| undefined` | no | — |  |
| onNextPage | `() => void \| Promise<void> \| undefined` | no | — |  |
| onOpenAppearance | `() => void \| Promise<void> \| undefined` | no | — |  |
| onOpenContents | `() => void \| Promise<void> \| undefined` | no | — |  |
| onOpenExternalLink | `(event: ReaderExternalLinkEvent) => void \| Promise<void> \| undefined` | no | — |  |
| onPreviousPage | `() => void \| Promise<void> \| undefined` | no | — |  |
| onReaderError | `(event: ReaderErrorEvent) => void \| Promise<void> \| undefined` | no | — |  |
| onToggleHighlight | `() => void \| Promise<void> \| undefined` | no | — |  |
| page | `number \| undefined` | no | — |  |
| pageCount | `number \| undefined` | no | — |  |
| pageLabel | `string \| undefined` | no | — |  |
| previousPageLabel | `string \| undefined` | no | — |  |
| progress | `number \| undefined` | no | — |  |
| readerColorScheme | `ReaderColorScheme \| undefined` | no | — |  |
| showChrome | `boolean \| undefined` | no | — |  |
| source | `ReaderResolvedSource \| null \| undefined` | no | — |  |
| status | `ReaderStatus \| undefined` | no | — |  |
| subtitle | `string \| undefined` | no | — |  |
| testID | `string \| undefined` | no | — |  |
| themeId | `ZoraThemeId \| undefined` | no | — |  |
| title | `string \| undefined` | no | — |  |
| unavailableTitle | `string \| undefined` | no | — |  |
| viewport | `React.ReactNode \| undefined` | no | — |  |

## ExpoRuntimeProviders

Source: `src/ExpoRuntimeProviders.tsx:13:1`

Export paths: `src/index.ts`

| Prop | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| children | `React.ReactNode \| undefined` | no | — |  |
| providers | `readonly ExpoRuntimeProviderId[] \| undefined` | no | — |  |

## ExpoZoraIconFontProvider

Source: `src/ExpoZoraIconFontProvider.tsx:7:1`

Export paths: `src/index.ts`

| Prop | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| children | `React.ReactNode \| undefined` | no | — |  |
