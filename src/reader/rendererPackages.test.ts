import { describe, expect, test } from 'bun:test';

describe('reader renderer package boundary', () => {
  test('provides the EPUB navigator and archive APIs required by the driver', async () => {
    const [{ EpubNavigator }, { BlobReader, ZipReader }] = await Promise.all([
      import('@readium/navigator'),
      import('@zip.js/zip.js'),
    ]);

    expect(EpubNavigator).toBeFunction();
    expect(BlobReader).toBeFunction();
    expect(ZipReader).toBeFunction();
  });

  test('provides the PDF loading, worker, and protected-document APIs', async () => {
    const { getDocument, PasswordException, PDFWorker } = await import('pdfjs-dist');

    expect(getDocument).toBeFunction();
    expect(PasswordException).toBeFunction();
    expect(PDFWorker).toBeFunction();
  });
});
