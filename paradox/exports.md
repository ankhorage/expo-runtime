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

## ComponentRegistry

Kind: `unknown`
Module: `src/componentRegistry.ts`
Source: `src/componentRegistry.ts:3:1`

## createComponentRegistry

Kind: `function`
Module: `src/componentRegistry.ts`
Source: `src/componentRegistry.ts:5:1`

### Signatures

- `(registries?: readonly ComponentRegistry[]) => ComponentRegistry`
  - registries: `readonly ComponentRegistry[]` (optional)
  - returns: `ComponentRegistry`

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
Source: `src/ExpoBarcodeScannerAdapter.tsx:17:1`

### Signatures

- `(props: BarcodeScannerViewProps) => React.JSX.Element`
  - props: `BarcodeScannerViewProps`
  - returns: `React.JSX.Element`

## ExpoBarcodeScanResultLike

Kind: `type`
Module: `src/barcodeScanRuntime.ts`
Source: `src/barcodeScanRuntime.ts:25:1`

### Members

| Name | Kind     | Type                  | Required | Description |
| ---- | -------- | --------------------- | -------- | ----------- |
| data | property | `string`              | yes      |             |
| type | property | `string \| undefined` | no       |             |

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
Source: `src/resolveExpoRuntimePlan.ts:27:1`

## ExpoRuntimePlan

Kind: `type`
Module: `src/resolveExpoRuntimePlan.ts`
Source: `src/resolveExpoRuntimePlan.ts:37:1`

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
Source: `src/resolveExpoRuntimePlan.ts:26:1`

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

## mapPermissionStatusToCameraPermissionStatus

Kind: `function`
Module: `src/barcodeScanRuntime.ts`
Source: `src/barcodeScanRuntime.ts:30:1`

### Signatures

- `(status: PermissionStatus, isRequestingPermission: boolean) => CameraPermissionStatus`
  - isRequestingPermission: `boolean`
  - status: `PermissionStatus`
  - returns: `CameraPermissionStatus`

## normalizeExpoBarcodeScanResult

Kind: `function`
Module: `src/barcodeScanRuntime.ts`
Source: `src/barcodeScanRuntime.ts:48:1`

### Signatures

- `(result: ExpoBarcodeScanResultLike) => BarcodeScanResult | null`
  - result: `ExpoBarcodeScanResultLike`
  - returns: `BarcodeScanResult | null`

## resolveExpoRuntimePlan

Kind: `function`
Module: `src/resolveExpoRuntimePlan.ts`
Source: `src/resolveExpoRuntimePlan.ts:121:1`

### Signatures

- `(manifest: AppManifest, options?: ResolveExpoRuntimePlanOptions) => ExpoRuntimePlan`
  - manifest: `AppManifest`
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
Source: `src/barcodeScanRuntime.ts:64:1`

### Signatures

- `(previous: BarcodeScanRecord | null, next: BarcodeScanResult, now: number) => boolean`
  - next: `BarcodeScanResult`
  - now: `number`
  - previous: `BarcodeScanRecord | null`
  - returns: `boolean`
