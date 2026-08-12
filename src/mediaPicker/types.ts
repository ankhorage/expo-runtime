import type { MediaAssetKind } from '@ankhorage/contracts';

export const EXPO_MEDIA_PICKER_SOURCES = ['file', 'photo-library'] as const;

export type ExpoMediaPickerSource = (typeof EXPO_MEDIA_PICKER_SOURCES)[number];

export interface ExpoMediaPickerInput {
  readonly source: ExpoMediaPickerSource;
  readonly mediaKinds?: readonly MediaAssetKind[];
}

export interface ExpoMediaPickerSelection {
  readonly kind: MediaAssetKind;
  readonly name: string;
  readonly body: Uint8Array;
  readonly contentType?: string;
  readonly sizeBytes?: number;
  readonly width?: number;
  readonly height?: number;
  readonly durationMs?: number;
}

export type ExpoMediaPickerFailureReason =
  | 'cancelled'
  | 'empty-selection'
  | 'picker-failed'
  | 'read-failed'
  | 'unsupported-kind';

export type ExpoMediaPickerResult =
  | { readonly ok: true; readonly selection: ExpoMediaPickerSelection }
  | { readonly ok: false; readonly reason: ExpoMediaPickerFailureReason };

export interface ExpoMediaPickerAdapter {
  pick(input: ExpoMediaPickerInput): Promise<ExpoMediaPickerResult>;
}
