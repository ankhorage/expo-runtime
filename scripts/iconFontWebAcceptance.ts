import { access, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { chromium } from 'playwright-core';

import { packCandidateAsync } from './packedAcceptance/packCandidateAsync';
import { runCommandAsync } from './packedAcceptance/runCommandAsync';
import { writePackedRuntimeFixtureAsync } from './packedRuntimeAcceptance/writePackedRuntimeFixtureAsync';
import { startStaticServer } from './webBarcodeAcceptance/server';

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
] as const;
const repositoryRoot = path.resolve(import.meta.dir, '..');
const scratchRoot = await mkdtemp(path.join(tmpdir(), 'expo-runtime-icon-font-web-'));

try {
  const candidateDirectory = path.join(scratchRoot, 'candidate');
  const consumerRoot = path.join(scratchRoot, 'consumer');
  const outputDirectory = path.join(consumerRoot, 'dist-web');
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
    {
      includeIconFontProvider: true,
    },
  );
  await runCommandAsync('bun', ['install'], consumerRoot);
  await runCommandAsync(
    'bunx',
    ['expo', 'export', '--platform', 'web', '--output-dir', outputDirectory, '--clear'],
    consumerRoot,
  );
  await assertStaticMarkupAsync(outputDirectory);
  await assertHydrationAsync(outputDirectory);
  console.log('Packed Expo 57 icon-font web acceptance passed.');
} finally {
  await rm(scratchRoot, { recursive: true, force: true });
}

/*** Assert that static rendering retains the icon-font provider children. */
async function assertStaticMarkupAsync(outputDirectory: string): Promise<void> {
  const indexHtml = await readFile(path.join(outputDirectory, 'index.html'), 'utf8');
  if (!indexHtml.includes('Icon font runtime ready')) {
    throw new Error('Static export did not render the icon-font provider children.');
  }
}

/*** Assert that browser hydration preserves the rendered icon-font provider subtree. */
async function assertHydrationAsync(outputDirectory: string): Promise<void> {
  const executablePath = await findChromeExecutableAsync();
  const server = startStaticServer(outputDirectory);
  const browser = await chromium.launch({ executablePath, headless: true });
  const hydrationFailures: string[] = [];
  try {
    const page = await browser.newPage();
    page.on('console', (message) => {
      if (message.type() === 'error' && isHydrationFailure(message.text())) {
        hydrationFailures.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      if (isHydrationFailure(error.message)) {
        hydrationFailures.push(error.message);
      }
    });
    await page.goto(server.url.origin, { waitUntil: 'networkidle' });
    await page.getByText('Icon font runtime ready', { exact: true }).waitFor();
    if (hydrationFailures.length > 0) {
      throw new Error(`React hydration failed: ${hydrationFailures.join('\n')}`);
    }
  } finally {
    await browser.close();
    await server.stop(true);
  }
}

/*** Resolve the supported Chrome binary for browser acceptance. */
async function findChromeExecutableAsync(): Promise<string> {
  const candidates = [process.env.CHROME_PATH, ...CHROME_PATHS].filter(
    (candidate): candidate is string => candidate !== undefined,
  );
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Continue through the supported browser locations.
    }
  }
  throw new Error('Google Chrome or Chromium is required; set CHROME_PATH to its executable.');
}

/*** Recognize the production and development forms of React hydration error 418. */
function isHydrationFailure(message: string): boolean {
  return /hydration|#418|error 418/iu.test(message);
}
