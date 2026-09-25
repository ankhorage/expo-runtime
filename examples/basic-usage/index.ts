import { resolveExpoRuntimePlan } from '@ankhorage/expo-runtime';

/***
 * @title Basic Usage
 *
 * Derive the Expo packages, providers, config plugins, and runtime adapters required by an app
 * directly from its declared screen requirements. The planner keeps Expo-specific implementation
 * details out of the manifest while preserving one deterministic owner-derived runtime plan.
 *
 * This example requests barcode scanning on one screen. Expo Runtime automatically includes the
 * implied camera permission, Expo Camera dependency, permissions provider, and barcode adapter.
 *
 * @usage
 * @readme
 */
export function createBasicExpoRuntimePlan() {
  return resolveExpoRuntimePlan({
    screens: {
      scanner: {
        requires: {
          capabilities: {
            barcodeScanner: true,
          },
        },
      },
    },
  });
}
