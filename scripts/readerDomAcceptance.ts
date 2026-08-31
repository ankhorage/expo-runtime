import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { chromium } from 'playwright-core';

import { findChromeExecutable } from './webBarcodeAcceptance/browser';
import { startStaticServer } from './webBarcodeAcceptance/server';

const fixtureRoot = await mkdtemp(path.join(tmpdir(), 'expo-reader-dom-'));
const sanitizerPath = path.resolve(import.meta.dir, '../src/reader/epub/sanitizeEpubDocument.ts');

try {
  await Bun.write(path.join(fixtureRoot, 'entry.ts'), createBrowserEntry(sanitizerPath));
  const build = await Bun.build({
    entrypoints: [path.join(fixtureRoot, 'entry.ts')],
    format: 'iife',
    outdir: fixtureRoot,
    target: 'browser',
  });
  if (!build.success) throw new Error('Could not bundle the reader DOM safety acceptance.');
  const entryOutput = build.outputs.find((output) => output.kind === 'entry-point');
  if (!entryOutput) throw new Error('Reader DOM acceptance bundle has no entry output.');
  await Bun.write(
    path.join(fixtureRoot, 'index.html'),
    '<!doctype html><html><head><link rel="icon" href="data:," /></head><body></body></html>',
  );
  const server = startStaticServer(fixtureRoot);
  const browser = await chromium.launch({
    executablePath: await findChromeExecutable(),
    headless: true,
  });
  try {
    const page = await browser.newPage();
    page.on('pageerror', (error) => console.error(`[reader-dom:error] ${error.message}`));
    page.on('console', (message) => console.error(`[reader-dom:console] ${message.text()}`));
    page.on('requestfailed', (request) =>
      console.error(`[reader-dom:request] ${request.url()} ${request.failure()?.errorText}`),
    );
    page.on('response', (response) => {
      if (response.status() >= 400)
        console.error(`[reader-dom:response] ${response.status()} ${response.url()}`);
    });
    await page.goto(server.url.origin, { waitUntil: 'networkidle' });
    await page.addScriptTag({ path: entryOutput.path });
    await page.waitForFunction(() => document.body.textContent.length > 0);
    const serializedResult = await page.evaluate(() => document.body.textContent);
    const result = JSON.parse(serializedResult) as unknown;
    assertAcceptanceResult(result);
  } finally {
    await browser.close();
    await server.stop(true);
  }
  console.log('Reader DOM content-safety acceptance passed.');
} finally {
  await rm(fixtureRoot, { force: true, recursive: true });
}

function createBrowserEntry(modulePath: string): string {
  return `import { sanitizeEpubDocument } from ${JSON.stringify(modulePath)};
const source = \`<html xmlns="http://www.w3.org/1999/xhtml"><head>
  <style>@import "https://evil.test/theme.css"; body { background: url(https://evil.test/bg.png) }</style>
</head><body onload="globalThis.pwned = true">
  <script>globalThis.pwned = true</script><form action="https://evil.test"><input /></form>
  <iframe src="https://evil.test/frame"></iframe><object data="https://evil.test/object"></object>
  <img id="remote" src="https://evil.test/image.png" srcset="https://evil.test/2x.png 2x" />
  <img id="local" src="../images/cover.png" />
  <a id="external" href="https://example.test/read">External</a>
  <a id="active" href="javascript:alert(1)">Active</a>
</body></html>\`;
const output = sanitizeEpubDocument(source, 'OPS/text/chapter.xhtml', (resourcePath) =>
  resourcePath === 'OPS/images/cover.png' ? 'blob:https://reader.test/cover' : undefined,
);
const publication = new DOMParser().parseFromString(output, 'application/xhtml+xml');
const result = {
  activeHref: publication.querySelector('#active')?.getAttribute('href'),
  externalHref: publication.querySelector('#external')?.getAttribute('href'),
  externalEvent: publication.querySelector('#external')?.getAttribute('data-reader-external-href'),
  localSource: publication.querySelector('#local')?.getAttribute('src'),
  remoteSource: publication.querySelector('#remote')?.getAttribute('src'),
  removedActiveElements: publication.querySelectorAll('script, form, iframe, object').length,
  retainedEventHandlers: publication.querySelectorAll('[onload]').length,
  serialized: output,
};
document.body.textContent = JSON.stringify(result);
`;
}

function assertAcceptanceResult(value: unknown): void {
  if (!isAcceptanceResult(value)) throw new Error('Reader DOM acceptance returned invalid data.');
  if (value.removedActiveElements !== 0 || value.retainedEventHandlers !== 0) {
    throw new Error('Reader DOM sanitizer retained active publication content.');
  }
  if (value.remoteSource !== null || value.localSource !== 'blob:https://reader.test/cover') {
    throw new Error('Reader DOM sanitizer did not enforce local-only subresources.');
  }
  if (
    value.externalHref !== null ||
    value.externalEvent !== 'https://example.test/read' ||
    value.activeHref !== null
  ) {
    throw new Error('Reader DOM sanitizer did not enforce external-link interception.');
  }
  if (/javascript:|@import|evil\.test/u.test(value.serialized)) {
    throw new Error('Reader DOM sanitizer retained an active or remote resource reference.');
  }
}

interface AcceptanceResult {
  readonly activeHref: string | null;
  readonly externalEvent: string | null;
  readonly externalHref: string | null;
  readonly localSource: string | null;
  readonly remoteSource: string | null;
  readonly removedActiveElements: number;
  readonly retainedEventHandlers: number;
  readonly serialized: string;
}

function isAcceptanceResult(value: unknown): value is AcceptanceResult {
  if (typeof value !== 'object' || value === null) return false;
  return (
    typeof Reflect.get(value, 'removedActiveElements') === 'number' &&
    typeof Reflect.get(value, 'retainedEventHandlers') === 'number' &&
    typeof Reflect.get(value, 'serialized') === 'string'
  );
}
