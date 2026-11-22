import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { EXPO_PLATFORM } from '../../src/platform';
import { readJsonFileAsync } from '../packedAcceptance/readJsonFileAsync';

interface PackageManifest {
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
  readonly peerDependencies?: Readonly<Record<string, string>>;
}

export interface PackedRuntimeFixtureOptions {
  readonly includeIconFontProvider?: boolean;
}

export async function writePackedRuntimeFixtureAsync(
  consumerRoot: string,
  repositoryRoot: string,
  candidateName: string,
  candidatePath: string,
  options: PackedRuntimeFixtureOptions = {},
): Promise<void> {
  await mkdir(path.join(consumerRoot, 'src/app'), { recursive: true });
  const repositoryManifest = await readJsonFileAsync<PackageManifest>(
    path.join(repositoryRoot, 'package.json'),
  );
  const zoraManifest = await readJsonFileAsync<PackageManifest>(
    path.join(repositoryRoot, 'node_modules/@ankhorage/zora/package.json'),
  );
  const zoraPeers = zoraManifest.peerDependencies ?? {};
  const peerDependencies = repositoryManifest.peerDependencies ?? {};

  await Promise.all([
    writePackageAsync(
      consumerRoot,
      candidateName,
      candidatePath,
      repositoryManifest.devDependencies ?? {},
      peerDependencies,
      zoraManifest,
      zoraPeers,
    ),
    writeConfigAsync(consumerRoot),
    writeSourceAsync(consumerRoot, options),
  ]);
}

async function writeConfigAsync(consumerRoot: string): Promise<void> {
  const config = {
    expo: {
      name: 'Expo Runtime Packed Acceptance',
      slug: 'expo-runtime-packed-acceptance',
      scheme: 'expo-runtime-packed-acceptance',
      web: { output: 'static' },
      experiments: { reactCompiler: true },
      android: { package: 'com.ankhorage.exporuntimeacceptance' },
      ios: { bundleIdentifier: 'com.ankhorage.exporuntimeacceptance' },
      plugins: [
        'expo-router',
        ...Object.values(EXPO_PLATFORM.ui.iconProviders).map(({ name }) => name),
        [
          EXPO_PLATFORM.packages.camera.name,
          {
            barcodeScannerEnabled: true,
            cameraPermission: 'Allow runtime acceptance camera access.',
            microphonePermission: false,
            recordAudioAndroid: false,
          },
        ],
      ],
    },
  };
  await Bun.write(path.join(consumerRoot, 'app.json'), `${JSON.stringify(config, null, 2)}\n`);
  await Bun.write(
    path.join(consumerRoot, 'tsconfig.json'),
    `${JSON.stringify(
      {
        extends: 'expo/tsconfig.base',
        compilerOptions: { strict: true, noUncheckedIndexedAccess: true },
        include: ['src/**/*.ts', 'src/**/*.tsx'],
      },
      null,
      2,
    )}\n`,
  );
}

async function writePackageAsync(
  consumerRoot: string,
  candidateName: string,
  candidatePath: string,
  runtimeDevDependencies: Readonly<Record<string, string>>,
  runtimePeers: Readonly<Record<string, string>>,
  zoraManifest: PackageManifest,
  zoraPeers: Readonly<Record<string, string>>,
): Promise<void> {
  const dependencies = {
    ...zoraPeers,
    ...Object.fromEntries(
      Object.values(EXPO_PLATFORM.ui.iconProviders).map(({ name, version }) => [name, version]),
    ),
    [candidateName]: `file:${candidatePath}`,
    '@ankhorage/permissions': requireVersion(runtimePeers, '@ankhorage/permissions'),
    '@ankhorage/surface': requireVersion(zoraManifest.dependencies ?? {}, '@ankhorage/surface'),
    '@ankhorage/zora': requireVersion(runtimePeers, '@ankhorage/zora'),
    ...resolvePackedPeerDependencies(),
    [EXPO_PLATFORM.packages.camera.name]: EXPO_PLATFORM.packages.camera.version,
    [EXPO_PLATFORM.packages.constants.name]: EXPO_PLATFORM.packages.constants.version,
    [EXPO_PLATFORM.packages.linking.name]: EXPO_PLATFORM.packages.linking.version,
    [EXPO_PLATFORM.packages.metroRuntime.name]: EXPO_PLATFORM.packages.metroRuntime.version,
    [EXPO_PLATFORM.navigation.expoRouter.name]: EXPO_PLATFORM.navigation.expoRouter.version,
    [EXPO_PLATFORM.navigation.safeArea.name]: EXPO_PLATFORM.navigation.safeArea.version,
    [EXPO_PLATFORM.runtime.expo.name]: EXPO_PLATFORM.runtime.expo.version,
    [EXPO_PLATFORM.runtime.react.name]: EXPO_PLATFORM.runtime.react.version,
    [EXPO_PLATFORM.runtime.reactDom.name]: EXPO_PLATFORM.runtime.reactDom.version,
    [EXPO_PLATFORM.runtime.reactNative.name]: EXPO_PLATFORM.runtime.reactNative.version,
    [EXPO_PLATFORM.runtime.reactNativeWeb.name]: EXPO_PLATFORM.runtime.reactNativeWeb.version,
  };
  const packageJson = {
    name: 'expo-runtime-packed-root-acceptance',
    version: '0.0.0',
    private: true,
    type: 'module',
    main: 'expo-router/entry',
    engines: { node: EXPO_PLATFORM.tooling.node.version },
    dependencies,
    devDependencies: {
      '@types/react': requireVersion(runtimeDevDependencies, '@types/react'),
      [EXPO_PLATFORM.tooling.expoDoctor.name]: EXPO_PLATFORM.tooling.expoDoctor.version,
      [EXPO_PLATFORM.tooling.typescript.name]: EXPO_PLATFORM.tooling.typescript.version,
    },
  };
  await Bun.write(
    path.join(consumerRoot, 'package.json'),
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );
}

async function writeSourceAsync(
  consumerRoot: string,
  options: PackedRuntimeFixtureOptions,
): Promise<void> {
  await Promise.all([
    writeRootLayoutAsync(consumerRoot, options),
    writeIndexAsync(consumerRoot),
    writeAuthoringRouteDeliveryAsync(consumerRoot),
    writeGeneratedAppSourcesConsumptionAsync(consumerRoot),
  ]);
}

/*** Assert a packed consumer can obtain the Runtime-owned Navigator bindings without a Studio import. */
async function writeGeneratedAppSourcesConsumptionAsync(consumerRoot: string): Promise<void> {
  await Bun.write(
    path.join(consumerRoot, 'src/generatedAppSources.ts'),
    `import type { AppManifest } from '@ankhorage/contracts';
import { resolveExpoRuntimeGeneratedAppSources } from '@ankhorage/expo-runtime/generated-app';

const manifest: AppManifest = {
  activeThemeId: 'default',
  infra: {},
  metadata: {
    category: 'utilities_tools',
    name: 'Packed consumer',
    slug: 'packed-consumer',
    themeId: 'default',
    version: '1.0.0',
  },
  navigator: { routes: [{ name: 'home', screenId: 'home' }], type: 'stack' },
  screens: {
    home: { id: 'home', name: 'Home', root: { id: 'home-root', type: 'Screen' } },
  },
  settings: { localization: { defaultLocale: 'en', locales: ['en'] } },
  themes: {
    default: {
      dark: { harmony: 'analogous', primaryColor: '#000000' },
      id: 'default',
      light: { harmony: 'analogous', primaryColor: '#ffffff' },
      name: 'Default',
    },
  },
};
const output = resolveExpoRuntimeGeneratedAppSources(manifest, undefined, {
  manifestModuleSpecifier: '../ankh.config.json',
  screenModuleSpecifier: '@/generated/runtimeManifestScreens',
});

if (
  output.diagnostics.length !== 0 ||
  output.files[0]?.relativePath !== 'src/generated/runtimeManifestScreens.tsx' ||
  output.navigatorBindings.screens.home?.exportName !== 'ManifestScreen0'
) {
  throw new Error('Packed Expo Runtime did not expose generated manifest screen bindings.');
}
`,
  );
}

/*** Write the generated app layout used by packed Runtime acceptance. */
async function writeRootLayoutAsync(
  consumerRoot: string,
  options: PackedRuntimeFixtureOptions,
): Promise<void> {
  const iconFontImport = options.includeIconFontProvider
    ? "import { ExpoZoraIconFontProvider } from '@ankhorage/expo-runtime/icon-fonts';\n"
    : '';
  const providerOpening = options.includeIconFontProvider ? '    <ExpoZoraIconFontProvider>\n' : '';
  const providerClosing = options.includeIconFontProvider
    ? '    </ExpoZoraIconFontProvider>\n'
    : '';
  await Bun.write(
    path.join(consumerRoot, 'src/app/_layout.tsx'),
    `import { ExpoRuntimeProviders } from '@ankhorage/expo-runtime';
${iconFontImport}
import { ResponsiveProvider } from '@ankhorage/surface';
import { ZoraProvider } from '@ankhorage/zora';
import { Slot } from 'expo-router';

export default function RootLayout() {
  return (
${providerOpening}
    <ResponsiveProvider>
      <ZoraProvider>
        <ExpoRuntimeProviders providers={['permissions']}>
          <Slot />
        </ExpoRuntimeProviders>
      </ZoraProvider>
    </ResponsiveProvider>
${providerClosing}
  );
}
`,
  );
}

/*** Write the generated Runtime consumer's default screen. */
async function writeIndexAsync(consumerRoot: string): Promise<void> {
  await Bun.write(
    path.join(consumerRoot, 'src/app/index.tsx'),
    `import { ExpoBarcodeScannerAdapter } from '@ankhorage/expo-runtime';
import { Reader } from '@ankhorage/zora';
import { View } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1 }}>
      <View testID="icon-font-consumer">Icon font runtime ready</View>
      <ExpoBarcodeScannerAdapter permissionStatus="unknown" />
      <Reader format="pdf" source={null} />
    </View>
  );
}
`,
  );
}

/*** Assert packed Runtime route delivery composes only the published Authoring screen through an explicit host port. */
async function writeAuthoringRouteDeliveryAsync(consumerRoot: string): Promise<void> {
  await Bun.write(
    path.join(consumerRoot, 'src/authoringRouteDelivery.ts'),
    `import { getExpoAuthoringRouteFiles } from '@ankhorage/expo-runtime/route-delivery';
import { AUTHORING_ANKH_ROUTE_DELIVERIES } from '@ankhorage/studio-authoring';

const files = getExpoAuthoringRouteFiles(AUTHORING_ANKH_ROUTE_DELIVERIES, {
  screens: {
    moduleSpecifier: '../../authoring/screensHost',
    getPropsExportName: 'getScreensAuthoringScreenProps',
  },
});

if (
  files.length !== 1 ||
  files[0]?.relativePath !== 'ankh/screens.tsx' ||
  !files[0]?.source.includes("@ankhorage/studio-authoring/screens") ||
  !files[0]?.source.includes('getScreensAuthoringScreenProps')
) {
  throw new Error('Packed Expo Runtime did not deliver the published Authoring screen route.');
}
`,
  );
}

function resolvePackedPeerDependencies(): Record<string, string> {
  return {
    [EXPO_PLATFORM.ui.svg.name]: EXPO_PLATFORM.ui.svg.version,
  };
}

function requireVersion(versions: Readonly<Record<string, string>>, packageName: string): string {
  const version = Reflect.get(versions, packageName) as unknown;
  if (typeof version !== 'string') {
    throw new Error(`Missing released requirement for ${packageName}.`);
  }
  return version;
}
