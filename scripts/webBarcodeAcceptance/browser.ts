import { access } from 'node:fs/promises';

import { chromium, type Page } from 'playwright-core';

import { BARCODE_ACCEPTANCE_SCENARIOS } from './fixture';
import type { BarcodeAcceptanceWindow } from './types';

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
] as const;

export async function runBrowserAcceptance(origin: string, videoPath: string): Promise<void> {
  const executablePath = await findChromeExecutable();
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      `--use-file-for-fake-video-capture=${videoPath}`,
    ],
  });
  try {
    const page = await browser.newPage();
    page.on('pageerror', (error) => console.error(`[browser:error] ${error.message}`));
    await page.addInitScript(disableNativeBarcodeDetector);
    await page.goto(origin, { waitUntil: 'networkidle' });
    const permissionButton = page.getByRole('button', { name: 'Allow camera access' });
    try {
      await permissionButton.press('Enter', { timeout: 10_000 });
    } catch (error) {
      console.error(`[browser:body] ${await page.locator('body').innerText()}`);
      throw error;
    }
    await page.waitForFunction(() => document.querySelector('video')?.readyState === 4);

    for (const scenario of BARCODE_ACCEPTANCE_SCENARIOS) {
      await waitForScan(page, scenario.type, scenario.value);
      console.log(`Recognized ${scenario.type}: ${scenario.value}`);
    }
  } finally {
    await browser.close();
  }
}

export async function findChromeExecutable(): Promise<string> {
  const candidates = [process.env.CHROME_PATH, ...CHROME_PATHS].filter(
    (path): path is string => path !== undefined,
  );
  for (const path of candidates) {
    try {
      await access(path);
      return path;
    } catch {
      // Continue through the explicit supported browser locations.
    }
  }
  throw new Error('Google Chrome or Chromium is required; set CHROME_PATH to its executable.');
}

async function waitForScan(page: Page, type: string, value: string): Promise<void> {
  await page.waitForFunction(
    ({ expectedType, expectedValue }) => {
      const fixtureWindow = window as unknown as BarcodeAcceptanceWindow;
      return fixtureWindow.__ankhorageScans.some(
        (scan) => scan.type === expectedType && scan.value === expectedValue,
      );
    },
    { expectedType: type, expectedValue: value },
    { timeout: 60_000 },
  );
}

function disableNativeBarcodeDetector(): void {
  Object.defineProperty(globalThis, 'BarcodeDetector', { configurable: true, value: undefined });
}
