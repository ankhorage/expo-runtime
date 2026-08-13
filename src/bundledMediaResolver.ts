import type { MediaAsset } from '@ankhorage/contracts';

export type ExpoBundledMediaValue = string | number | Readonly<Record<string, unknown>>;

export type ExpoBundledMediaRegistry = Readonly<Record<string, ExpoBundledMediaValue>>;

export interface ExpoBundledMediaResolverArgs {
  readonly asset: MediaAsset;
}

export type ExpoBundledMediaResolver = (
  args: ExpoBundledMediaResolverArgs,
) => ExpoBundledMediaValue | null;

export function createExpoBundledMediaResolver(
  registry: ExpoBundledMediaRegistry,
): ExpoBundledMediaResolver {
  return ({ asset }) => resolveExpoBundledMediaAsset(registry, asset);
}

export function resolveExpoBundledMediaAsset(
  registry: ExpoBundledMediaRegistry,
  asset: MediaAsset,
): ExpoBundledMediaValue | null {
  if (asset.source.kind !== 'bundled') return null;
  return registry[asset.source.path] ?? null;
}
