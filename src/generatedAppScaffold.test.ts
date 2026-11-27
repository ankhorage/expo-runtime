import { expect, test } from 'bun:test';

import { resolveExpoRuntimeGeneratedAppScaffold } from './generatedAppScaffold';
import { EXPO_PLATFORM } from './platform';
import type { ExpoRuntimePlan } from './resolveExpoRuntimePlan';

const MANIFEST = {
  metadata: {
    category: 'utilities_tools',
    name: 'Generated App',
    slug: 'generated-app',
    themeId: 'default',
    version: '1.2.3',
  },
};

const PLAN: ExpoRuntimePlan = {
  capabilities: [],
  dependencies: [{ name: 'expo-camera', version: '~57.0.6', reasons: [] }],
  diagnostics: [],
  impliedPermissions: [],
  nativeConfig: {
    androidPermissions: ['android.permission.CAMERA'],
    configHints: [],
    plugins: [{ name: 'expo-camera' }],
  },
  needsPermissionsProvider: true,
  permissions: [],
  providers: ['permissions'],
  runtimeAdapters: [],
  usesExpoRuntimeRegistry: false,
};

test('emits deterministic portable package, Expo config, and Runtime shell sources', () => {
  const result = resolveExpoRuntimeGeneratedAppScaffold(MANIFEST, PLAN);

  expect(result).toEqual(resolveExpoRuntimeGeneratedAppScaffold(MANIFEST, PLAN));
  expect(result.files).toEqual([
    expect.objectContaining({ relativePath: 'package.json' }),
    expect.objectContaining({ relativePath: 'app.config.ts' }),
    expect.objectContaining({ relativePath: 'src/generated/runtimeShell.tsx' }),
  ]);
  expect(result.files[0]?.source).toContain('"main": "expo-router/entry"');
  expect(result.files[0]?.source).toContain(`"expo": "${EXPO_PLATFORM.runtime.expo.version}"`);
  expect(result.files[0]?.source).toContain(
    `"expo-router": "${EXPO_PLATFORM.navigation.expoRouter.version}"`,
  );
  expect(result.files[0]?.source).toContain(
    `"react-native": "${EXPO_PLATFORM.runtime.reactNative.version}"`,
  );
  expect(result.files[0]?.source).toContain('"@ankhorage/expo-runtime": "^7.3.0"');
  expect(result.files[0]?.source).toContain('"@ankhorage/runtime": "^5.6.4"');
  expect(result.files[0]?.source).toContain('"@ankhorage/surface": "^9.7.2"');
  expect(result.files[0]?.source).toContain('"@ankhorage/zora": "^27.2.0"');
  expect(result.files[1]?.source).toContain('"expo-camera"');
  expect(result.files[1]?.source).toContain('name: "Generated App"');
  expect(result.files[1]?.source).toContain('slug: "generated-app"');
  expect(result.files[2]?.source).toContain(
    "import { ResponsiveProvider } from '@ankhorage/surface';",
  );
  expect(result.files[2]?.source).toContain("import { ZoraProvider } from '@ankhorage/zora';");
  expect(result.files[2]?.source).toContain(`    <ResponsiveProvider>
      <ZoraProvider>
        <ExpoRuntimeProviders providers={["permissions"]}>{children}</ExpoRuntimeProviders>
      </ZoraProvider>
    </ResponsiveProvider>`);
});
