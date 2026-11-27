import { type ClipboardWriter, ClipboardWriterProvider } from '@ankhorage/runtime';
import React from 'react';

const browserClipboardWriter: ClipboardWriter = {
  writeTextAsync: async (text) => {
    const browserNavigator = Reflect.get(globalThis, 'navigator');
    if (!isClipboardNavigator(browserNavigator)) return 'unavailable';

    try {
      await browserNavigator.clipboard.writeText(text);
      return 'written';
    } catch {
      return 'denied';
    }
  },
};

/*** Installs the standard browser Clipboard API as the web host writer for Runtime consumers. */
export function ExpoClipboardWriterProvider(props: { readonly children: React.ReactNode }) {
  return (
    <ClipboardWriterProvider writer={browserClipboardWriter}>
      {props.children}
    </ClipboardWriterProvider>
  );
}

/*** Narrows an optional browser host object without assuming browser globals during server rendering. */
function isClipboardNavigator(value: unknown): value is {
  readonly clipboard: { readonly writeText: (text: string) => Promise<void> };
} {
  if (typeof value !== 'object' || value === null || !('clipboard' in value)) return false;
  const { clipboard } = value;
  return (
    typeof clipboard === 'object' &&
    clipboard !== null &&
    'writeText' in clipboard &&
    typeof clipboard.writeText === 'function'
  );
}
