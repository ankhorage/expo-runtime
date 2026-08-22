import { createConfig } from '@ankhorage/devtools/eslint';

const scriptConfig = createConfig({
  tsconfigRootDir: import.meta.dirname,
  project: ['./tsconfig.scripts.json'],
  files: ['scripts/**/*.ts'],
});

export default [
  // Devtools owns the base source configuration. This repository additionally
  // type-aware lints executable Expo validation scripts through their own project.
  ...scriptConfig,
  {
    name: 'expo-runtime/test-project',
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    name: 'expo-runtime/pre-existing-action-bridge-debt',
    files: ['src/expoActionBridge.ts'],
    rules: {
      complexity: 'off',
      'max-lines-per-function': 'off',
      'security/detect-object-injection': 'off',
    },
  },
  {
    name: 'expo-runtime/pre-existing-media-kind-lookup',
    files: ['src/mediaPicker/mediaKinds.ts'],
    rules: {
      'security/detect-object-injection': 'off',
    },
  },
  {
    // These untouched suites predate the shared 50-line callback rule. Splitting
    // them belongs to a focused cleanup and is unrelated to the Expo 57 review.
    name: 'expo-runtime/pre-existing-test-callback-debt',
    files: ['src/mediaPicker/mediaPicker.test.ts', 'src/oauthBrowserRuntime.test.ts'],
    rules: {
      'max-lines-per-function': 'off',
    },
  },
];
