import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { packCandidateAsync } from './packedAcceptance/packCandidateAsync';
import { runCommandAsync } from './packedAcceptance/runCommandAsync';

const repositoryRoot = path.resolve(import.meta.dir, '..');
const scratchRoot = await mkdtemp(path.join(tmpdir(), 'expo-runtime-authoring-routes-'));

try {
  const candidateDirectory = path.join(scratchRoot, 'candidate');
  const consumerRoot = path.join(scratchRoot, 'consumer');
  await mkdir(candidateDirectory, { recursive: true });
  const candidate = await packCandidateAsync(
    repositoryRoot,
    candidateDirectory,
    path.join(scratchRoot, 'npm-cache'),
  );
  await writeConsumerAsync(consumerRoot, candidate.name, candidate.path);
  await runCommandAsync('bun', ['install'], consumerRoot);
  await runCommandAsync('bun', ['run', 'authoringRouteDelivery.ts'], consumerRoot);
  console.log('Packed Authoring route delivery acceptance passed.');
} finally {
  await rm(scratchRoot, { recursive: true, force: true });
}

/*** Install only the packed Runtime candidate and the published Authoring owner package in a fresh consumer. */
async function writeConsumerAsync(
  consumerRoot: string,
  candidateName: string,
  candidatePath: string,
): Promise<void> {
  await mkdir(consumerRoot, { recursive: true });
  await Promise.all([
    Bun.write(
      path.join(consumerRoot, 'package.json'),
      `${JSON.stringify(
        {
          name: 'expo-runtime-authoring-route-delivery-acceptance',
          version: '0.0.0',
          private: true,
          type: 'module',
          dependencies: {
            [candidateName]: `file:${candidatePath}`,
            '@ankhorage/studio-authoring': '0.4.0',
          },
        },
        null,
        2,
      )}\n`,
    ),
    Bun.write(
      path.join(consumerRoot, 'authoringRouteDelivery.ts'),
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
  !files[0]?.source.includes('@ankhorage/studio-authoring/screens') ||
  !files[0]?.source.includes('getScreensAuthoringScreenProps')
) {
  throw new Error('Packed Runtime did not deliver only the published Authoring screen route.');
}
`,
    ),
  ]);
}
