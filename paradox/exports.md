# Public API

## BARCODE_SCAN_DEDUPE_WINDOW_MS

Kind: `value`
Module: `src/barcodeScanRuntime.ts`
Source: `src/barcodeScanRuntime.ts:4:14`

## BARCODE_SCANNER_TYPES

Kind: `value`
Module: `src/barcodeScanRuntime.ts`
Source: `src/barcodeScanRuntime.ts:6:14`

## BarcodeScanRecord

Kind: `type`
Module: `src/barcodeScanRuntime.ts`
Source: `src/barcodeScanRuntime.ts:21:1`

### Members

| Name      | Kind     | Type                  | Required | Description |
| --------- | -------- | --------------------- | -------- | ----------- |
| timestamp | property | `number`              | yes      |             |
| type      | property | `string \| undefined` | no       |             |
| value     | property | `string`              | yes      |             |

## BarcodeScanRecordRef

Kind: `type`
Module: `src/barcodeScanRuntime.ts`
Source: `src/barcodeScanRuntime.ts:25:1`

### Members

| Name    | Kind     | Type                        | Required | Description |
| ------- | -------- | --------------------------- | -------- | ----------- |
| current | property | `BarcodeScanRecord \| null` | yes      |             |

## ComponentRegistry

Kind: `unknown`
Module: `src/componentRegistry.ts`
Source: `src/componentRegistry.ts:3:1`

## createBarcodeScanHandler

Kind: `function`
Module: `src/barcodeScanRuntime.ts`
Source: `src/barcodeScanRuntime.ts:43:1`

### Signatures

- `({
  lastScanRef,
  now = Date.now,
  onBarcodeDelivered,
  onBarcodeNormalized,
  onBarcodeScanned,
  onRawBarcodeScanned,
}: CreateBarcodeScanHandlerOptions) => (result: ExpoBarcodeScanResultLike) => void`
  - {
    lastScanRef,
    now = Date.now,
    onBarcodeDelivered,
    onBarcodeNormalized,
    onBarcodeScanned,
    onRawBarcodeScanned,
    }: `CreateBarcodeScanHandlerOptions`
  - returns: `(result: ExpoBarcodeScanResultLike) => void`

## CreateBarcodeScanHandlerOptions

Kind: `type`
Module: `src/barcodeScanRuntime.ts`
Source: `src/barcodeScanRuntime.ts:34:1`

### Members

| Name                | Kind     | Type                                                                  | Required | Description |
| ------------------- | -------- | --------------------------------------------------------------------- | -------- | ----------- |
| lastScanRef         | property | `BarcodeScanRecordRef`                                                | yes      |             |
| now                 | property | `(() => number) \| undefined`                                         | no       |             |
| onBarcodeDelivered  | property | `((result: BarcodeScanResult) => void) \| undefined`                  | no       |             |
| onBarcodeNormalized | property | `((result: BarcodeScanResult) => void) \| undefined`                  | no       |             |
| onBarcodeScanned    | property | `((result: BarcodeScanResult) => void \| Promise<void>) \| undefined` | no       |             |
| onRawBarcodeScanned | property | `((result: ExpoBarcodeScanResultLike) => void) \| undefined`          | no       |             |

## createComponentRegistry

Kind: `function`
Module: `src/componentRegistry.ts`
Source: `src/componentRegistry.ts:5:1`

### Signatures

- `(registries?: readonly ComponentRegistry[]) => ComponentRegistry`
  - registries: `readonly ComponentRegistry[]` (optional)
  - returns: `ComponentRegistry`

## createExpoBundledMediaResolver

Kind: `function`
Module: `src/bundledMediaResolver.ts`
Source: `src/bundledMediaResolver.ts:15:1`

### Signatures

- `(registry: Readonly<Record<string, ExpoBundledMediaValue>>) => ExpoBundledMediaResolver`
  - registry: `Readonly<Record<string, ExpoBundledMediaValue>>`
  - returns: `ExpoBundledMediaResolver`

## createExpoRuntimeRegistry

Kind: `function`
Module: `src/createExpoRuntimeRegistry.tsx`
Source: `src/createExpoRuntimeRegistry.tsx:11:1`

### Signatures

- `(baseRegistry: ComponentRegistry) => ComponentRegistry`
  - baseRegistry: `ComponentRegistry`
  - returns: `ComponentRegistry`

## executeExpoRuntimeAction

Kind: `function`
Module: `src/expoActionBridge.ts`
Source: `src/expoActionBridge.ts:66:1`

### Signatures

- `(args: ExecuteExpoRuntimeActionArgs) => Promise<void>`
  - args: `ExecuteExpoRuntimeActionArgs`
  - returns: `Promise<void>`

## ExecuteExpoRuntimeActionArgs

Kind: `type`
Module: `src/expoActionBridge.ts`
Source: `src/expoActionBridge.ts:18:1`

### Members

| Name                      | Kind     | Type                                                      | Required | Description |
| ------------------------- | -------- | --------------------------------------------------------- | -------- | ----------- |
| action                    | property | `unknown`                                                 | yes      |             |
| actionHandlers            | property | `ExpoRuntimeActionHandlers \| undefined`                  | no       |             |
| alertImpl                 | property | `((message: string) => void) \| undefined`                | no       |             |
| consoleImpl               | property | `Pick<Console, "log"> \| undefined`                       | no       |             |
| mode                      | property | `ExpoRuntimeThemeMode`                                    | yes      |             |
| requestAnimationFrameImpl | property | `((callback: () => void) => number \| void) \| undefined` | no       |             |
| router                    | property | `ExpoRuntimeRouterLike`                                   | yes      |             |
| setMode                   | property | `(mode: ExpoRuntimeThemeMode) => void`                    | yes      |             |

## ExpoBarcodeScannerAdapter

Kind: `function`
Module: `src/ExpoBarcodeScannerAdapter.tsx`
Source: `src/ExpoBarcodeScannerAdapter.tsx:29:1`

### Signatures

- `(props: ExpoBarcodeScannerAdapterProps) => React.JSX.Element`
  - props: `ExpoBarcodeScannerAdapterProps`
  - returns: `React.JSX.Element`

## ExpoBarcodeScannerAdapterProps

Kind: `type`
Module: `src/ExpoBarcodeScannerAdapter.tsx`
Source: `src/ExpoBarcodeScannerAdapter.tsx:25:1`

### Members

| Name                   | Kind     | Type                                                                  | Required | Description |
| ---------------------- | -------- | --------------------------------------------------------------------- | -------- | ----------- |
| camera                 | property | `React.ReactNode`                                                     | no       |             |
| children               | property | `React.ReactNode`                                                     | no       |             |
| cornerLabel            | property | `React.ReactNode`                                                     | no       |             |
| deniedPermissionLabel  | property | `React.ReactNode`                                                     | no       |             |
| description            | property | `React.ReactNode`                                                     | no       |             |
| diagnostics            | property | `ExpoBarcodeScannerDiagnostics \| undefined`                          | no       |             |
| manualEntryLabel       | property | `React.ReactNode`                                                     | no       |             |
| mode                   | property | `ZoraThemeMode \| undefined`                                          | no       |             |
| onBarcodeScanned       | property | `((result: BarcodeScanResult) => void \| Promise<void>) \| undefined` | no       |             |
| onManualEntry          | property | `(() => void \| Promise<void>) \| undefined`                          | no       |             |
| onRequestPermission    | property | `(() => void \| Promise<void>) \| undefined`                          | no       |             |
| overlayDescription     | property | `React.ReactNode`                                                     | no       |             |
| overlayTitle           | property | `React.ReactNode`                                                     | no       |             |
| permissionStatus       | property | `CameraPermissionStatus`                                              | yes      |             |
| requestPermissionLabel | property | `React.ReactNode`                                                     | no       |             |
| testID                 | property | `string \| undefined`                                                 | no       |             |
| themeId                | property | `string \| undefined`                                                 | no       |             |
| title                  | property | `React.ReactNode`                                                     | no       |             |

## ExpoBarcodeScannerDiagnostics

Kind: `type`
Module: `src/ExpoBarcodeScannerAdapter.tsx`
Source: `src/ExpoBarcodeScannerAdapter.tsx:17:1`

### Members

| Name                | Kind     | Type                                                         | Required | Description |
| ------------------- | -------- | ------------------------------------------------------------ | -------- | ----------- |
| onBarcodeDelivered  | property | `((result: BarcodeScanResult) => void) \| undefined`         | no       |             |
| onBarcodeNormalized | property | `((result: BarcodeScanResult) => void) \| undefined`         | no       |             |
| onCameraReady       | property | `(() => void) \| undefined`                                  | no       |             |
| onMountError        | property | `((error: Error) => void) \| undefined`                      | no       |             |
| onRawBarcodeScanned | property | `((result: ExpoBarcodeScanResultLike) => void) \| undefined` | no       |             |

## ExpoBarcodeScanResultLike

Kind: `type`
Module: `src/barcodeScanRuntime.ts`
Source: `src/barcodeScanRuntime.ts:29:1`

### Members

| Name | Kind     | Type                  | Required | Description |
| ---- | -------- | --------------------- | -------- | ----------- |
| data | property | `string`              | yes      |             |
| type | property | `string \| undefined` | no       |             |

## ExpoBundledMediaRegistry

Kind: `unknown`
Module: `src/bundledMediaResolver.ts`
Source: `src/bundledMediaResolver.ts:5:1`

## ExpoBundledMediaRegistrySourceEntry

Kind: `type`
Module: `src/bundledMediaRegistrySource.ts`
Source: `src/bundledMediaRegistrySource.ts:1:1`

### Members

| Name        | Kind     | Type     | Required | Description |
| ----------- | -------- | -------- | -------- | ----------- |
| path        | property | `string` | yes      |             |
| requirePath | property | `string` | yes      |             |

## ExpoBundledMediaResolver

Kind: `unknown`
Module: `src/bundledMediaResolver.ts`
Source: `src/bundledMediaResolver.ts:11:1`

## ExpoBundledMediaResolverArgs

Kind: `type`
Module: `src/bundledMediaResolver.ts`
Source: `src/bundledMediaResolver.ts:7:1`

### Members

| Name  | Kind     | Type         | Required | Description |
| ----- | -------- | ------------ | -------- | ----------- |
| asset | property | `MediaAsset` | yes      |             |

## ExpoBundledMediaValue

Kind: `unknown`
Module: `src/bundledMediaResolver.ts`
Source: `src/bundledMediaResolver.ts:3:1`

## ExpoRuntimeActionHandlerArgs

Kind: `type`
Module: `src/expoActionBridge.ts`
Source: `src/expoActionBridge.ts:9:1`

### Members

| Name   | Kind     | Type     | Required | Description |
| ------ | -------- | -------- | -------- | ----------- |
| action | property | `Action` | yes      |             |

## ExpoRuntimeActionHandlers

Kind: `unknown`
Module: `src/expoActionBridge.ts`
Source: `src/expoActionBridge.ts:13:1`

## ExpoRuntimeAdapterId

Kind: `unknown`
Module: `src/resolveExpoRuntimePlan.ts`
Source: `src/resolveExpoRuntimePlan.ts:37:1`

## ExpoRuntimeConfigPluginOutput

Kind: `unknown`
Module: `src/generatedAppOutput.ts`
Source: `src/generatedAppOutput.ts:9:1`

## ExpoRuntimeDependencyMap

Kind: `unknown`
Module: `src/generatedAppOutput.ts`
Source: `src/generatedAppOutput.ts:7:1`

## ExpoRuntimeGeneratedAppOutputPlan

Kind: `type`
Module: `src/generatedAppOutput.ts`
Source: `src/generatedAppOutput.ts:18:1`

### Members

| Name              | Kind     | Type                               | Required | Description |
| ----------------- | -------- | ---------------------------------- | -------- | ----------- |
| dependencies      | property | `Readonly<Record<string, string>>` | yes      |             |
| layoutIntegration | property | `ExpoRuntimeLayoutIntegrationPlan` | yes      |             |
| native            | property | `ExpoRuntimeNativeOutputPlan`      | yes      |             |

## ExpoRuntimeLayoutIntegrationPlan

Kind: `type`
Module: `src/layoutIntegrationPlanning.ts`
Source: `src/layoutIntegrationPlanning.ts:3:1`

### Members

| Name               | Kind     | Type                | Required | Description |
| ------------------ | -------- | ------------------- | -------- | ----------- |
| imports            | property | `readonly string[]` | yes      |             |
| moduleDeclarations | property | `readonly string[]` | yes      |             |
| providerEnd        | property | `readonly string[]` | yes      |             |
| providerStart      | property | `readonly string[]` | yes      |             |

## ExpoRuntimeNativeOutputPlan

Kind: `type`
Module: `src/generatedAppOutput.ts`
Source: `src/generatedAppOutput.ts:13:1`

### Members

| Name               | Kind     | Type                                       | Required | Description |
| ------------------ | -------- | ------------------------------------------ | -------- | ----------- |
| androidPermissions | property | `readonly string[]`                        | yes      |             |
| configPlugins      | property | `readonly ExpoRuntimeConfigPluginOutput[]` | yes      |             |

## ExpoRuntimePlan

Kind: `type`
Module: `src/resolveExpoRuntimePlan.ts`
Source: `src/resolveExpoRuntimePlan.ts:47:1`

### Members

| Name                     | Kind     | Type                                                                                                                                                 | Required | Description |
| ------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| capabilities             | property | `readonly ScreenCapabilityRequirement[]`                                                                                                             | yes      |             |
| dependencies             | property | `readonly ExpoRuntimeDependency[]`                                                                                                                   | yes      |             |
| diagnostics              | property | `readonly ExpoRuntimeDiagnostic[]`                                                                                                                   | yes      |             |
| impliedPermissions       | property | `readonly ScreenPermissionRequirement[]`                                                                                                             | yes      |             |
| nativeConfig             | property | `{ readonly androidPermissions: readonly string[]; readonly configHints: readonly string[]; readonly plugins: readonly ExpoRuntimeConfigPlugin[]; }` | yes      |             |
| needsPermissionsProvider | property | `boolean`                                                                                                                                            | yes      |             |
| permissions              | property | `readonly ScreenPermissionRequirement[]`                                                                                                             | yes      |             |
| providers                | property | `readonly "permissions"[]`                                                                                                                           | yes      |             |
| runtimeAdapters          | property | `readonly "ExpoBarcodeScannerAdapter"[]`                                                                                                             | yes      |             |
| usesExpoRuntimeRegistry  | property | `boolean`                                                                                                                                            | yes      |             |

## ExpoRuntimeProviderId

Kind: `unknown`
Module: `src/resolveExpoRuntimePlan.ts`
Source: `src/resolveExpoRuntimePlan.ts:36:1`

## ExpoRuntimeProviders

Kind: `function`
Module: `src/ExpoRuntimeProviders.tsx`
Source: `src/ExpoRuntimeProviders.tsx:13:1`

### Signatures

- `(props: ExpoRuntimeProvidersProps) => React.JSX.Element`
  - props: `ExpoRuntimeProvidersProps`
  - returns: `React.JSX.Element`

## ExpoRuntimeProvidersProps

Kind: `type`
Module: `src/ExpoRuntimeProviders.tsx`
Source: `src/ExpoRuntimeProviders.tsx:8:1`

### Members

| Name      | Kind     | Type                                    | Required | Description |
| --------- | -------- | --------------------------------------- | -------- | ----------- |
| children  | property | `React.ReactNode`                       | yes      |             |
| providers | property | `readonly "permissions"[] \| undefined` | no       |             |

## ExpoRuntimeRouteResolution

Kind: `type`
Module: `src/expoActionBridge.ts`
Source: `src/expoActionBridge.ts:29:1`

### Members

| Name         | Kind     | Type                               | Required | Description |
| ------------ | -------- | ---------------------------------- | -------- | ----------- |
| resolvedPath | property | `string`                           | yes      |             |
| unusedParams | property | `Record<string, string \| number>` | yes      |             |

## ExpoRuntimeRouterLike

Kind: `type`
Module: `src/expoActionBridge.ts`
Source: `src/expoActionBridge.ts:5:1`

### Members

| Name | Kind     | Type                                                                              | Required | Description |
| ---- | -------- | --------------------------------------------------------------------------------- | -------- | ----------- |
| push | property | `(args: { pathname: string; params: Record<string, number \| string>; }) => void` | yes      |             |

## ExpoRuntimeThemeMode

Kind: `unknown`
Module: `src/expoActionBridge.ts`
Source: `src/expoActionBridge.ts:3:1`

## getExpoBarcodeScannerViewSource

Kind: `function`
Module: `src/generatedSources.ts`
Source: `src/generatedSources.ts:7:1`

### Signatures

- `() => string`
  - returns: `string`

## getExpoBundledMediaRegistrySource

Kind: `function`
Module: `src/bundledMediaRegistrySource.ts`
Source: `src/bundledMediaRegistrySource.ts:6:1`

### Signatures

- `(entries: readonly ExpoBundledMediaRegistrySourceEntry[]) => string`
  - entries: `readonly ExpoBundledMediaRegistrySourceEntry[]`
  - returns: `string`

## mapPermissionStatusToCameraPermissionStatus

Kind: `function`
Module: `src/barcodeScanRuntime.ts`
Source: `src/barcodeScanRuntime.ts:75:1`

### Signatures

- `(status: PermissionStatus, isRequestingPermission: boolean) => CameraPermissionStatus`
  - isRequestingPermission: `boolean`
  - status: `PermissionStatus`
  - returns: `CameraPermissionStatus`

## normalizeExpoBarcodeScanResult

Kind: `function`
Module: `src/barcodeScanRuntime.ts`
Source: `src/barcodeScanRuntime.ts:93:1`

### Signatures

- `(result: ExpoBarcodeScanResultLike) => BarcodeScanResult | null`
  - result: `ExpoBarcodeScanResultLike`
  - returns: `BarcodeScanResult | null`

## resolveExpoBundledMediaAsset

Kind: `function`
Module: `src/bundledMediaResolver.ts`
Source: `src/bundledMediaResolver.ts:21:1`

### Signatures

- `(registry: Readonly<Record<string, ExpoBundledMediaValue>>, asset: MediaAsset) => ExpoBundledMediaValue | null`
  - asset: `MediaAsset`
  - registry: `Readonly<Record<string, ExpoBundledMediaValue>>`
  - returns: `ExpoBundledMediaValue | null`

## resolveExpoRuntimeConfigPluginOutput

Kind: `function`
Module: `src/generatedAppOutput.ts`
Source: `src/generatedAppOutput.ts:32:1`

### Signatures

- `(runtimePlan: ExpoRuntimePlan | undefined) => readonly ExpoRuntimeConfigPluginOutput[]`
  - runtimePlan: `ExpoRuntimePlan | undefined`
  - returns: `readonly ExpoRuntimeConfigPluginOutput[]`

## resolveExpoRuntimeDependencyMap

Kind: `function`
Module: `src/generatedAppOutput.ts`
Source: `src/generatedAppOutput.ts:24:1`

### Signatures

- `(runtimePlan: ExpoRuntimePlan | undefined) => Readonly<Record<string, string>>`
  - runtimePlan: `ExpoRuntimePlan | undefined`
  - returns: `Readonly<Record<string, string>>`

## resolveExpoRuntimeGeneratedAppOutput

Kind: `function`
Module: `src/generatedAppOutput.ts`
Source: `src/generatedAppOutput.ts:49:1`

### Signatures

- `(runtimePlan: ExpoRuntimePlan | undefined) => ExpoRuntimeGeneratedAppOutputPlan`
  - runtimePlan: `ExpoRuntimePlan | undefined`
  - returns: `ExpoRuntimeGeneratedAppOutputPlan`

## resolveExpoRuntimeLayoutIntegration

Kind: `function`
Module: `src/layoutIntegrationPlanning.ts`
Source: `src/layoutIntegrationPlanning.ts:10:1`

### Signatures

- `(runtimePlan: ExpoRuntimePlan | undefined) => ExpoRuntimeLayoutIntegrationPlan`
  - runtimePlan: `ExpoRuntimePlan | undefined`
  - returns: `ExpoRuntimeLayoutIntegrationPlan`

## resolveExpoRuntimeNativeOutput

Kind: `function`
Module: `src/generatedAppOutput.ts`
Source: `src/generatedAppOutput.ts:40:1`

### Signatures

- `(runtimePlan: ExpoRuntimePlan | undefined) => ExpoRuntimeNativeOutputPlan`
  - runtimePlan: `ExpoRuntimePlan | undefined`
  - returns: `ExpoRuntimeNativeOutputPlan`

## resolveExpoRuntimePlan

Kind: `function`
Module: `src/resolveExpoRuntimePlan.ts`
Source: `src/resolveExpoRuntimePlan.ts:131:1`

### Signatures

- `(manifest: ExpoRuntimePlanningManifest, options?: ResolveExpoRuntimePlanOptions) => ExpoRuntimePlan`
  - manifest: `ExpoRuntimePlanningManifest`
  - options: `ResolveExpoRuntimePlanOptions` (optional)
  - returns: `ExpoRuntimePlan`

## resolveExpoRuntimeRoutePath

Kind: `function`
Module: `src/expoActionBridge.ts`
Source: `src/expoActionBridge.ts:34:1`

### Signatures

- `(pathname: string, params?: Record<string, string | number> | undefined) => ExpoRuntimeRouteResolution`
  - params: `Record<string, string | number> | undefined` (optional)
  - pathname: `string`
  - returns: `ExpoRuntimeRouteResolution`

## shouldIgnoreBarcodeScan

Kind: `function`
Module: `src/barcodeScanRuntime.ts`
Source: `src/barcodeScanRuntime.ts:109:1`

### Signatures

- `(previous: BarcodeScanRecord | null, next: BarcodeScanResult, now: number) => boolean`
  - next: `BarcodeScanResult`
  - now: `number`
  - previous: `BarcodeScanRecord | null`
  - returns: `boolean`
