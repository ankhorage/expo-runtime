import { afterEach, describe, expect, it, mock } from 'bun:test';
import React from 'react';

const BaseBarcodeScannerView = (): React.ReactElement => React.createElement(React.Fragment);
const BaseText = (): React.ReactElement => React.createElement(React.Fragment);
const MockExpoBarcodeScannerAdapter = (): React.ReactElement => React.createElement(React.Fragment);

describe('createExpoRuntimeRegistry', () => {
  afterEach(() => {
    mock.restore();
  });

  it('overrides BarcodeScannerView while preserving unrelated registry entries', async () => {
    void mock.module('./ExpoBarcodeScannerAdapter', () => ({
      ExpoBarcodeScannerAdapter: MockExpoBarcodeScannerAdapter,
    }));

    const { createExpoRuntimeRegistry } = await import('./createExpoRuntimeRegistry');
    const baseRegistry = {
      BarcodeScannerView: BaseBarcodeScannerView,
      Text: BaseText,
    };

    const registry = createExpoRuntimeRegistry(baseRegistry);

    expect(registry).not.toBe(baseRegistry);
    expect(registry.Text).toBe(BaseText);
    expect(registry.BarcodeScannerView).not.toBe(BaseBarcodeScannerView);
    expect(typeof registry.BarcodeScannerView).toBe('function');
  });
});
