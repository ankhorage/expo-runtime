import { expect, test } from 'bun:test';

import { createBrowserClipboardWriter } from './createBrowserClipboardWriter';

test('reports unavailable, written, and denied browser clipboard outcomes', async () => {
  expect(await createBrowserClipboardWriter(() => undefined).writeTextAsync('#2563eb')).toBe(
    'unavailable',
  );
  expect(
    await createBrowserClipboardWriter(() => ({
      clipboard: { writeText: () => Promise.resolve() },
    })).writeTextAsync('#2563eb'),
  ).toBe('written');
  expect(
    await createBrowserClipboardWriter(() => ({
      clipboard: { writeText: () => Promise.reject(new Error('denied')) },
    })).writeTextAsync('#2563eb'),
  ).toBe('denied');
});
