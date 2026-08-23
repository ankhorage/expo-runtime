# Expo 57 and React Native 0.86 migration audit

This audit covers Expo Runtime ownership only. Downstream Runtime, Surface, ZORA, DnD, orchestrator, Studio, generated-app, and native acceptance work remains in roadmap steps `[expo 2]` through `[expo 12]` and must consume a published `@ankhorage/expo-runtime/platform` release.

## Expo SDK 55 to 57

- **CHANGE REQUIRED — platform/package ownership.** SDK 55 aligned Expo module majors with the SDK major. The SDK 54 peer versions and generated `expo-camera` version table were replaced by `EXPO_PLATFORM`, sourced from Expo 57's bundled native module map.
- **CHANGE REQUIRED — native architecture and platforms.** SDK 55 removed the Legacy Architecture; SDK 56 raised iOS to 16.4 and Xcode to 26.4; SDK 57 uses RN 0.86. The platform contract records New-Architecture-only support, Android 7/API 24 with compile/target SDK 36 and edge-to-edge, and iOS 16.4/Xcode 26.4. tvOS is not advertised.
- **CHANGE REQUIRED — Node and TypeScript.** Runtime policy now declares Node 24 LTS, uses matching Node 24 typings, and typechecks with TypeScript 6.0.3.
- **CHANGE REQUIRED — permission/config planning.** Camera, audio recording, media-library, foreground/background location, and notifications requirements now resolve to current Expo 57 packages and built-in config plugins. Manual Android permission duplication was removed because these modules own their manifest entries.
- **CHANGE REQUIRED — barcode scanning.** The adapter uses Expo 57 `CameraView` directly on native and Web and keeps all 13 SDK 57 Camera barcode types available. QR, EAN-13, and EAN-8 are acceptance formats, not a product-specific filter. No direct/custom ZXing compatibility layer exists.
- **CHANGE REQUIRED — picker Web file typing.** Expo 57 picker assets no longer structurally guarantee `file.arrayBuffer()` in their cross-platform type. The byte reader now feature-detects that Web API and otherwise falls back to `new File(uri).bytes()`.
- **VERIFIED: NO CHANGE REQUIRED — file-system copy/move API.** Expo Runtime does not call the SDK 56-breaking `copy()` or `move()` APIs.
- **VERIFIED: NO CHANGE REQUIRED — fetch.** Expo Runtime has no `expo/fetch` imports or fetch override, so SDK 56's `globalThis.fetch` default needs no package change.
- **VERIFIED: NO CHANGE REQUIRED — Router and vector icons.** This package contains no application routing or active `@react-navigation/*` / `@expo/vector-icons` imports. Their migrations belong to downstream roadmap owners.
- **VERIFIED: NO CHANGE REQUIRED — Babel, Metro, and Worklets bundle mode.** This package owns no Babel or Metro config, has no manual Worklets plugin, and does not enable Worklets bundle mode.
- **VERIFIED: NO CHANGE REQUIRED — CNG/prebuild.** Expo Runtime emits declarative package/config-plugin plans and owns no generated native directories. SDK 57 clean-prebuild handling remains with downstream app generators.
- **VERIFIED: NO CHANGE REQUIRED — OAuth runtime API.** The readiness check only reads current `expo-constants` ownership/execution metadata and continues to require development or standalone builds rather than Expo Go for stable native callback schemes.

## React Native 0.82 to 0.86

- **CHANGE REQUIRED — React/RN types and peers.** React 19.2.3 and RN 0.86.2 replace React 19.1/RN 0.81.5 in peer, development, and compatibility-fixture manifests.
- **VERIFIED: NO CHANGE REQUIRED — removed/deprecated JS APIs.** Source does not use `Appearance.setColorScheme(null)`, private feature flags, legacy subscription removers, `StyleSheet.absoluteFillObject`, the React Native Jest preset, deprecated accessibility focus APIs, or deprecated `AppRegistry` hook parameters.
- **VERIFIED: NO CHANGE REQUIRED — Fabric/New Architecture.** Expo Runtime contains React components and Expo module adapters but no legacy native modules, bridge-only implementation, native view manager, or architecture switch.
- **VERIFIED: NO CHANGE REQUIRED — layout and measurement.** The camera adapter uses ordinary flex styles and does not use imperative measurement or coordinates affected by edge-to-edge changes.
- **VERIFIED: NO CHANGE REQUIRED — refs and imperative handles.** Runtime-owned components do not expose native refs or imperative handles.
- **VERIFIED: NO CHANGE REQUIRED — event semantics.** Barcode events are normalized from Expo's current `{ data, type }` payload to the stable Ankhorage `{ value, type? }` contract and deduplicated before forwarding.
- **VERIFIED: NO CHANGE REQUIRED — native module interfaces.** Current camera, constants, document-picker, file-system, and image-picker APIs remain valid after compiling against their Expo 57 packages. Permission packages are dynamically selected from declarative metadata.
- **VERIFIED: NO CHANGE REQUIRED — animation and gesture semantics.** Expo Runtime has no animation or gesture implementation. It records Expo 57's Reanimated 4.5.1, Worklets 0.10.1, and Gesture Handler 2.32 compatibility for downstream owners.
- **VERIFIED: NO CHANGE REQUIRED — Metro/module resolution.** The package has no custom resolver, alias, singleton override, or React Navigation compatibility dependency.
- **VERIFIED: NO CHANGE REQUIRED — React Native Web interaction.** `CameraView` is the only scanner implementation on Web, and its Expo 57 barcode settings and event payload are shared with native.

## Web barcode recognition acceptance

`bun run validate:web-barcode` builds a clean Expo 57 Web app with the packed package, mounts the real `ExpoBarcodeScannerAdapter` and Expo `CameraView`, and feeds generated barcode images through Chromium's supported fake-camera video input. Headless Chrome must then report QR, valid EAN-13 `4006381333931`, and valid EAN-8 `96385074` from Expo Camera into the canonical Ankhorage callback. This executable browser check is distinct from the unit tests for event normalization and deduplication.

The command uses Google Chrome or Chromium at a standard macOS/Linux path. Set `CHROME_PATH=/absolute/path/to/browser` when it is installed elsewhere. Run it from the repository root after `bun install --frozen-lockfile`; successful output lists all three recognized values above.

The repository-owned Expo platform workflow runs the deterministic `validate:expo-platform` fixture in CI. The real camera-stream acceptance remains an explicit browser gate because hosted Linux headless Chrome did not deliver synthetic camera frames reliably with either canvas capture or fake-video input; the fixture still fails unless Expo Camera itself recognizes each barcode and invokes the adapter callback.

Physical-device camera acceptance is not available in this package repository. Native QR/EAN hardware validation remains an acceptance responsibility after consumers rebuild their Expo 57 development clients.

## Expo Runtime peer boundary correction

- The released ZORA 3 and Surface 3 graph replaces the obsolete ZORA 2 runtime peer. Barcode scanner exports and props were verified against the released package before migration.
- Package-wide application peers are optional at install time so the pure `./platform` contract remains independently consumable. Root and feature entrypoints retain explicit documented runtime requirements and fail normal module resolution when a dependency they actually execute is absent.
- Packed headless and root-runtime acceptance independently prove both sides of that boundary. No downstream repository was modified or deep-imported.
