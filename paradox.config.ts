import { defineParadoxConfig } from '@ankhorage/paradox';

export default defineParadoxConfig({
  mode: 'write',

  docs: {
    title: 'EXPO-RUNTIME',
  },

  package: {
    root: '.',
    entrypoints: ['src/index.ts'],
  },

  output: {
    dir: './paradox',
  },
});
