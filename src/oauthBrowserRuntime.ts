import Constants from 'expo-constants';

import {
  type ExpoOAuthBrowserRuntimeReadiness,
  resolveExpoOAuthBrowserRuntimeReadinessFromExpoGoConfig,
} from './oauthBrowserRuntimeCore';

export type { ExpoOAuthBrowserRuntimeReadiness } from './oauthBrowserRuntimeCore';

export function resolveExpoOAuthBrowserRuntimeReadiness(): ExpoOAuthBrowserRuntimeReadiness {
  return resolveExpoOAuthBrowserRuntimeReadinessFromExpoGoConfig(Constants.expoGoConfig);
}
