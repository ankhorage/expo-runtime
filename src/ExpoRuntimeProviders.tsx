import React from 'react';

import { createPermissionClient, PermissionsProvider } from './permissionRuntime';
import type { ExpoRuntimeProviderId } from './resolveExpoRuntimePlan';

const permissionClient = createPermissionClient();

export interface ExpoRuntimeProvidersProps {
  readonly children: React.ReactNode;
  readonly providers?: readonly ExpoRuntimeProviderId[];
}

export function ExpoRuntimeProviders(props: ExpoRuntimeProvidersProps) {
  const { children, providers = [] } = props;

  if (providers.includes('permissions')) {
    return <PermissionsProvider client={permissionClient}>{children}</PermissionsProvider>;
  }

  return <>{children}</>;
}
