export interface ExpoBundledMediaRegistrySourceEntry {
  readonly path: string;
  readonly requirePath: string;
}

export function getExpoBundledMediaRegistrySource(
  entries: readonly ExpoBundledMediaRegistrySourceEntry[],
): string {
  const normalized = normalizeEntries(entries);
  const rows = normalized.map(
    (entry) => `  ${JSON.stringify(entry.path)}: require(${JSON.stringify(entry.requirePath)}),`,
  );
  return [
    "import type { ExpoBundledMediaRegistry } from '@ankhorage/expo-runtime';",
    '',
    'declare const require: (path: string) => ExpoBundledMediaRegistry[string];',
    '',
    'export const bundledMediaRegistry: ExpoBundledMediaRegistry = {',
    ...rows,
    '};',
    '',
  ].join('\n');
}

function normalizeEntries(
  entries: readonly ExpoBundledMediaRegistrySourceEntry[],
): readonly ExpoBundledMediaRegistrySourceEntry[] {
  const byPath = new Map<string, string>();
  for (const entry of entries) {
    const existing = byPath.get(entry.path);
    if (existing !== undefined && existing !== entry.requirePath) {
      throw new Error(`Bundled media path has conflicting require targets: ${entry.path}`);
    }
    byPath.set(entry.path, entry.requirePath);
  }
  return [...byPath.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([path, requirePath]) => ({ path, requirePath }));
}
