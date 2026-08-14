export type ExpoOAuthBrowserRuntimeReadiness =
  | { readonly status: 'ready' }
  | {
      readonly status: 'unsupported';
      readonly reason: 'expo-go';
      readonly message: string;
    };

export interface ExpoOAuthBrowserRuntimeEnvironment {
  readonly appOwnership: unknown;
  readonly executionEnvironment: unknown;
  readonly expoGoConfig: unknown;
}

export function resolveExpoOAuthBrowserRuntimeReadinessFromEnvironment(
  environment: ExpoOAuthBrowserRuntimeEnvironment,
): ExpoOAuthBrowserRuntimeReadiness {
  if (environment.appOwnership !== 'expo') {
    return { status: 'ready' };
  }

  return {
    status: 'unsupported',
    reason: 'expo-go',
    message:
      'Brokered OAuth requires a development or standalone build with the configured app scheme; Expo Go cannot provide a stable OAuth callback scheme.',
  };
}
