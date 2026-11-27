import { ClipboardWriterProvider } from '@ankhorage/runtime';
import React from 'react';

import { createBrowserClipboardWriter } from './createBrowserClipboardWriter';

const browserClipboardWriter = createBrowserClipboardWriter(Reflect.get(globalThis, 'navigator'));

/*** Installs the standard browser Clipboard API as the web host writer for Runtime consumers. */
export function ExpoClipboardWriterProvider(props: { readonly children: React.ReactNode }) {
  return (
    <ClipboardWriterProvider writer={browserClipboardWriter}>
      {props.children}
    </ClipboardWriterProvider>
  );
}
