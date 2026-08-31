import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { EXPO_PLATFORM } from '../../src/platform';
import { readJsonFileAsync } from '../packedAcceptance/readJsonFileAsync';

interface PackageManifest {
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
  readonly peerDependencies?: Readonly<Record<string, string>>;
}

export async function writePackedRuntimeFixtureAsync(
  consumerRoot: string,
  repositoryRoot: string,
  candidateName: string,
  candidatePath: string,
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
    writeSourceAsync(consumerRoot),
  ]);
}

async function writeConfigAsync(consumerRoot: string): Promise<void> {
  const config = {
    expo: {
      name: 'Expo Runtime Packed Acceptance',
      slug: 'expo-runtime-packed-acceptance',
      scheme: 'expo-runtime-packed-acceptance',
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

async function writeSourceAsync(consumerRoot: string): Promise<void> {
  await Bun.write(
    path.join(consumerRoot, 'src/app/_layout.tsx'),
    `import { ExpoRuntimeProviders } from '@ankhorage/expo-runtime';
import { ResponsiveProvider } from '@ankhorage/surface';
import { ZoraProvider } from '@ankhorage/zora';
import { Slot } from 'expo-router';

export default function RootLayout() {
  return (
    <ResponsiveProvider>
      <ZoraProvider>
        <ExpoRuntimeProviders providers={['permissions']}>
          <Slot />
        </ExpoRuntimeProviders>
      </ZoraProvider>
    </ResponsiveProvider>
  );
}
`,
  );
  await Bun.write(
    path.join(consumerRoot, 'src/app/index.tsx'),
    `import { ExpoBarcodeScannerAdapter } from '@ankhorage/expo-runtime';
import { View } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1 }}>
      <ExpoBarcodeScannerAdapter permissionStatus="unknown" />
    </View>
  );
}
`,
  );
}

function requireVersion(versions: Readonly<Record<string, string>>, packageName: string): string {
  const version = Reflect.get(versions, packageName) as unknown;
  if (typeof version !== 'string') {
    throw new Error(`Missing released requirement for ${packageName}.`);
  }
  return version;
}
