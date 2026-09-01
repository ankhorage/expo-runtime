# @ankhorage/expo-runtime

## 3.2.4

### Patch Changes

- 281a3fa: Generate Expo layout provider imports through the focused `@ankhorage/expo-runtime/providers` subpath so unrelated capability peers do not leak into generated applications.

## 3.2.3

### Patch Changes

- 4c8afa1: Update Ankhorage dependencies: `@ankhorage/zora`.

## 3.2.2

### Patch Changes

- 1aeaf53: Expose capability-scoped barcode scanner and ebook reader adapter entrypoints, and generate bridges that avoid importing unrelated optional platform dependencies.

## 3.2.1

### Patch Changes

- 14cff2c: Update Ankhorage dependencies: `@ankhorage/zora`.

## 3.2.0

### Minor Changes

- 2c1d08a: Add the Expo ReaderSurface adapter for EPUB 3 and PDF documents, including isolated DOM rendering, swipe and keyboard pagination, protected-content handling, and declarative ebookReader dependency planning.

## 3.1.2

### Patch Changes

- 143a62a: Add executable EPUB archive expansion and overlap preflight limits for the reader adapter.

## 3.1.1

### Patch Changes

- 979cb5b: Pin the audited EPUB/PDF renderer foundations and document the isolated DOM, content-safety, and deterministic fixture contract for the reader adapter.
- 162fb2a: Update Ankhorage dependencies: `@ankhorage/contracts`.

## 3.1.0

### Minor Changes

- 955498a: Expose the five canonical static icon provider packages through the Expo platform contract, including Material Design Icons.

## 3.0.13

### Patch Changes

- dbf640c: Update Ankhorage dependencies: `@ankhorage/zora`.

## 3.0.12

### Patch Changes

- cb0e55a: Refresh the canonical Expo SDK 57 platform projection to Expo 57.0.18 and verify its complete bundled-module map in the clean compatibility fixture.

## 3.0.11

### Patch Changes

- defaa7f: Update Ankhorage dependencies: `@ankhorage/paradox`, `@ankhorage/zora`.

## 3.0.10

### Patch Changes

- b94b350: Use the Web icon-font provider during Expo static server rendering so browser hydration starts from matching font registrations.

## 3.0.9

### Patch Changes

- 15df28a: Prefer the browser icon-font provider when Expo Web matches both browser and React Native package conditions.

## 3.0.8

### Patch Changes

- cb70c0f: Expose the ZORA icon font boundary through a focused subpath so camera-free Expo apps do not load unrelated root runtime types.

## 3.0.7

### Patch Changes

- b115422: Add the shared Expo provider that loads every ZORA icon font face on Web before presenting an interactive app.

## 3.0.6

### Patch Changes

- c06e8f6: Pin the canonical generated-app Expo toolchain to Expo 57.0.17 and align React Native 0.86.3 with the current SDK 57 compatibility metadata.

## 3.0.5

### Patch Changes

- b69bb95: Include `expo-asset` as a direct generated-app dependency whenever Expo audio is planned.

## 3.0.4

### Patch Changes

- 744e3e9: Expose the Expo 57 crypto package in the canonical platform dependency projection.

## 3.0.3

### Patch Changes

- 62d80af: Require the released permissions adapter with blocked, limited, iOS notification, and settings
  recovery normalization in generated Expo runtime plans.

## 3.0.2

### Patch Changes

- a6576bc: Emit the generated barcode-scanner adapter with the canonical source format.

## 3.0.1

### Patch Changes

- c14bbd0: Expose the Expo action bridge through a lightweight public subpath that does not require native runtime peers.

## 3.0.0

### Major Changes

- 8621e2b: Align the root Expo 57 runtime with released ZORA 3 and Surface 3, and make package-wide application peers optional at install time so the public `platform` subpath remains independently consumable by headless planners. Root and feature entrypoints still require consumers to install the peers they execute.

## 2.7.0

### Minor Changes

- b3f74f3: Add the canonical Expo 57 platform contract, migrate runtime planning and adapters to the SDK 57 baseline, and validate the declared package set with Expo CLI and Expo Doctor.

## 2.6.0

### Minor Changes

- 55615bc: Narrow Expo runtime planning to the screen capability and permission requirements it actually consumes, so unrelated manifest contract changes do not couple into Expo planning.

## 2.5.1

### Patch Changes

- f616cdf: Fix brokered OAuth host detection so custom native, development-client, and standalone builds are not misclassified as Expo Go.

## 2.5.0

### Minor Changes

- b6541d8: Add runtime readiness detection that rejects Expo Go for brokered native OAuth and requires a custom development or standalone build with the configured app scheme.

## 2.4.0

### Minor Changes

- b2e39b8: Classify Expo authentication browser results into neutral OAuth transport responses.

## 2.3.0

### Minor Changes

- de6bd74: Add canonical native scheme planning for enabled Expo application targets.

## 2.2.1

### Patch Changes

- f9a8210: Expose bundled media resolution and registry generation through a lightweight bundled-media subpath.

## 2.2.0

### Minor Changes

- 3ac63a6: Add Expo/Metro bundled media resolution and static registry source generation for canonical app-relative media paths.

## 2.1.0

### Minor Changes

- 2d4b9c2: Add an isolated Expo media-picker subpath for transient file and photo-library selection, returning canonical media bytes and metadata without leaking local picker URIs into authoring state.

## 2.0.0

### Major Changes

- 3ef194b: Align public manifest planning APIs with Contracts 6 and its canonical Ankhorage module fields. Expo config `plugins` remain unchanged as a separate Expo ecosystem concept.

## 1.0.0

### Major Changes

- a7d0270: Consume the canonical Contracts 4 app-manifest boundary for Expo runtime planning.

## 0.0.11

### Patch Changes

- 0afa890: Update ZORA

## 0.0.10

### Patch Changes

- a5e7279: Publish Expo Runtime with `@ankhorage/contracts` 2.0.0 so downstream consumers resolve a single compatible manifest contract.

## 0.0.9

### Patch Changes

- ca0824d: Consume the permissions provider metadata release from `@ankhorage/permissions`.

## 0.0.8

### Patch Changes

- 681f7e1: Add app output model helpers for dependency maps, native plugin output, Android permissions, and combined Expo plan output.

## 0.0.7

### Patch Changes

- 7eddf62: Add generated layout helper output for Expo provider imports.

## 0.0.6

### Patch Changes

- 5f947ed: Add Expo-aware runtime action bridge helpers for navigation, theme toggling, logging, alerts, and delegated action handlers.

## 0.0.5

### Patch Changes

- 0573919: Add a generated barcode scanner adapter source helper for standalone Expo app generation.

## 0.0.4

### Patch Changes

- 264d7da: Update CONTRACTS

## 0.0.3

### Patch Changes

- 1919ae8: Add a public planning entrypoint for Expo runtime resolution.

## 0.0.2

### Patch Changes

- ba20014: Release trigger

## 0.0.1

### Patch Changes

- 1f9a5dc: Add the Expo runtime plan resolver, provider wrapper, scanner adapter, and
  component registry factory so generated apps and Studio preview can share the
  same Expo runtime implementation path.
