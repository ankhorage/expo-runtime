export interface ExpoBundledMediaRegistrySourceEntry {
  readonly path: string;
  readonly requirePath: string;
}

export function getExpoBundledMediaRegistrySource(
  entries: readonly ExpoBundledMediaRegistrySourceEntry[],
): string {
  const normalized = normalizeEntries(entries);
  const rows = normalized.map(
    (entry) =>
      `  ${toExpoBundledMediaRegistrySourceLiteral(entry.path)}: require(${toExpoBundledMediaRegistrySourceLiteral(entry.requirePath)}),`,
  );
  const registry =
    normalized.length === 0
      ? ['export const bundledMediaRegistry: ExpoBundledMediaRegistry = {};']
      : ['export const bundledMediaRegistry: ExpoBundledMediaRegistry = {', ...rows, '};'];
  return [
    "import type { ExpoBundledMediaRegistry } from '@ankhorage/expo-runtime/bundled-media';",
    '',
    'declare const require: (path: string) => ExpoBundledMediaRegistry[string];',
    '',
    ...registry,
    '',
  ].join('\n');
}

function toExpoBundledMediaRegistrySourceLiteral(value: string): string {
  if (/[\\'\n\r\t\b\f]/u.test(value)) return JSON.stringify(value);
  return `'${value}'`;
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
