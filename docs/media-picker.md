# Expo media picker boundary

`@ankhorage/expo-runtime/media-picker` owns the Expo-specific selection step used by trusted authoring hosts.

The adapter supports two transient sources:

- `file` uses `expo-document-picker` and can select image, audio, video, font, or generic file media.
- `photo-library` uses `expo-image-picker` and is limited to image and video media.

A successful selection contains a `Uint8Array` plus canonical metadata such as file name, MIME type, dimensions, duration, and size. Local picker URIs are consumed internally to read bytes and are never returned from the public adapter. This keeps `file:`, `content:`, and `blob:` values out of manifest-authoring state.

The picker does not upload, persist, resolve, or delete media. A trusted host must pass the returned bytes to a provider-neutral storage adapter and only then create a canonical media asset with stable storage identity.

The media-picker subpath keeps `expo-document-picker`, `expo-file-system`, and `expo-image-picker` as optional peer dependencies so applications that do not use authoring media selection do not acquire those platform modules through the root runtime entry point.
