import { expect, test } from 'bun:test';

import {
  resolveExpoRuntimeGeneratedAppScaffold,
  resolveExpoRuntimeGeneratedAppSources,
} from './generatedApp';

test('keeps the generated-app subpath facade focused on both published generated-app APIs', () => {
  expect(resolveExpoRuntimeGeneratedAppScaffold).toBeFunction();
  expect(resolveExpoRuntimeGeneratedAppSources).toBeFunction();
});
