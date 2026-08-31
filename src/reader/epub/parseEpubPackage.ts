/* eslint-disable max-lines-per-function, complexity -- Package parsing validates one transactional document graph. */
import { ReaderDocumentError } from '../ReaderDocumentError';
import type { EpubArchive } from './EpubArchive';
import { resolveArchivePath } from './path';

interface EpubPackageItem {
  readonly href: string;
  readonly mediaType: string;
  readonly properties: readonly string[];
}

export interface ParsedEpubPackage {
  readonly direction: 'ltr' | 'rtl';
  readonly fixedLayout: boolean;
  readonly language?: string;
  readonly packagePath: string;
  readonly readingOrder: readonly EpubPackageItem[];
  readonly resources: readonly EpubPackageItem[];
  readonly tableOfContents: readonly { readonly href: string; readonly title: string }[];
  readonly title: string;
}

export async function parseEpubPackage(
  archive: EpubArchive,
  signal: AbortSignal,
): Promise<ParsedEpubPackage> {
  const mimetype = (await archive.readText('mimetype', signal)).trim();
  if (mimetype !== 'application/epub+zip') {
    throw new ReaderDocumentError('invalid-document', 'The archive is not an EPUB document.');
  }
  if (archive.has('META-INF/encryption.xml')) {
    const encryption = await archive.readText('META-INF/encryption.xml', signal);
    if (
      elementsByLocalName(parseXml(encryption, 'EPUB encryption metadata'), 'EncryptedData')
        .length > 0
    ) {
      throw new ReaderDocumentError(
        'protected-document',
        'This EPUB uses content protection and cannot be opened.',
      );
    }
  }

  const container = parseXml(
    await archive.readText('META-INF/container.xml', signal),
    'EPUB container',
  );
  const [rootfile] = elementsByLocalName(container, 'rootfile');
  const packagePathValue = rootfile?.getAttribute('full-path');
  if (!packagePathValue) {
    throw new ReaderDocumentError(
      'invalid-document',
      'The EPUB container has no package document.',
    );
  }
  const packagePath = resolveArchivePath('', packagePathValue);
  const packageDocument = parseXml(await archive.readText(packagePath, signal), 'EPUB package');

  const manifestItems = new Map<string, EpubPackageItem>();
  for (const item of elementsByLocalName(packageDocument, 'item')) {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    const mediaType = item.getAttribute('media-type');
    if (!id || !href || !mediaType) continue;
    manifestItems.set(id, {
      href: resolveArchivePath(packagePath, href),
      mediaType,
      properties: (item.getAttribute('properties') ?? '').split(/\s+/).filter(Boolean),
    });
  }

  const [spine] = elementsByLocalName(packageDocument, 'spine');
  const readingOrder = elementsByLocalName(spine ?? packageDocument, 'itemref')
    .map((itemref) => manifestItems.get(itemref.getAttribute('idref') ?? ''))
    .filter((item): item is EpubPackageItem => item !== undefined);
  if (readingOrder.length === 0) {
    throw new ReaderDocumentError('invalid-document', 'The EPUB package has no readable spine.');
  }

  const metadata =
    elementsByLocalName(packageDocument, 'metadata')[0] ?? packageDocument.documentElement;
  const title = elementText(metadata, 'title') ?? 'Untitled publication';
  const language = elementText(metadata, 'language');
  const fixedLayout =
    elementsByLocalName(metadata, 'meta').some(
      (element) =>
        element.getAttribute('property') === 'rendition:layout' &&
        element.textContent.trim() === 'pre-paginated',
    ) || readingOrder.every((item) => item.properties.includes('rendition:layout-pre-paginated'));
  const direction = spine?.getAttribute('page-progression-direction') === 'rtl' ? 'rtl' : 'ltr';
  const readingPaths = new Set(readingOrder.map((item) => item.href));
  const navigationItem = [...manifestItems.values()].find((item) =>
    item.properties.includes('nav'),
  );
  const tableOfContents = navigationItem
    ? await parseNavigationDocument(archive, navigationItem.href, signal)
    : [];

  return {
    direction,
    fixedLayout,
    language,
    packagePath,
    readingOrder,
    resources: [...manifestItems.values()].filter((item) => !readingPaths.has(item.href)),
    tableOfContents,
    title,
  };
}

async function parseNavigationDocument(
  archive: EpubArchive,
  navigationPath: string,
  signal: AbortSignal,
): Promise<{ href: string; title: string }[]> {
  const document = parseXml(await archive.readText(navigationPath, signal), 'EPUB navigation');
  const navigation =
    elementsByLocalName(document, 'nav').find((element) =>
      (element.getAttribute('epub:type') ?? element.getAttribute('type') ?? '')
        .split(/\s+/)
        .includes('toc'),
    ) ?? elementsByLocalName(document, 'nav')[0];
  if (!navigation) return [];
  return elementsByLocalName(navigation, 'a').flatMap((anchor) => {
    const href = anchor.getAttribute('href');
    const title = anchor.textContent.trim();
    if (!href || !title) return [];
    const [resourceReference, fragment] = href.split('#', 2);
    const resourcePath = resolveArchivePath(navigationPath, resourceReference ?? '');
    return [{ href: fragment ? `${resourcePath}#${fragment}` : resourcePath, title }];
  });
}

function parseXml(source: string, label: string): XMLDocument {
  const document = new DOMParser().parseFromString(source, 'application/xml');
  if (elementsByLocalName(document, 'parsererror').length > 0) {
    throw new ReaderDocumentError('invalid-document', `Invalid ${label}.`);
  }
  return document;
}

function elementsByLocalName(root: Document | Element, localName: string): Element[] {
  return Array.from(root.getElementsByTagName('*')).filter(
    (element) => element.localName === localName,
  );
}

function elementText(root: Document | Element, localName: string): string | undefined {
  const [element] = elementsByLocalName(root, localName);
  const value = element?.textContent.trim();
  return value === '' ? undefined : value;
}
