import { expect, test } from 'bun:test';

test('keeps browser clipboard access behind the standard Clipboard API guard', async () => {
  const source = await Bun.file(
    new URL('./ExpoClipboardWriterProvider.web.tsx', import.meta.url),
  ).text();

  expect(source).toContain('navigator.clipboard?.writeText');
  expect(source).toContain("return 'unavailable'");
  expect(source).toContain("return 'denied'");
});
