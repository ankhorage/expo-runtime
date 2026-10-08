import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { packCandidateAsync } from './packedAcceptance/packCandidateAsync';
import { readJsonFileAsync } from './packedAcceptance/readJsonFileAsync';
import { runCommandAsync } from './packedAcceptance/runCommandAsync';
import { writePackedRuntimeFixtureAsync } from './packedRuntimeAcceptance/writePackedRuntimeFixtureAsync';

interface PackageIdentity {
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly name?: string;
  readonly peerDependencies?: Readonly<Record<string, string>>;
  readonly version?: string;
}
const repositoryRoot = path.resolve(import.meta.dir, '..');
const scratchRoot = await mkdtemp(path.join(tmpdir(), 'expo-runtime-packed-root-'));

try {
  const candidateDirectory = path.join(scratchRoot, 'candidate');
  const consumerRoot = path.join(scratchRoot, 'consumer');
  await mkdir(candidateDirectory, { recursive: true });
  const candidate = await packCandidateAsync(
    repositoryRoot,
    candidateDirectory,
    path.join(scratchRoot, 'npm-cache'),
  );
  await writePackedRuntimeFixtureAsync(
    consumerRoot,
    repositoryRoot,
    candidate.name,
    candidate.path,
  );
  await runCommandAsync('bun', ['install'], consumerRoot);
  await assertInstalledGraphAsync(consumerRoot, candidate.name, candidate.version);

  await runCommandAsync('bunx', ['expo', 'install', '--check'], consumerRoot);
  await runCommandAsync('bunx', ['expo-doctor'], consumerRoot);
  await runCommandAsync('bunx', ['tsc', '--noEmit', '-p', 'tsconfig.json'], consumerRoot);
  await runCommandAsync('bunx', ['react-compiler-healthcheck@latest'], consumerRoot);
  await exportPlatformAsync(consumerRoot, 'web');
  await exportPlatformAsync(consumerRoot, 'android');
  await exportPlatformAsync(consumerRoot, 'ios');
  await prebuildPlatformAsync(consumerRoot, 'android');
  await prebuildPlatformAsync(consumerRoot, 'ios');

  console.log('Packed Expo Runtime root acceptance passed.');
} finally {
  await rm(scratchRoot, { recursive: true, force: true });
}

async function assertInstalledGraphAsync(
  consumerRoot: string,
  candidateName: string,
  candidateVersion: string,
): Promise<void> {
  const candidateManifest = await readInstalledPackageAsync(consumerRoot, candidateName);
  const zoraManifest = await readInstalledPackageAsync(consumerRoot, '@ankhorage/zora');
  const surfaceManifest = await readInstalledPackageAsync(consumerRoot, '@ankhorage/surface');

  if (candidateManifest.version !== candidateVersion) {
    throw new Error('Installed Expo Runtime does not match its packed candidate version.');
  }

  const zoraRange = candidateManifest.peerDependencies?.['@ankhorage/zora'];
  assertVersionMatchesCaretRange(zoraManifest.version, zoraRange, '@ankhorage/zora');

  const surfaceRange =
    zoraManifest.dependencies?.['@ankhorage/surface'] ??
    zoraManifest.peerDependencies?.['@ankhorage/surface'];
  assertVersionMatchesCaretRange(surfaceManifest.version, surfaceRange, '@ankhorage/surface');
  const packageJson = await readJsonFileAsync<{ dependencies?: Record<string, string> }>(
    path.join(consumerRoot, 'package.json'),
  );
  const fileDependencies = Object.entries(packageJson.dependencies ?? {}).filter(([, version]) =>
    version.startsWith('file:'),
  );
  if (fileDependencies.length !== 1 || fileDependencies[0]?.[0] !== candidateName) {
    throw new Error('Only the packed Expo Runtime candidate may use the file protocol.');
  }
}

async function readInstalledPackageAsync(
  consumerRoot: string,
  packageName: string,
): Promise<PackageIdentity> {
  return readJsonFileAsync<PackageIdentity>(
    path.join(consumerRoot, 'node_modules', packageName, 'package.json'),
  );
}

function assertVersionMatchesCaretRange(
  version: string | undefined,
  range: string | undefined,
  packageName: string,
): void {
  const versionParts = parseVersion(version);
  const rangeParts = parseCaretRange(range);
  if (!versionParts || !rangeParts || !satisfiesCaret(versionParts, rangeParts)) {
    throw new Error(
      `Packed root consumer resolved ${packageName}@${version ?? 'missing'}, which does not satisfy ${range ?? 'missing'}.`,
    );
  }
}

function parseVersion(value: string | undefined): readonly [number, number, number] | undefined {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/u.exec(value ?? '');
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : undefined;
}

function parseCaretRange(value: string | undefined): readonly [number, number, number] | undefined {
  const match = /^\^(\d+)\.(\d+)\.(\d+)$/u.exec(value ?? '');
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : undefined;
}

function satisfiesCaret(
  version: readonly [number, number, number],
  minimum: readonly [number, number, number],
): boolean {
  const [major, minor, patch] = version;
  const [minimumMajor, minimumMinor, minimumPatch] = minimum;
  if (major !== minimumMajor) return false;
  if (minimumMajor === 0 && minor !== minimumMinor) return false;
  if (minor < minimumMinor) return false;
  return minor > minimumMinor || patch >= minimumPatch;
}

async function exportPlatformAsync(
  consumerRoot: string,
  platform: 'android' | 'ios' | 'web',
): Promise<void> {
  const outputDirectory = path.join(consumerRoot, `dist-${platform}`);
  await runCommandAsync(
    'bunx',
    ['expo', 'export', '--platform', platform, '--output-dir', outputDirectory, '--clear'],
    consumerRoot,
  );

}

async function prebuildPlatformAsync(
  consumerRoot: string,
  platform: 'android' | 'ios',
): Promise<void> {
  await runCommandAsync(
    'bunx',
    ['expo', 'prebuild', '--clean', '--no-install', '--platform', platform],
    consumerRoot,
  );
  if (platform === 'android') {
    const manifest = await readFile(
      path.join(consumerRoot, 'android/app/src/main/AndroidManifest.xml'),
      'utf8',
    );
    if (!manifest.includes('android.permission.CAMERA')) {
      throw new Error('Android prebuild is missing the Expo Camera permission.');
    }
    return;
  }
  const infoPlist = await readFile(
    path.join(consumerRoot, 'ios/ExpoRuntimePackedAcceptance/Info.plist'),
    'utf8',
  );
  if (!infoPlist.includes('Allow runtime acceptance camera access.')) {
    throw new Error('iOS prebuild is missing the configured camera permission text.');
  }
}
