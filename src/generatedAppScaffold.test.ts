import { expect, test } from 'bun:test';

import { resolveExpoRuntimeGeneratedAppScaffold } from './generatedAppScaffold';
import type { ExpoRuntimePlan } from './resolveExpoRuntimePlan';

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
  const result = resolveExpoRuntimeGeneratedAppScaffold(PLAN);

  expect(result).toEqual(resolveExpoRuntimeGeneratedAppScaffold(PLAN));
  expect(result.files).toEqual([
    {
      relativePath: 'package.json',
      source: '{\n  "dependencies": {\n    "expo-camera": "~57.0.6"\n  }\n}\n',
    },
    expect.objectContaining({ relativePath: 'app.config.ts' }),
    expect.objectContaining({ relativePath: 'src/generated/runtimeShell.tsx' }),
  ]);
  expect(result.files[1]?.source).toContain('"expo-camera"');
  expect(result.files[2]?.source).toContain('providers={["permissions"]}');
});
