import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { EXPO_PLATFORM, type ExpoPlatformPackage } from '../src/platform';

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const fixtureRoot = await mkdtemp(join(tmpdir(), 'ankhorage-expo-platform-'));

const runtimePackages = Object.values(EXPO_PLATFORM.runtime);
const navigationPackages = Object.values(EXPO_PLATFORM.navigation);
const animationPackages = Object.values(EXPO_PLATFORM.animation);
const uiPackages = Object.values(EXPO_PLATFORM.ui);
const expoPackages = Object.values(EXPO_PLATFORM.packages);
const fixtureDependencies = toDependencyMap([
  ...runtimePackages,
  ...navigationPackages,
  ...animationPackages,
  ...uiPackages,
  ...expoPackages,
]);

try {
  await validateRepositoryManifest();
  await Bun.write(
    join(fixtureRoot, 'package.json'),
    `${JSON.stringify(
      {
        name: 'ankhorage-expo-platform-compatibility-fixture',
        version: '0.0.0',
        private: true,
        main: 'expo-router/entry',
        engines: { node: EXPO_PLATFORM.tooling.node.version },
        dependencies: fixtureDependencies,
        devDependencies: toDependencyMap([
          EXPO_PLATFORM.tooling.expoDoctor,
          EXPO_PLATFORM.tooling.nodeTypes,
          EXPO_PLATFORM.tooling.typescript,
        ]),
      },
      null,
      2,
    )}\n`,
  );
  await Bun.write(
    join(fixtureRoot, 'app.json'),
    `${JSON.stringify(
      {
        expo: {
          name: 'Ankhorage Expo Platform Compatibility',
          slug: 'ankhorage-expo-platform-compatibility',
          version: '1.0.0',
          platforms: ['android', 'ios', 'web'],
          plugins: [
            [
              EXPO_PLATFORM.packages.camera.name,
              {
                barcodeScannerEnabled: true,
                microphonePermission: false,
                recordAudioAndroid: false,
              },
            ],
            EXPO_PLATFORM.packages.audio.name,
            EXPO_PLATFORM.packages.mediaLibrary.name,
            EXPO_PLATFORM.packages.location.name,
            EXPO_PLATFORM.packages.notifications.name,
          ],
        },
      },
      null,
      2,
    )}\n`,
  );

  await run('bun', ['install'], fixtureRoot);
  await run(join(fixtureRoot, 'node_modules/.bin/expo'), ['install', '--check'], fixtureRoot);
  await run(join(fixtureRoot, 'node_modules/.bin/expo-doctor'), [], fixtureRoot);
} finally {
  await rm(fixtureRoot, { recursive: true, force: true });
}

function toDependencyMap(packages: readonly ExpoPlatformPackage[]): Record<string, string> {
  return Object.fromEntries(packages.map((dependency) => [dependency.name, dependency.version]));
}

async function validateRepositoryManifest(): Promise<void> {
  const manifest = asRecord(
    JSON.parse(await Bun.file(join(repositoryRoot, 'package.json')).text()),
  );
  const peerDependencies = asStringRecord(manifest.peerDependencies);
  const peerDependenciesMeta = asRecord(manifest.peerDependenciesMeta);
  const devDependencies = asStringRecord(manifest.devDependencies);
  const engines = asStringRecord(manifest.engines);

  const ownedPeers = [
    EXPO_PLATFORM.runtime.expo,
    EXPO_PLATFORM.runtime.react,
    EXPO_PLATFORM.runtime.reactNative,
    EXPO_PLATFORM.packages.camera,
    EXPO_PLATFORM.packages.constants,
    EXPO_PLATFORM.packages.documentPicker,
    EXPO_PLATFORM.packages.fileSystem,
    EXPO_PLATFORM.packages.imagePicker,
  ];

  for (const dependency of ownedPeers) {
    assertVersion(peerDependencies, dependency, 'peerDependencies');
    assertVersion(devDependencies, dependency, 'devDependencies');
    assertOptionalPeer(peerDependenciesMeta, dependency.name);
  }
  assertVersionString(peerDependencies, '@ankhorage/permissions', '^0.2.3', 'peerDependencies');
  assertVersionString(devDependencies, '@ankhorage/permissions', '^0.2.3', 'devDependencies');
  assertOptionalPeer(peerDependenciesMeta, '@ankhorage/permissions');
  assertVersionString(peerDependencies, '@ankhorage/zora', '^3.0.0', 'peerDependencies');
  assertVersionString(devDependencies, '@ankhorage/zora', '^3.0.0', 'devDependencies');
  assertOptionalPeer(peerDependenciesMeta, '@ankhorage/zora');
  assertVersion(devDependencies, EXPO_PLATFORM.runtime.reactDom, 'devDependencies');
  assertVersion(devDependencies, EXPO_PLATFORM.runtime.reactNativeWeb, 'devDependencies');
  assertVersion(devDependencies, EXPO_PLATFORM.navigation.safeArea, 'devDependencies');
  assertVersion(devDependencies, EXPO_PLATFORM.tooling.nodeTypes, 'devDependencies');
  assertVersion(devDependencies, EXPO_PLATFORM.tooling.typescript, 'devDependencies');

  if (engines.node !== EXPO_PLATFORM.tooling.node.version) {
    throw new Error(
      `package.json engines.node must be '${EXPO_PLATFORM.tooling.node.version}', received '${engines.node ?? 'missing'}'.`,
    );
  }
}

function assertOptionalPeer(
  peerDependenciesMeta: Readonly<Record<string, unknown>>,
  packageName: string,
): void {
  const metadata = asRecord(Reflect.get(peerDependenciesMeta, packageName));
  if (metadata.optional !== true) {
    throw new Error(`package.json peerDependenciesMeta.${packageName}.optional must be true.`);
  }
}

function assertVersion(
  dependencies: Readonly<Record<string, string>>,
  expected: ExpoPlatformPackage,
  field: string,
): void {
  const actual = dependencies[expected.name];
  if (actual !== expected.version) {
    throw new Error(
      `package.json ${field}.${expected.name} must be '${expected.version}', received '${actual ?? 'missing'}'.`,
    );
  }
}

function assertVersionString(
  dependencies: Readonly<Record<string, string>>,
  packageName: string,
  expectedVersion: string,
  field: string,
): void {
  const actual = Reflect.get(dependencies, packageName) as unknown;
  if (actual !== expectedVersion) {
    const actualVersion = typeof actual === 'string' ? actual : 'missing';
    throw new Error(
      `package.json ${field}.${packageName} must be '${expectedVersion}', received '${actualVersion}'.`,
    );
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('Expected package.json to contain an object.');
  }
  return value as Record<string, unknown>;
}

function asStringRecord(value: unknown): Record<string, string> {
  const record = asRecord(value);
  for (const [key, entry] of Object.entries(record)) {
    if (typeof entry !== 'string') {
      throw new TypeError(`Expected '${key}' to contain a string.`);
    }
  }
  return record as Record<string, string>;
}

async function run(command: string, args: readonly string[], cwd: string): Promise<void> {
  const process = Bun.spawn([command, ...args], {
    cwd,
    env: processEnv(),
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const exitCode = await process.exited;
  if (exitCode !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with code ${exitCode}.`);
  }
}

function processEnv(): Record<string, string | undefined> {
  return {
    ...Bun.env,
    CI: '1',
  };
}
