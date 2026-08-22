import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runBrowserAcceptance } from './webBarcodeAcceptance/browser';
import { createWebBarcodeFixture } from './webBarcodeAcceptance/fixture';
import { runCommand } from './webBarcodeAcceptance/process';
import { startStaticServer } from './webBarcodeAcceptance/server';

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const fixtureRoot = await mkdtemp(join(tmpdir(), 'ankhorage-web-barcode-'));

try {
  await runCommand('npm', ['pack', '--silent', '--pack-destination', fixtureRoot], repositoryRoot);
  const packedFiles = (await readdir(fixtureRoot)).filter((name) => name.endsWith('.tgz'));
  if (packedFiles.length !== 1 || packedFiles[0] === undefined) {
    throw new Error(`Expected one packed runtime archive, received ${packedFiles.length}.`);
  }
  const runtimePackagePath = join(fixtureRoot, packedFiles[0]);
  const videoPath = await createWebBarcodeFixture(fixtureRoot, repositoryRoot, runtimePackagePath);
  await runCommand('bun', ['install'], fixtureRoot);
  await runCommand(
    join(fixtureRoot, 'node_modules/.bin/expo'),
    ['export', '--platform', 'web'],
    fixtureRoot,
  );
  const server = startStaticServer(join(fixtureRoot, 'dist'));
  try {
    await runBrowserAcceptance(server.url.origin, videoPath);
  } finally {
    await server.stop(true);
  }
} finally {
  await rm(fixtureRoot, { recursive: true, force: true });
}
