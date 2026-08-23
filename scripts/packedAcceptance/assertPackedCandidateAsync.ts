import path from 'node:path';

import { readJsonFileAsync } from './readJsonFileAsync';

export async function assertPackedCandidateAsync(args: {
  readonly candidateFilename: string;
  readonly candidateName: string;
  readonly candidateVersion: string;
  readonly consumerRoot: string;
}): Promise<void> {
  const manifest = await readJsonFileAsync<{ name?: string; version?: string }>(
    path.join(args.consumerRoot, 'node_modules', args.candidateName, 'package.json'),
  );
  if (manifest.name !== args.candidateName || manifest.version !== args.candidateVersion) {
    throw new Error('Installed candidate metadata does not match the packed artifact.');
  }

  const lockfile = await Bun.file(path.join(args.consumerRoot, 'bun.lock')).text();
  if (!lockfile.includes(args.candidateFilename)) {
    throw new Error('Consumer lockfile does not resolve the actual packed candidate tarball.');
  }
}
