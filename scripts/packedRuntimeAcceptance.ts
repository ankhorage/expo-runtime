import { mkdir, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { packCandidateAsync } from './packedAcceptance/packCandidateAsync';
import { readJsonFileAsync } from './packedAcceptance/readJsonFileAsync';
import { runCommandAsync } from './packedAcceptance/runCommandAsync';
import { writePackedRuntimeFixtureAsync } from './packedRuntimeAcceptance/writePackedRuntimeFixtureAsync';

interface PackageIdentity {
  readonly name?: string;
  readonly version?: string;
}

const expectedZoraMajorVersion = 4;
const expectedSurfaceMajorVersion = 3;
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
  const packageVersions = await Promise.all(
    [candidateName, '@ankhorage/zora', '@ankhorage/surface'].map(async (packageName) => {
      const identity = await readJsonFileAsync<PackageIdentity>(
        path.join(consumerRoot, 'node_modules', packageName, 'package.json'),
      );
      return [packageName, identity.version] as const;
    }),
  );
  const versions = new Map(packageVersions);
  if (versions.get(candidateName) !== candidateVersion) {
    throw new Error('Installed Expo Runtime does not match its packed candidate version.');
  }
  if (
    !isMajorVersion(versions.get('@ankhorage/zora'), expectedZoraMajorVersion) ||
    !isMajorVersion(versions.get('@ankhorage/surface'), expectedSurfaceMajorVersion)
  ) {
    throw new Error(
      `Packed root consumer did not resolve released ZORA ${expectedZoraMajorVersion} and Surface ${expectedSurfaceMajorVersion}.`,
    );
  }
  const graph = await runCommandAsync('bun', ['pm', 'ls', '--all'], consumerRoot, {
    capture: true,
  });
  if (
    /@ankhorage\/zora@[23](?:\.|\s|$)/u.test(graph) ||
    /@ankhorage\/surface@2(?:\.|\s|$)/u.test(graph)
  ) {
    throw new Error('Packed root consumer retained an unsupported ZORA or Surface dependency.');
  }
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

function isMajorVersion(version: string | undefined, expectedMajor: number): boolean {
  return version?.startsWith(`${expectedMajor}.`) ?? false;
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
  if (platform === 'web') {
    const outputFiles = await readdir(outputDirectory, { recursive: true });
    if (!outputFiles.some((name) => name.includes('pdf.worker-'))) {
      throw new Error('Packed web export did not emit the same-package PDF.js worker bundle.');
    }
  }
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
