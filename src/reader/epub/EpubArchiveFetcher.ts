import type { Link } from '@readium/shared';
import { type Fetcher, Resource } from '@readium/shared';

import type { EpubArchive } from './EpubArchive';

export class EpubArchiveFetcher implements Fetcher {
  readonly #archive: EpubArchive;
  readonly #links: Link[];
  readonly #overrides: ReadonlyMap<string, Uint8Array>;

  constructor(
    archive: EpubArchive,
    links: readonly Link[],
    overrides: ReadonlyMap<string, Uint8Array>,
  ) {
    this.#archive = archive;
    this.#links = [...links];
    this.#overrides = overrides;
  }

  links(): Link[] {
    return [...this.#links];
  }

  get(link: Link): Resource {
    return new EpubArchiveResource(this.#archive, link, this.#overrides.get(link.href));
  }

  close(): void {
    void this.#archive.close();
  }
}

class EpubArchiveResource extends Resource {
  constructor(
    readonly archive: EpubArchive,
    readonly resourceLink: Link,
    readonly override: Uint8Array | undefined,
  ) {
    super();
  }

  link(): Promise<Link> {
    return Promise.resolve(this.resourceLink);
  }

  async length(): Promise<number | undefined> {
    return (this.override ?? (await this.archive.read(this.resourceLink.href))).byteLength;
  }

  async read(): Promise<Uint8Array | undefined> {
    return this.override ?? this.archive.read(this.resourceLink.href);
  }

  close(): void {
    // Archive lifetime is owned by the driver.
  }
}
