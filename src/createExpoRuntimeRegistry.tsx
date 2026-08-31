import { type BarcodeScannerViewProps, type ReaderSurfaceProps } from '@ankhorage/zora';
import React from 'react';

import { type ComponentRegistry, createComponentRegistry } from './componentRegistry';
import { ExpoBarcodeScannerAdapter } from './ExpoBarcodeScannerAdapter';
import { ExpoReaderSurfaceAdapter } from './reader/ExpoReaderSurfaceAdapter';

const EXPO_RUNTIME_OVERRIDES: ComponentRegistry = {
  BarcodeScannerView: ExpoBarcodeScannerView,
  ReaderSurface: ExpoReaderSurface,
};

export function createExpoRuntimeRegistry(baseRegistry: ComponentRegistry): ComponentRegistry {
  return createComponentRegistry(baseRegistry, EXPO_RUNTIME_OVERRIDES);
}

function ExpoBarcodeScannerView(props: BarcodeScannerViewProps) {
  return <ExpoBarcodeScannerAdapter {...props} />;
}

function ExpoReaderSurface(props: ReaderSurfaceProps) {
  return <ExpoReaderSurfaceAdapter {...props} />;
}
