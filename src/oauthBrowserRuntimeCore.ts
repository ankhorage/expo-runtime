export type ExpoOAuthBrowserRuntimeReadiness =
  | { readonly status: 'ready' }
  | {
      readonly status: 'unsupported';
      readonly reason: 'expo-go';
      readonly message: string;
    };

export function resolveExpoOAuthBrowserRuntimeReadinessFromExpoGoConfig(
  expoGoConfig: unknown,
): ExpoOAuthBrowserRuntimeReadiness {
  if (expoGoConfig === null) {
    return { status: 'ready' };
  }

  return {
    status: 'unsupported',
    reason: 'expo-go',
    message:
      'Brokered OAuth requires a development or standalone build with the configured app scheme; Expo Go cannot provide a stable OAuth callback scheme.',
  };
}
