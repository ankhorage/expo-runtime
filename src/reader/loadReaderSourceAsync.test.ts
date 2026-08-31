import { afterEach, describe, expect, mock, test } from 'bun:test';

import { loadReaderSourceAsync } from './loadReaderSourceAsync';

const originalFetch = globalThis.fetch;

describe('loadReaderSourceAsync', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    mock.restore();
  });

  test('loads a bounded source without forwarding credentials', async () => {
    const requests: RequestInit[] = [];
    globalThis.fetch = mock((_url: string | URL | Request, init?: RequestInit) => {
      requests.push(init ?? {});
      return Promise.resolve(new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
    }) as typeof fetch;

    const controller = new AbortController();
    expect(await loadReaderSourceAsync('https://example.test/book.pdf', controller.signal)).toEqual(
      new Uint8Array([1, 2, 3]),
    );
    expect(requests[0]?.credentials).toBe('omit');
    expect(requests[0]?.signal).toBe(controller.signal);
  });

  test('rejects unsuccessful responses before reading their body', () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response('missing', { status: 404 })),
    ) as typeof fetch;

    expect(
      loadReaderSourceAsync('https://example.test/missing.epub', new AbortController().signal),
    ).rejects.toThrow('HTTP 404');
  });

  test('rejects a declared body larger than the reader download budget', () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(null, {
          headers: { 'content-length': String(256 * 1024 * 1024 + 1) },
          status: 200,
        }),
      ),
    ) as typeof fetch;

    expect(
      loadReaderSourceAsync('https://example.test/huge.epub', new AbortController().signal),
    ).rejects.toThrow('download limit');
  });
});
