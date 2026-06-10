import { afterEach, describe, expect, it, mock } from 'bun:test';
import React from 'react';

describe('ExpoRuntimeProviders', () => {
  afterEach(() => {
    mock.restore();
  });

  it('wraps children in PermissionsProvider when the permissions runtime is enabled', async () => {
    const permissionClient = { name: 'permission-client' };
    const PermissionsProvider = ({
      children,
      client,
    }: {
      children: React.ReactNode;
      client: unknown;
    }) => React.createElement('permissions-provider', { client }, children);

    void mock.module('./permissionRuntime', () => ({
      PermissionsProvider,
      createPermissionClient: () => permissionClient,
    }));

    const { ExpoRuntimeProviders } = await import('./ExpoRuntimeProviders');
    const child = React.createElement('child');
    const element = ExpoRuntimeProviders({
      children: child,
      providers: ['permissions'],
    });

    expect(React.isValidElement(element)).toBe(true);
    if (!React.isValidElement(element)) {
      throw new Error('expected a React element');
    }

    expect(element.type).toBe(PermissionsProvider);
    expect(element.props.client).toBe(permissionClient);
    expect(element.props.children).toBe(child);
  });

  it('returns children unchanged when no runtime providers are enabled', async () => {
    void mock.module('./permissionRuntime', () => ({
      PermissionsProvider: ({ children }: { children: React.ReactNode }) => children,
      createPermissionClient: () => ({ name: 'permission-client' }),
    }));

    const { ExpoRuntimeProviders } = await import('./ExpoRuntimeProviders');
    const child = React.createElement('child');
    const element = ExpoRuntimeProviders({
      children: child,
      providers: [],
    });

    expect(React.isValidElement(element)).toBe(true);
    if (!React.isValidElement(element)) {
      throw new Error('expected a React element');
    }

    expect(element.props.children).toBe(child);
  });
});
