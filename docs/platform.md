# Expo platform contract

`@ankhorage/expo-runtime/platform` is the single Ankhorage authority for the supported Expo platform baseline. Consumers should read `EXPO_PLATFORM` rather than copying Expo, React Native, navigation, animation, module, tooling, or native-platform versions into another table.

The contract targets Expo SDK 57 on React Native 0.86.2 and requires an Expo patch newer than the Hermes V1 memory-regression fix. It also records the Node 24 LTS and TypeScript 6 toolchain policy, New-Architecture-only support, Android 7/API 24 with SDK 36 and edge-to-edge layout, and iOS 16.4 with Xcode 26.4. tvOS is intentionally not advertised.

The repository compatibility check assembles a clean temporary app directly from `EXPO_PLATFORM`, installs its app-owned dependencies, and runs that app's local `expo install --check` and `expo-doctor` binaries. The same check verifies that this package's peer and development dependencies are projections of the contract.

The separate `bun run validate:web-barcode` browser fixture proves Expo Camera Web recognition through the real adapter callback for QR, valid EAN-13, and valid EAN-8 inputs. Unit event-normalization coverage is intentionally not treated as decoder acceptance.

## Package-wide peers and the headless platform subpath

npm peer metadata applies to a whole package even though Expo Runtime has multiple public entrypoints. The entrypoints have different runtime needs:

| Dependency                                        | Classification         | Requiring entrypoint or capability                    | Required by `./platform`                                            |
| ------------------------------------------------- | ---------------------- | ----------------------------------------------------- | ------------------------------------------------------------------- |
| `@ankhorage/contracts`                            | package type contract  | public planning, action, media, and OAuth types       | no; retained as a lightweight dependency for published declarations |
| `@ankhorage/permissions`                          | root/planning runtime  | root providers and `./planning` permission resolution | no                                                                  |
| `@ankhorage/zora`                                 | root runtime           | barcode adapter and component registry                | no                                                                  |
| `expo`, `expo-camera`, React, React Native        | root Expo runtime      | barcode adapter and its Expo Camera environment       | no                                                                  |
| `expo-constants`                                  | feature subpath        | `./oauth-browser-runtime`                             | no                                                                  |
| Document Picker, File System, Image Picker        | optional capabilities  | `./media-picker` operations                           | no                                                                  |
| Devtools, Paradox, and the ZORA 3/Surface 3 graph | development validation | repository tooling and packed runtime acceptance      | no                                                                  |

All application/runtime peers are optional at package-install time so a Node planner can install the released package and import only `@ankhorage/expo-runtime/platform` without materializing the Expo UI graph. This does not make root runtime dependencies optional in use: importing the root entrypoint without Permissions, ZORA 3, Expo Camera, React, and React Native fails normal module resolution. Likewise, invoking a feature subpath without its capability package fails when that feature dynamically loads the missing package. Consumers must install the peers for every entrypoint and capability they use.

`bun run validate:headless-platform` permanently proves the packed `./platform` boundary. `bun run validate:packed-runtime` separately proves that the real root runtime compiles and bundles with released ZORA 3, Surface 3, Expo 57, React 19.2.3, React Native 0.86.2, and React Native Web 0.21.
