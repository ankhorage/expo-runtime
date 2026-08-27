import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { assertPackedCandidateAsync } from './packedAcceptance/assertPackedCandidateAsync';
import { packCandidateAsync } from './packedAcceptance/packCandidateAsync';
import { runCommandAsync } from './packedAcceptance/runCommandAsync';

const repositoryRoot = path.resolve(import.meta.dir, '..');
const scratchRoot = await mkdtemp(path.join(tmpdir(), 'expo-runtime-headless-platform-'));

try {
  const candidateDirectory = path.join(scratchRoot, 'candidate');
  const consumerRoot = path.join(scratchRoot, 'consumer');
  await mkdir(candidateDirectory, { recursive: true });
  await mkdir(consumerRoot, { recursive: true });
  const candidate = await packCandidateAsync(
    repositoryRoot,
    candidateDirectory,
    path.join(scratchRoot, 'npm-cache'),
  );

  await writeFixtureAsync(consumerRoot, candidate.name, candidate.path);
  await runCommandAsync('bun', ['install'], consumerRoot);
  await runCommandAsync('bun', ['platform-check.ts'], consumerRoot);
  await assertPackedCandidateAsync({
    candidateFilename: candidate.filename,
    candidateName: candidate.name,
    candidateVersion: candidate.version,
    consumerRoot,
  });
  await assertHeadlessGraphAsync(consumerRoot);

  console.log('Packed Expo Runtime platform subpath is independently consumable.');
} finally {
  await rm(scratchRoot, { recursive: true, force: true });
}

async function assertHeadlessGraphAsync(consumerRoot: string): Promise<void> {
  const prohibitedPackages = [
    '@ankhorage/permissions',
    '@ankhorage/surface',
    '@ankhorage/zora',
    'expo',
    'expo-camera',
    'expo-router',
    'react',
    'react-native',
  ];
  const graph = await runCommandAsync('bun', ['pm', 'ls', '--all'], consumerRoot, {
    capture: true,
  });
  for (const packageName of prohibitedPackages) {
    const manifestPath = path.join(consumerRoot, 'node_modules', packageName, 'package.json');
    if (await Bun.file(manifestPath).exists()) {
      throw new Error(`Headless platform consumer unexpectedly installed ${packageName}.`);
    }
    if (graph.includes(`${packageName}@`)) {
      throw new Error(`Headless dependency graph unexpectedly contains ${packageName}.`);
    }
  }
  console.log(`Headless installed graph:\n${graph}`);
}

async function writeFixtureAsync(
  consumerRoot: string,
  candidateName: string,
  candidatePath: string,
): Promise<void> {
  const packageJson = {
    name: 'expo-runtime-headless-platform-acceptance',
    version: '0.0.0',
    private: true,
    type: 'module',
    engines: { node: '24.x' },
    dependencies: { [candidateName]: `file:${candidatePath}` },
  };
  await Bun.write(
    path.join(consumerRoot, 'package.json'),
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );
  await Bun.write(
    path.join(consumerRoot, 'platform-check.ts'),
    `import { EXPO_PLATFORM } from '@ankhorage/expo-runtime/platform';

if (EXPO_PLATFORM.sdk !== 57) throw new Error('Expected Expo SDK 57.');
if (EXPO_PLATFORM.runtime.expo.version !== '57.0.17') throw new Error('Unexpected Expo version.');
if (EXPO_PLATFORM.packages.camera.version !== '~57.0.4') throw new Error('Unexpected Camera version.');
if (EXPO_PLATFORM.tooling.typescript.version !== '~6.0.3') throw new Error('Unexpected TypeScript version.');
console.log(JSON.stringify(EXPO_PLATFORM));
`,
  );
}
