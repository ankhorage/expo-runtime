import { type BarcodeScannerViewProps } from '@ankhorage/zora';
import React from 'react';

import { type ComponentRegistry, createComponentRegistry } from './componentRegistry';
import { ExpoBarcodeScannerAdapter } from './ExpoBarcodeScannerAdapter';

const EXPO_RUNTIME_OVERRIDES: ComponentRegistry = {
  BarcodeScannerView: ExpoBarcodeScannerView,
};

export function createExpoRuntimeRegistry(baseRegistry: ComponentRegistry): ComponentRegistry {
  return createComponentRegistry(baseRegistry, EXPO_RUNTIME_OVERRIDES);
}

function ExpoBarcodeScannerView(props: BarcodeScannerViewProps) {
  return <ExpoBarcodeScannerAdapter {...props} />;
}
