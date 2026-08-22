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

export async function runBrowserAcceptance(origin: string): Promise<void> {
  const executablePath = await findChromeExecutable();
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    page.on('pageerror', (error) => console.error(`[browser:error] ${error.message}`));
    await page.addInitScript(installSyntheticCamera);
    await page.goto(origin, { waitUntil: 'networkidle' });
    const permissionButton = page.getByRole('button');
    try {
      await permissionButton.click({ timeout: 10_000 });
    } catch (error) {
      console.error(`[browser:body] ${await page.locator('body').innerText()}`);
      throw error;
    }
    await page.waitForFunction(() => document.querySelector('video')?.readyState === 4);

    for (const scenario of BARCODE_ACCEPTANCE_SCENARIOS) {
      await showBarcode(page, origin, scenario.asset);
      await waitForScan(page, scenario.type, scenario.value);
      console.log(`Recognized ${scenario.type}: ${scenario.value}`);
    }
  } finally {
    await browser.close();
  }
}

async function findChromeExecutable(): Promise<string> {
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

async function showBarcode(page: Page, origin: string, asset: string): Promise<void> {
  await page.evaluate(
    async ({ barcodeUrl }) => {
      const fixtureWindow = window as unknown as BarcodeAcceptanceWindow;
      await fixtureWindow.__ankhorageCameraFixture.showBarcode(barcodeUrl);
    },
    { barcodeUrl: `${origin}/barcodes/${asset}` },
  );
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
    { timeout: 20_000 },
  );
}

function installSyntheticCamera(): void {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const context = canvas.getContext('2d');
  if (context === null) {
    throw new Error('Canvas 2D is required for the synthetic camera fixture.');
  }
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const stream = canvas.captureStream(10);
  const mediaDevices = {
    enumerateDevices: () =>
      Promise.resolve([
        { deviceId: 'fixture', groupId: 'fixture', kind: 'videoinput', label: 'back' },
      ]),
    getUserMedia: () => Promise.resolve(stream),
  };
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: mediaDevices });
  Object.defineProperty(globalThis, 'BarcodeDetector', { configurable: true, value: undefined });
  (window as unknown as BarcodeAcceptanceWindow).__ankhorageCameraFixture = {
    async showBarcode(url) {
      const image = new Image();
      image.src = url;
      await image.decode();
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(1100 / image.width, 620 / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      context.drawImage(
        image,
        (canvas.width - width) / 2,
        (canvas.height - height) / 2,
        width,
        height,
      );
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    },
  };
}
