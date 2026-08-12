import { pickDocumentMedia } from './documentPicker';
import { pickPhotoLibraryMedia } from './photoLibraryPicker';
import type { ExpoMediaPickerAdapter } from './types';

export function createExpoMediaPickerAdapter(): ExpoMediaPickerAdapter {
  return {
    pick: (input) =>
      input.source === 'photo-library' ? pickPhotoLibraryMedia(input) : pickDocumentMedia(input),
  };
}
