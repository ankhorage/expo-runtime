import path from 'node:path';

import { runCommandAsync } from './runCommandAsync';

interface PackResult {
  readonly filename: string;
  readonly name: string;
  readonly version: string;
}

export async function packCandidateAsync(
  repositoryRoot: string,
  candidateDirectory: string,
  npmCacheDirectory: string,
) {
  await runCommandAsync('bun', ['run', 'build'], repositoryRoot);
  const output = await runCommandAsync(
    'npm',
    ['pack', '--json', '--pack-destination', candidateDirectory],
    repositoryRoot,
    { capture: true, env: { npm_config_cache: npmCacheDirectory } },
  );
  const [candidate] = JSON.parse(output) as PackResult[];
  if (!candidate) throw new Error('npm pack did not report a candidate artifact.');
  return { ...candidate, path: path.join(candidateDirectory, candidate.filename) };
}
