import { expect, test } from 'bun:test';

test('keeps browser clipboard access behind an SSR-safe standard Clipboard API guard', async () => {
  const source = await Bun.file(
    new URL('./ExpoClipboardWriterProvider.web.tsx', import.meta.url),
  ).text();

  expect(source).toContain("Reflect.get(globalThis, 'navigator')");
  expect(source).toContain("from './createBrowserClipboardWriter'");
});
