import type { ClipboardWriter } from '@ankhorage/runtime';

/*** Creates a standard-browser clipboard writer with explicit unavailable and denied outcomes. */
export function createBrowserClipboardWriter(
  resolveBrowserNavigator: () => unknown,
): ClipboardWriter {
  return {
    writeTextAsync: async (text) => {
      const browserNavigator = resolveBrowserNavigator();
      if (!isClipboardNavigator(browserNavigator)) return 'unavailable';
      try {
        await browserNavigator.clipboard.writeText(text);
        return 'written';
      } catch {
        return 'denied';
      }
    },
  };
}

function isClipboardNavigator(value: unknown): value is {
  readonly clipboard: { readonly writeText: (text: string) => Promise<void> };
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'clipboard' in value &&
    typeof value.clipboard === 'object' &&
    value.clipboard !== null &&
    'writeText' in value.clipboard &&
    typeof value.clipboard.writeText === 'function'
  );
}
