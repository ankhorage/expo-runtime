export interface ExpoPlatformPackage {
  readonly name: string;
  readonly version: string;
}

function definePackage(name: string, version: string): ExpoPlatformPackage {
  return { name, version };
}

/**
 * The canonical Ankhorage projection of the supported Expo platform.
 *
 * Package versions come from Expo SDK 57's bundled native module map. Keep this
 * structure as the only hand-maintained Expo compatibility authority in this
 * repository; generated manifests and runtime planning derive from it.
 */
export const EXPO_PLATFORM = {
  sdk: 57,
  architecture: 'new-architecture-only',
  runtime: {
    expo: definePackage('expo', '57.0.18'),
    react: definePackage('react', '19.2.3'),
    reactDom: definePackage('react-dom', '19.2.3'),
    reactNative: definePackage('react-native', '0.86.3'),
    reactNativeWeb: definePackage('react-native-web', '~0.21.0'),
  },
  tooling: {
    node: {
      lts: 24,
      version: '24.x',
    },
    nodeTypes: definePackage('@types/node', '^24.13.3'),
    typescript: definePackage('typescript', '~6.0.3'),
    expoDoctor: definePackage('expo-doctor', '1.20.4'),
  },
  navigation: {
    expoRouter: definePackage('expo-router', '~57.0.17'),
    screens: definePackage('react-native-screens', '~4.26.0'),
    safeArea: definePackage('react-native-safe-area-context', '~5.7.0'),
  },
  animation: {
    reanimated: definePackage('react-native-reanimated', '4.5.1'),
    worklets: definePackage('react-native-worklets', '0.10.1'),
    gestureHandler: definePackage('react-native-gesture-handler', '~2.32.0'),
  },
  ui: {
    svg: definePackage('react-native-svg', '15.15.4'),
    iconProviders: {
      Ionicons: definePackage('@react-native-vector-icons/ionicons', '^13.1.3'),
      FontAwesome: definePackage('@react-native-vector-icons/fontawesome', '^13.1.3'),
      FontAwesome5: definePackage('@react-native-vector-icons/fontawesome5', '^13.1.3'),
      FontAwesome6: definePackage('@react-native-vector-icons/fontawesome6', '^13.1.3'),
      MaterialDesignIcons: definePackage(
        '@react-native-vector-icons/material-design-icons',
        '^13.1.3',
      ),
    },
  },
  packages: {
    metroRuntime: definePackage('@expo/metro-runtime', '~57.0.14'),
    asset: definePackage('expo-asset', '~57.0.15'),
    audio: definePackage('expo-audio', '~57.0.4'),
    authSession: definePackage('expo-auth-session', '~57.0.10'),
    camera: definePackage('expo-camera', '~57.0.4'),
    constants: definePackage('expo-constants', '~57.0.16'),
    crypto: definePackage('expo-crypto', '~57.0.2'),
    devClient: definePackage('expo-dev-client', '~57.0.16'),
    documentPicker: definePackage('expo-document-picker', '~57.0.1'),
    fileSystem: definePackage('expo-file-system', '~57.0.6'),
    font: definePackage('expo-font', '~57.0.2'),
    imagePicker: definePackage('expo-image-picker', '~57.0.14'),
    linearGradient: definePackage('expo-linear-gradient', '~57.0.1'),
    linking: definePackage('expo-linking', '~57.0.8'),
    localization: definePackage('expo-localization', '~57.0.1'),
    location: definePackage('expo-location', '~57.0.14'),
    mediaLibrary: definePackage('expo-media-library', '~57.0.4'),
    notifications: definePackage('expo-notifications', '~57.0.15'),
    secureStore: definePackage('expo-secure-store', '~57.0.2'),
    splashScreen: definePackage('expo-splash-screen', '~57.0.8'),
    statusBar: definePackage('expo-status-bar', '~57.0.1'),
    updates: definePackage('expo-updates', '~57.0.19'),
    webBrowser: definePackage('expo-web-browser', '~57.0.2'),
  },
  platforms: {
    android: {
      minimumVersion: 7,
      minimumApiLevel: 24,
      compileSdk: 36,
      targetSdk: 36,
      edgeToEdge: true,
    },
    ios: {
      minimumVersion: '16.4',
      minimumXcodeVersion: '26.4',
    },
  },
} as const;

export type ExpoPlatform = typeof EXPO_PLATFORM;
