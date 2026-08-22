import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import bwipjs from 'bwip-js/node';
import { PNG } from 'pngjs';

import { EXPO_PLATFORM } from '../../src/platform';
import type { BarcodeAcceptanceImage, BarcodeAcceptanceScenario } from './types';
import { writeBarcodeVideo } from './video';

export const BARCODE_ACCEPTANCE_SCENARIOS = [
  {
    asset: 'qr.png',
    generator: 'qrcode',
    type: 'qr',
    value: 'https://ankhorage.dev/expo-57-web',
  },
  {
    asset: 'ean13.png',
    generator: 'ean13',
    type: 'ean13',
    value: '4006381333931',
  },
  {
    asset: 'ean8.png',
    generator: 'ean8',
    type: 'ean8',
    value: '96385074',
  },
] as const satisfies readonly BarcodeAcceptanceScenario[];

export async function createWebBarcodeFixture(
  fixtureRoot: string,
  repositoryRoot: string,
  runtimePackagePath: string,
): Promise<string> {
  await mkdir(join(fixtureRoot, 'public', 'barcodes'), { recursive: true });
  await Promise.all([
    writeManifest(fixtureRoot, repositoryRoot, runtimePackagePath),
    writeAppConfig(fixtureRoot),
    writeAppSource(fixtureRoot),
  ]);
  const images = await Promise.all(
    BARCODE_ACCEPTANCE_SCENARIOS.map((scenario) => writeBarcode(fixtureRoot, scenario)),
  );
  const videoPath = join(fixtureRoot, 'barcode-camera.y4m');
  await writeBarcodeVideo(videoPath, images);
  return videoPath;
}

async function writeManifest(
  fixtureRoot: string,
  repositoryRoot: string,
  runtimePackagePath: string,
): Promise<void> {
  const bundledModules = await readExpoBundledModules(repositoryRoot);
  const repositoryDependencies = await readRepositoryDependencies(repositoryRoot);
  const zoraDependencies = await readPackageDependencies(repositoryRoot, '@ankhorage/zora');
  const dependencies = {
    '@ankhorage/expo-runtime': `file:${runtimePackagePath}`,
    '@ankhorage/permissions': requiredVersion(repositoryDependencies, '@ankhorage/permissions'),
    '@ankhorage/surface': requiredVersion(zoraDependencies, '@ankhorage/surface'),
    '@ankhorage/zora': requiredVersion(repositoryDependencies, '@ankhorage/zora'),
    '@expo/vector-icons': requiredVersion(bundledModules, '@expo/vector-icons'),
    '@react-native-picker/picker': requiredVersion(bundledModules, '@react-native-picker/picker'),
    [EXPO_PLATFORM.packages.metroRuntime.name]: EXPO_PLATFORM.packages.metroRuntime.version,
    [EXPO_PLATFORM.packages.camera.name]: EXPO_PLATFORM.packages.camera.version,
    [EXPO_PLATFORM.packages.font.name]: EXPO_PLATFORM.packages.font.version,
    [EXPO_PLATFORM.packages.linearGradient.name]: EXPO_PLATFORM.packages.linearGradient.version,
    [EXPO_PLATFORM.runtime.expo.name]: EXPO_PLATFORM.runtime.expo.version,
    [EXPO_PLATFORM.runtime.react.name]: EXPO_PLATFORM.runtime.react.version,
    [EXPO_PLATFORM.runtime.reactDom.name]: EXPO_PLATFORM.runtime.reactDom.version,
    [EXPO_PLATFORM.runtime.reactNative.name]: EXPO_PLATFORM.runtime.reactNative.version,
    [EXPO_PLATFORM.runtime.reactNativeWeb.name]: EXPO_PLATFORM.runtime.reactNativeWeb.version,
  };
  await writeJson(join(fixtureRoot, 'package.json'), {
    name: 'ankhorage-expo-web-barcode-acceptance',
    version: '0.0.0',
    private: true,
    main: 'index.tsx',
    dependencies,
  });
}

async function readExpoBundledModules(repositoryRoot: string): Promise<Record<string, string>> {
  const path = join(repositoryRoot, 'node_modules', 'expo', 'bundledNativeModules.json');
  return JSON.parse(await Bun.file(path).text()) as Record<string, string>;
}

async function readPackageDependencies(
  repositoryRoot: string,
  packageName: string,
): Promise<Record<string, string>> {
  const path = join(repositoryRoot, 'node_modules', packageName, 'package.json');
  const manifest = JSON.parse(await Bun.file(path).text()) as {
    readonly dependencies?: Record<string, string>;
  };
  return manifest.dependencies ?? {};
}

async function readRepositoryDependencies(repositoryRoot: string): Promise<Record<string, string>> {
  const path = join(repositoryRoot, 'package.json');
  const manifest = JSON.parse(await Bun.file(path).text()) as {
    readonly dependencies?: Record<string, string>;
    readonly peerDependencies?: Record<string, string>;
  };
  return { ...manifest.dependencies, ...manifest.peerDependencies };
}

function requiredVersion(versions: Readonly<Record<string, string>>, name: string): string {
  const version = Object.entries(versions).find(([candidate]) => candidate === name)?.[1];
  if (version === undefined) {
    throw new Error(`Expo SDK 57 does not declare a bundled version for '${name}'.`);
  }
  return version;
}

async function writeAppConfig(fixtureRoot: string): Promise<void> {
  await writeJson(join(fixtureRoot, 'app.json'), {
    expo: {
      name: 'Ankhorage Expo Web Barcode Acceptance',
      slug: 'ankhorage-expo-web-barcode-acceptance',
      version: '1.0.0',
      platforms: ['web'],
      web: { bundler: 'metro' },
    },
  });
}

async function writeAppSource(fixtureRoot: string): Promise<void> {
  await Bun.write(join(fixtureRoot, 'index.tsx'), APP_SOURCE);
}

async function writeBarcode(
  fixtureRoot: string,
  scenario: BarcodeAcceptanceScenario,
): Promise<BarcodeAcceptanceImage> {
  const encoded = await bwipjs.toBuffer({
    bcid: scenario.generator,
    text: scenario.value,
    scale: scenario.type === 'qr' ? 10 : 6,
    ...(scenario.type === 'qr' ? {} : { height: 35 }),
    includetext: false,
    padding: 24,
    backgroundcolor: 'FFFFFF',
  });
  await Bun.write(join(fixtureRoot, 'public', 'barcodes', scenario.asset), encoded);
  const image = PNG.sync.read(encoded);
  return { data: image.data, height: image.height, width: image.width };
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await Bun.write(path, `${JSON.stringify(value, null, 2)}\n`);
}

const APP_SOURCE = `
import { Permission, PermissionsProvider } from '@ankhorage/permissions';
import { createFakePermissionClient } from '@ankhorage/permissions/testing';
import { ExpoBarcodeScannerAdapter } from '@ankhorage/expo-runtime';
import { ResponsiveProvider } from '@ankhorage/surface';
import { ZoraProvider } from '@ankhorage/zora';
import { registerRootComponent } from 'expo';
import React from 'react';

declare global {
  interface Window {
    __ankhorageScans: Array<{ value: string; type?: string }>;
  }
}

window.__ankhorageScans = [];

const permissionClient = createFakePermissionClient({
  requestStates: [{ permission: Permission.Camera, status: 'granted' }],
});

function App() {
  return (
    <ResponsiveProvider>
      <ZoraProvider>
        <PermissionsProvider client={permissionClient}>
          <ExpoBarcodeScannerAdapter
            permissionStatus="unknown"
            onBarcodeScanned={(result) => {
              window.__ankhorageScans.push(result);
            }}
          />
        </PermissionsProvider>
      </ZoraProvider>
    </ResponsiveProvider>
  );
}

registerRootComponent(App);
`;
