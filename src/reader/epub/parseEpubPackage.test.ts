import { DOMParser as XmlDomParser } from '@xmldom/xmldom';
import { TextReader, Uint8ArrayWriter, ZipWriter } from '@zip.js/zip.js';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import { EpubArchive } from './EpubArchive';
import { parseEpubPackage } from './parseEpubPackage';

const browserDomParser = globalThis.DOMParser;

beforeEach(() => {
  globalThis.DOMParser = XmlDomParser as unknown as typeof DOMParser;
});

afterEach(() => {
  globalThis.DOMParser = browserDomParser;
});

describe('parseEpubPackage deterministic EPUB fixtures', () => {
  test('parses a reflowable EPUB 3 spine and resources', async () => {
    const archive = await openFixture(
      packageDocument({
        metadata: '',
        progression: 'default',
        spineProperties: '',
      }),
    );
    const parsed = await parseEpubPackage(archive, new AbortController().signal);

    expect(parsed.fixedLayout).toBe(false);
    expect(parsed.direction).toBe('ltr');
    expect(parsed.readingOrder.map((item) => item.href)).toEqual([
      'OPS/chapter-1.xhtml',
      'OPS/chapter-2.xhtml',
    ]);
    expect(parsed.resources.map((item) => item.href)).toContain('OPS/nav.xhtml');
    expect(parsed.tableOfContents).toEqual([
      { href: 'OPS/chapter-1.xhtml#start', title: 'Chapter one' },
    ]);
    await archive.close();
  });

  test('preserves fixed-layout and RTL package metadata', async () => {
    const archive = await openFixture(
      packageDocument({
        metadata: '<meta property="rendition:layout">pre-paginated</meta>',
        progression: 'rtl',
        spineProperties: 'properties="rendition:layout-pre-paginated"',
      }),
    );
    const parsed = await parseEpubPackage(archive, new AbortController().signal);

    expect(parsed.fixedLayout).toBe(true);
    expect(parsed.direction).toBe('rtl');
    await archive.close();
  });

  test('rejects encrypted publication resources as protected content', async () => {
    const archive = await openFixture(packageDocument(), {
      'META-INF/encryption.xml': '<?xml version="1.0"?><encryption><EncryptedData /></encryption>',
    });

    let error: unknown;
    try {
      await parseEpubPackage(archive, new AbortController().signal);
    } catch (caught) {
      error = caught;
    }
    expect(error).toMatchObject({ code: 'protected-document' });
    await archive.close();
  });
});

async function openFixture(
  packageSource: string,
  extraFiles: Readonly<Record<string, string>> = {},
): Promise<EpubArchive> {
  const writer = new ZipWriter(new Uint8ArrayWriter());
  const files = {
    mimetype: 'application/epub+zip',
    'META-INF/container.xml':
      '<?xml version="1.0"?><container><rootfiles><rootfile full-path="OPS/package.opf" /></rootfiles></container>',
    'OPS/package.opf': packageSource,
    'OPS/chapter-1.xhtml': '<html><body><h1>One</h1></body></html>',
    'OPS/chapter-2.xhtml': '<html><body><h1>Two</h1></body></html>',
    'OPS/nav.xhtml':
      '<html xmlns:epub="http://www.idpf.org/2007/ops"><body><nav epub:type="toc"><a href="chapter-1.xhtml#start">Chapter one</a></nav></body></html>',
    ...extraFiles,
  };
  for (const [path, content] of Object.entries(files)) {
    await writer.add(path, new TextReader(content), { lastModDate: new Date(0) });
  }
  const bytes = await writer.close();
  return EpubArchive.open(bytes, new AbortController().signal);
}

function packageDocument(
  options: {
    metadata?: string;
    progression?: 'default' | 'rtl';
    spineProperties?: string;
  } = {},
): string {
  return `<?xml version="1.0"?>
    <package version="3.0">
      <metadata><title>Reader fixture</title><language>en</language>${options.metadata ?? ''}</metadata>
      <manifest>
        <item id="one" href="chapter-1.xhtml" media-type="application/xhtml+xml" />
        <item id="two" href="chapter-2.xhtml" media-type="application/xhtml+xml" />
        <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />
      </manifest>
      <spine page-progression-direction="${options.progression ?? 'default'}">
        <itemref idref="one" ${options.spineProperties ?? ''} />
        <itemref idref="two" ${options.spineProperties ?? ''} />
      </spine>
    </package>`;
}
