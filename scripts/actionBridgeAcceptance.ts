import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { assertPackedCandidateAsync } from './packedAcceptance/assertPackedCandidateAsync';
import { packCandidateAsync } from './packedAcceptance/packCandidateAsync';
import { runCommandAsync } from './packedAcceptance/runCommandAsync';

const repositoryRoot = path.resolve(import.meta.dir, '..');
const scratchRoot = await mkdtemp(path.join(tmpdir(), 'expo-runtime-action-bridge-'));

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
  await runCommandAsync('bun', ['action-bridge-check.ts'], consumerRoot);
  await assertPackedCandidateAsync({
    candidateFilename: candidate.filename,
    candidateName: candidate.name,
    candidateVersion: candidate.version,
    consumerRoot,
  });
  await assertStandaloneGraphAsync(consumerRoot);

  console.log('Packed Expo Runtime action bridge is independently consumable.');
} finally {
  await rm(scratchRoot, { recursive: true, force: true });
}

async function assertStandaloneGraphAsync(consumerRoot: string): Promise<void> {
  const prohibitedPackages = [
    '@ankhorage/permissions',
    '@ankhorage/zora',
    'expo',
    'expo-camera',
    'react',
    'react-native',
  ];
  const graph = await runCommandAsync('bun', ['pm', 'ls', '--all'], consumerRoot, {
    capture: true,
  });

  for (const packageName of prohibitedPackages) {
    const packagePath = path.join(consumerRoot, 'node_modules', packageName, 'package.json');
    if ((await Bun.file(packagePath).exists()) || graph.includes(`${packageName}@`)) {
      throw new Error(`Action bridge consumer unexpectedly installed ${packageName}.`);
    }
  }
}

async function writeFixtureAsync(
  consumerRoot: string,
  candidateName: string,
  candidatePath: string,
): Promise<void> {
  const packageJson = {
    name: 'expo-runtime-action-bridge-acceptance',
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
    path.join(consumerRoot, 'action-bridge-check.ts'),
    `import {
  executeExpoRuntimeAction,
  resolveExpoRuntimeRoutePath,
} from '@ankhorage/expo-runtime/action-bridge';

const pushes: unknown[] = [];
await executeExpoRuntimeAction({
  action: { type: 'navigate', payload: { route: 'projects/[id]', params: { id: 42 } } },
  router: { push: (target) => pushes.push(target) },
  mode: 'light',
  setMode: () => undefined,
});
const resolved = resolveExpoRuntimeRoutePath('/projects/[id]', { id: 42 });
if (JSON.stringify(pushes) !== JSON.stringify([{ pathname: '/projects/42', params: {} }])) {
  throw new Error('Action bridge navigation execution failed.');
}
if (resolved.resolvedPath !== '/projects/42') {
  throw new Error('Action bridge route resolution failed.');
}
`,
  );
}
