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
  await runCommandAsync('bunx', ['tsc', '--noEmit', '-p', 'tsconfig.json'], consumerRoot);
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
  await mkdir(path.join(consumerRoot, 'app', 'ankh'), { recursive: true });
  await mkdir(path.join(consumerRoot, 'authoring'), { recursive: true });
  await Promise.all([
    writePackageAsync(consumerRoot, candidateName, candidatePath),
    writeRouteDeliveryScriptAsync(consumerRoot),
    writeScreensHostAsync(consumerRoot),
    writeTypeScriptConfigAsync(consumerRoot),
  ]);
}

/*** Declare the packed Runtime candidate and published route owners used by the isolated consumer. */
function writePackageAsync(
  consumerRoot: string,
  candidateName: string,
  candidatePath: string,
): Promise<number> {
  return Bun.write(
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
          '@ankhorage/zora': '^27.2.0',
          react: '19.2.3',
          'react-native': '0.86.3',
        },
        devDependencies: {
          typescript: '~6.0.3',
        },
      },
      null,
      2,
    )}\n`,
  );
}

/*** Materialize the packed public route output inside the fresh consumer application. */
function writeRouteDeliveryScriptAsync(consumerRoot: string): Promise<number> {
  return Bun.write(
    path.join(consumerRoot, 'authoringRouteDelivery.ts'),
    `import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { getExpoAuthoringRouteFiles } from '@ankhorage/expo-runtime/route-delivery';
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

const [file] = files;
if (!file) throw new Error('Packed Runtime did not produce the Authoring route file.');
await mkdir(path.join(import.meta.dir, 'app', 'ankh'), { recursive: true });
await Bun.write(path.join(import.meta.dir, 'app', file.relativePath), file.source);
`,
  );
}

/*** Supply the explicit host-owned props port required by the published screen owner. */
function writeScreensHostAsync(consumerRoot: string): Promise<number> {
  return Bun.write(
    path.join(consumerRoot, 'authoring', 'screensHost.ts'),
    `import type { ScreensAuthoringScreenProps } from '@ankhorage/studio-authoring/screens';

export function getScreensAuthoringScreenProps(): ScreensAuthoringScreenProps {
  return { screens: [] };
}
`,
  );
}

/*** Configure the consumer compiler to resolve the generated Expo Router route and host port. */
function writeTypeScriptConfigAsync(consumerRoot: string): Promise<number> {
  return Bun.write(
    path.join(consumerRoot, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          jsx: 'react-jsx',
          module: 'ESNext',
          moduleResolution: 'bundler',
          noEmit: true,
          skipLibCheck: true,
          strict: true,
        },
        include: ['app/**/*.tsx', 'authoring/**/*.ts'],
      },
      null,
      2,
    )}\n`,
  );
}
