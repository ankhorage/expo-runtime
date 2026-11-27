import { type ClipboardWriter, ClipboardWriterProvider } from '@ankhorage/runtime';
import * as Clipboard from 'expo-clipboard';
import React from 'react';

const expoClipboardWriter: ClipboardWriter = {
  writeTextAsync: async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      return 'written';
    } catch {
      return 'denied';
    }
  },
};

/*** Installs Expo Clipboard as the native host writer for Runtime consumers. */
export function ExpoClipboardWriterProvider(props: { readonly children: React.ReactNode }) {
  return (
    <ClipboardWriterProvider writer={expoClipboardWriter}>{props.children}</ClipboardWriterProvider>
  );
}
