import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test } from 'bun:test';

import { getExpoBundledMediaRegistrySource } from './bundledMediaRegistrySource';

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));

async function expectGeneratedRegistryPassesFormatter(): Promise<void> {
  const fixtureDirectory = await mkdtemp(join(tmpdir(), 'expo-bundled-media-registry-'));
  const registryPath = join(fixtureDirectory, 'bundledMediaRegistry.ts');
  await Bun.write(
    registryPath,
    getExpoBundledMediaRegistrySource([
      { path: 'assets/zebra.png', requirePath: '../../assets/zebra.png' },
      { path: 'assets/ant.png', requirePath: '../../assets/ant.png' },
      { path: 'assets/bear.png', requirePath: '../../assets/bear.png' },
    ]),
  );

  try {
    const formatter = Bun.spawn(
      [
        './node_modules/.bin/ankhorage-prettier',
        '--check',
        '--config',
        '.prettierrc.js',
        registryPath,
      ],
      { cwd: repositoryRoot, stderr: 'pipe', stdout: 'pipe' },
    );
    expect(await formatter.exited).toBe(0);
  } finally {
    await rm(fixtureDirectory, { recursive: true, force: true });
  }
}

describe('Expo bundled media registry source', () => {
  test('renders an empty registry', () => {
    expect(getExpoBundledMediaRegistrySource([])).toBe(
      "import type { ExpoBundledMediaRegistry } from '@ankhorage/expo-runtime/bundled-media';\n\n" +
        'declare const require: (path: string) => ExpoBundledMediaRegistry[string];\n\n' +
        'export const bundledMediaRegistry: ExpoBundledMediaRegistry = {};\n',
    );
  });

  test('renders a single static require literal', () => {
    expect(
      getExpoBundledMediaRegistrySource([
        { path: 'assets/ant.png', requirePath: '../../assets/ant.png' },
      ]),
    ).toContain("'assets/ant.png': require('../../assets/ant.png')");
  });

  test('renders sorted static require literals and deduplicates identical entries', () => {
    const source = getExpoBundledMediaRegistrySource([
      { path: 'assets/z.png', requirePath: '../../assets/z.png' },
      { path: 'assets/a.png', requirePath: '../../assets/a.png' },
      { path: 'assets/a.png', requirePath: '../../assets/a.png' },
    ]);
    expect(source.indexOf('assets/a.png')).toBeLessThan(source.indexOf('assets/z.png'));
    expect(source.match(/require\('\.\.\/\.\.\/assets\/a\.png'\)/g)?.length).toBe(1);
    expect(source).toContain("require('../../assets/z.png')");
  });

  test('rejects one canonical path mapped to different files', () => {
    expect(() =>
      getExpoBundledMediaRegistrySource([
        { path: 'assets/a.png', requirePath: '../../assets/a.png' },
        { path: 'assets/a.png', requirePath: '../../assets/other.png' },
      ]),
    ).toThrow('conflicting require targets');
  });

  test('writes a multi-entry registry that passes the repository formatter without modification', async () => {
    await expectGeneratedRegistryPassesFormatter();
  });
});
