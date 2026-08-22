# Expo platform contract

`@ankhorage/expo-runtime/platform` is the single Ankhorage authority for the supported Expo platform baseline. Consumers should read `EXPO_PLATFORM` rather than copying Expo, React Native, navigation, animation, module, tooling, or native-platform versions into another table.

The contract targets Expo SDK 57 on React Native 0.86.2 and requires an Expo patch newer than the Hermes V1 memory-regression fix. It also records the Node 24 LTS and TypeScript 6 toolchain policy, New-Architecture-only support, Android 7/API 24 with SDK 36 and edge-to-edge layout, and iOS 16.4 with Xcode 26.4. tvOS is intentionally not advertised.

The repository compatibility check assembles a clean temporary app directly from `EXPO_PLATFORM`, installs its app-owned dependencies, and runs that app's local `expo install --check` and `expo-doctor` binaries. The same check verifies that this package's peer and development dependencies are projections of the contract.
