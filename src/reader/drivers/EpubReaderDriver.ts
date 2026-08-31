/* eslint-disable max-lines-per-function, complexity -- EPUB assembly keeps archive cleanup transactional. */
import { EpubNavigator, type EpubNavigatorListeners } from '@readium/navigator';
import { Locator, Manifest, Publication } from '@readium/shared';

import { EpubArchive } from '../epub/EpubArchive';
import { EpubArchiveFetcher } from '../epub/EpubArchiveFetcher';
import { HTML_MEDIA_TYPES, inferEpubMediaType } from '../epub/mediaTypes';
import { type ParsedEpubPackage, parseEpubPackage } from '../epub/parseEpubPackage';
import { sanitizeEpubDocument, sanitizeEpubStylesheet } from '../epub/sanitizeEpubDocument';
import type { ReaderAppearance, ReaderDriver, ReaderDriverState } from '../types';

export class EpubReaderDriver implements ReaderDriver {
  readonly direction: 'ltr' | 'rtl';
  readonly #archive: EpubArchive;
  readonly #navigator: EpubNavigator;
  readonly #objectUrls: string[];
  readonly #onExternalLink: (url: string) => void;
  readonly #onStateChange: (state: ReaderDriverState) => void;
  readonly #publication: Publication;
  readonly #fixedLayout: boolean;
  #page = 1;
  #suppressStateNotifications = false;

  private constructor(args: {
    archive: EpubArchive;
    direction: 'ltr' | 'rtl';
    fixedLayout: boolean;
    navigator: EpubNavigator;
    objectUrls: string[];
    onExternalLink: (url: string) => void;
    onStateChange: (state: ReaderDriverState) => void;
    publication: Publication;
  }) {
    this.#archive = args.archive;
    this.direction = args.direction;
    this.#fixedLayout = args.fixedLayout;
    this.#navigator = args.navigator;
    this.#objectUrls = args.objectUrls;
    this.#onExternalLink = args.onExternalLink;
    this.#onStateChange = args.onStateChange;
    this.#publication = args.publication;
  }

  static async create(args: {
    appearance: ReaderAppearance;
    bytes: Uint8Array;
    container: HTMLElement;
    initialLocation?: string;
    onExternalLink: (url: string) => void;
    onStateChange: (state: ReaderDriverState) => void;
    signal: AbortSignal;
  }): Promise<EpubReaderDriver> {
    const archive = await EpubArchive.open(args.bytes, args.signal);
    const objectUrls: string[] = [];
    try {
      const packageData = await parseEpubPackage(archive, args.signal);
      const { publication, objectUrls: createdUrls } = await createPublication(
        archive,
        packageData,
        args.signal,
      );
      objectUrls.push(...createdUrls);
      const holder: { driver?: EpubReaderDriver } = {};
      const listeners: EpubNavigatorListeners = {
        frameLoaded: (window) =>
          attachFrameLinkPolicy(window, (url) => {
            if (holder.driver !== undefined) holder.driver.#onExternalLink(url);
          }),
        positionChanged: () => {
          if (holder.driver !== undefined) holder.driver.#notifyState();
        },
        timelineItemChanged: () => {
          if (holder.driver !== undefined) holder.driver.#notifyState();
        },
        tap: () => false,
        click: () => false,
        zoom: noop,
        miscPointer: noop,
        scroll: noop,
        customEvent: noop,
        handleLocator: () => false,
        textSelected: noop,
        contentProtection: noop,
        contextMenu: noop,
        peripheral: noop,
      };
      const initialPosition = parseInitialLocator(args.initialLocation);
      const navigator = new EpubNavigator(
        args.container,
        publication,
        listeners,
        [],
        initialPosition,
        {
          defaults: {},
          preferences: resolvePreferences(args.appearance),
          injectables: { allowedDomains: [], rules: [] },
        },
      );
      const driver = new EpubReaderDriver({
        archive,
        direction: packageData.direction,
        fixedLayout: packageData.fixedLayout,
        navigator,
        objectUrls,
        onExternalLink: args.onExternalLink,
        onStateChange: args.onStateChange,
        publication,
      });
      holder.driver = driver;
      await navigator.load();
      driver.#notifyState();
      return driver;
    } catch (error) {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      await archive.close();
      throw error;
    }
  }

  getState(): ReaderDriverState {
    const locator = this.#navigator.currentLocator;
    const spineIndex = Math.max(
      0,
      this.#publication.readingOrder.items.findIndex((link) => link.href === locator.href),
    );
    const progressionInResource = locator.locations.progression ?? 0;
    const totalProgression =
      locator.locations.totalProgression ??
      (spineIndex + progressionInResource) / this.#publication.readingOrder.items.length;
    if (this.#fixedLayout) this.#page = spineIndex + 1;
    return {
      canGoNext: this.#navigator.canGoForward,
      canGoPrevious: this.#navigator.canGoBackward,
      chapterId: locator.href,
      chapterTitle: locator.title,
      locator: JSON.stringify(locator.serialize()),
      page: this.#page,
      pageCount: this.#fixedLayout ? this.#publication.readingOrder.items.length : undefined,
      progression: Math.max(0, Math.min(1, totalProgression)),
    };
  }

  async goNext(_trigger: Parameters<ReaderDriver['goNext']>[0]): Promise<void> {
    if (!this.#navigator.canGoForward) return;
    this.#suppressStateNotifications = true;
    try {
      await navigate((done) => this.#navigator.goForward(shouldAnimateNavigation(), done));
      if (!this.#fixedLayout) this.#page += 1;
    } finally {
      this.#suppressStateNotifications = false;
    }
  }

  async goPrevious(_trigger: Parameters<ReaderDriver['goPrevious']>[0]): Promise<void> {
    if (!this.#navigator.canGoBackward) return;
    this.#suppressStateNotifications = true;
    try {
      await navigate((done) => this.#navigator.goBackward(shouldAnimateNavigation(), done));
      if (!this.#fixedLayout) this.#page = Math.max(1, this.#page - 1);
    } finally {
      this.#suppressStateNotifications = false;
    }
  }

  async destroy(): Promise<void> {
    await this.#navigator.destroy();
    await this.#archive.close();
    this.#objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }

  #notifyState(): void {
    if (!this.#suppressStateNotifications) this.#onStateChange(this.getState());
  }
}

async function createPublication(
  archive: EpubArchive,
  packageData: ParsedEpubPackage,
  signal: AbortSignal,
): Promise<{ publication: Publication; objectUrls: string[] }> {
  const objectUrls: string[] = [];
  const resourceUrls = new Map<string, string>();
  const itemByPath = new Map(
    [...packageData.readingOrder, ...packageData.resources].map((item) => [item.href, item]),
  );

  for (const path of archive.paths()) {
    const mediaType = itemByPath.get(path)?.mediaType ?? inferEpubMediaType(path);
    if (HTML_MEDIA_TYPES.has(mediaType) || mediaType === 'text/css') continue;
    const resource = await archive.read(path, signal);
    const resourceBuffer = resource.buffer.slice(
      resource.byteOffset,
      resource.byteOffset + resource.byteLength,
    ) as ArrayBuffer;
    const url = URL.createObjectURL(new Blob([resourceBuffer], { type: mediaType }));
    objectUrls.push(url);
    resourceUrls.set(path, url);
  }

  const overrides = new Map<string, Uint8Array>();
  for (const path of archive.paths()) {
    const mediaType = itemByPath.get(path)?.mediaType ?? inferEpubMediaType(path);
    if (mediaType !== 'text/css') continue;
    const css = sanitizeEpubStylesheet(await archive.readText(path, signal), path, (resourcePath) =>
      resourceUrls.get(resourcePath),
    );
    const url = URL.createObjectURL(new Blob([css], { type: mediaType }));
    objectUrls.push(url);
    resourceUrls.set(path, url);
    overrides.set(path, new TextEncoder().encode(css));
  }
  for (const [path, item] of itemByPath) {
    if (!HTML_MEDIA_TYPES.has(item.mediaType)) continue;
    const source = sanitizeEpubDocument(
      await archive.readText(path, signal),
      path,
      (resourcePath) => resourceUrls.get(resourcePath),
    );
    overrides.set(path, new TextEncoder().encode(source));
  }

  const manifest = Manifest.deserialize({
    metadata: {
      conformsTo: ['https://readium.org/webpub-manifest/profiles/epub'],
      language: packageData.language,
      layout: packageData.fixedLayout ? 'fixed' : 'reflowable',
      readingProgression: packageData.direction,
      title: packageData.title,
    },
    links: [
      {
        href: 'https://reader.invalid/manifest.json',
        rel: 'self',
        type: 'application/webpub+json',
      },
    ],
    readingOrder: packageData.readingOrder.map(toManifestLink),
    resources: packageData.resources.map(toManifestLink),
    toc: packageData.tableOfContents.map((item) => ({
      href: item.href,
      title: item.title,
      type: 'application/xhtml+xml',
    })),
  });
  if (manifest === undefined) throw new Error('Could not construct the EPUB publication manifest.');
  const links = [...manifest.readingOrder.items, ...(manifest.resources?.items ?? [])];
  return {
    publication: new Publication({
      fetcher: new EpubArchiveFetcher(archive, links, overrides),
      manifest,
    }),
    objectUrls,
  };
}

function toManifestLink(item: ParsedEpubPackage['readingOrder'][number]) {
  return {
    href: item.href,
    type: item.mediaType,
    properties:
      item.properties.length === 0
        ? undefined
        : Object.fromEntries(item.properties.map((key) => [key, true])),
  };
}

function resolvePreferences(appearance: ReaderAppearance) {
  const dark = appearance.colorScheme === 'dark';
  const sepia = appearance.colorScheme === 'sepia';
  return {
    backgroundColor: dark ? '#111111' : sepia ? '#f4ecd8' : '#ffffff',
    fontSize: appearance.fontScale,
    lineHeight: appearance.lineHeight,
    textColor: dark ? '#f5f5f5' : sepia ? '#3f3527' : '#111111',
  };
}

function parseInitialLocator(value: string | undefined): Locator | undefined {
  if (!value) return undefined;
  try {
    return Locator.deserialize(JSON.parse(value));
  } catch {
    return undefined;
  }
}

function attachFrameLinkPolicy(window: Window, onExternalLink: (url: string) => void): void {
  window.document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('a') : null;
    const externalUrl = target?.getAttribute('data-reader-external-href');
    if (!externalUrl) return;
    event.preventDefault();
    event.stopPropagation();
    onExternalLink(externalUrl);
  });
}

function navigate(start: (done: (ok: boolean) => void) => void): Promise<void> {
  return new Promise((resolve) => start(() => resolve()));
}

function shouldAnimateNavigation(): boolean {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function noop(): void {
  // Readium requires a complete listener object; these events are outside the reader contract.
}
