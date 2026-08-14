import Constants from 'expo-constants';

import {
  type ExpoOAuthBrowserRuntimeReadiness,
  resolveExpoOAuthBrowserRuntimeReadinessFromEnvironment,
} from './oauthBrowserRuntimeCore';

export type { ExpoOAuthBrowserRuntimeReadiness } from './oauthBrowserRuntimeCore';

export function resolveExpoOAuthBrowserRuntimeReadiness(): ExpoOAuthBrowserRuntimeReadiness {
  return resolveExpoOAuthBrowserRuntimeReadinessFromEnvironment({
    appOwnership: Constants.appOwnership,
    executionEnvironment: Constants.executionEnvironment,
    expoGoConfig: Constants.expoGoConfig,
  });
}
