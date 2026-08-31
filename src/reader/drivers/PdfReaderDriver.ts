import {
  getDocument,
  InvalidPDFException,
  PasswordException,
  type PDFDocumentLoadingTask,
  type PDFDocumentProxy,
  PDFWorker,
  RenderingCancelledException,
  type RenderTask,
  TextLayer,
} from 'pdfjs-dist';

import { ReaderDocumentError } from '../ReaderDocumentError';
import type { ReaderDriver, ReaderDriverState } from '../types';

export class PdfReaderDriver implements ReaderDriver {
  readonly direction = 'ltr' as const;
  readonly #container: HTMLElement;
  readonly #document: PDFDocumentProxy;
  readonly #loadingTask: PDFDocumentLoadingTask;
  readonly #onExternalLink: (url: string) => void;
  readonly #onRenderError: (error: unknown) => void;
  readonly #worker: PDFWorker;
  #page: number;
  #renderTask?: RenderTask;
  #resizeFrame?: number;
  #resizeObserver?: ResizeObserver;
  #textLayer?: TextLayer;

  private constructor(args: {
    container: HTMLElement;
    document: PDFDocumentProxy;
    initialPage: number;
    loadingTask: PDFDocumentLoadingTask;
    onExternalLink: (url: string) => void;
    onRenderError: (error: unknown) => void;
    worker: PDFWorker;
  }) {
    this.#container = args.container;
    this.#document = args.document;
    this.#loadingTask = args.loadingTask;
    this.#onExternalLink = args.onExternalLink;
    this.#onRenderError = args.onRenderError;
    this.#worker = args.worker;
    this.#page = args.initialPage;
  }

  static async create(args: {
    bytes: Uint8Array;
    container: HTMLElement;
    initialLocation?: string;
    onExternalLink: (url: string) => void;
    onRenderError: (error: unknown) => void;
  }): Promise<PdfReaderDriver> {
    const worker = createPdfWorker();
    const loadingTask = getDocument({
      data: args.bytes,
      stopAtErrors: true,
      worker,
    });
    try {
      const document = await loadingTask.promise;
      const driver = new PdfReaderDriver({
        container: args.container,
        document,
        initialPage: resolveInitialPage(args.initialLocation, document.numPages),
        loadingTask,
        onExternalLink: args.onExternalLink,
        onRenderError: args.onRenderError,
        worker,
      });
      await driver.#renderPage();
      driver.#observeResize();
      return driver;
    } catch (error) {
      await loadingTask.destroy();
      worker.destroy();
      if (error instanceof PasswordException) {
        throw new ReaderDocumentError(
          'protected-document',
          'This PDF is password protected and cannot be opened.',
        );
      }
      if (error instanceof InvalidPDFException) {
        throw new ReaderDocumentError('invalid-document', 'The PDF document is invalid.');
      }
      throw error;
    }
  }

  getState(): ReaderDriverState {
    return {
      canGoNext: this.#page < this.#document.numPages,
      canGoPrevious: this.#page > 1,
      locator: `page=${this.#page}`,
      page: this.#page,
      pageCount: this.#document.numPages,
      progression:
        this.#document.numPages <= 1 ? 1 : (this.#page - 1) / (this.#document.numPages - 1),
    };
  }

  async goNext(): Promise<void> {
    if (this.#page >= this.#document.numPages) return;
    this.#page += 1;
    await this.#renderPage();
  }

  async goPrevious(): Promise<void> {
    if (this.#page <= 1) return;
    this.#page -= 1;
    await this.#renderPage();
  }

  async destroy(): Promise<void> {
    this.#renderTask?.cancel();
    this.#resizeObserver?.disconnect();
    if (this.#resizeFrame !== undefined) cancelAnimationFrame(this.#resizeFrame);
    this.#textLayer?.cancel();
    TextLayer.cleanup();
    await this.#loadingTask.destroy();
    this.#worker.destroy();
    this.#container.replaceChildren();
  }

  async #renderPage(): Promise<void> {
    this.#renderTask?.cancel();
    this.#textLayer?.cancel();
    const page = await this.#document.getPage(this.#page);
    const baseViewport = page.getViewport({ scale: 1 });
    const availableWidth = Math.max(1, this.#container.clientWidth);
    const viewport = page.getViewport({ scale: availableWidth / baseViewport.width });
    const pageElement = document.createElement('div');
    const canvas = document.createElement('canvas');
    const textContainer = document.createElement('div');
    const linkContainer = document.createElement('div');
    const outputScale = window.devicePixelRatio || 1;

    pageElement.className = 'reader-pdf-page';
    pageElement.style.setProperty('--scale-factor', String(viewport.scale));
    pageElement.style.width = `${viewport.width}px`;
    pageElement.style.height = `${viewport.height}px`;
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    textContainer.className = 'reader-pdf-text-layer';
    textContainer.style.width = `${viewport.width}px`;
    textContainer.style.height = `${viewport.height}px`;
    linkContainer.className = 'reader-pdf-link-layer';
    pageElement.append(canvas, textContainer, linkContainer);
    this.#container.replaceChildren(pageElement);

    const context = canvas.getContext('2d');
    if (context === null) throw new Error('The PDF canvas context is unavailable.');
    this.#renderTask = page.render({
      canvas,
      canvasContext: context,
      transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
      viewport,
    });
    this.#textLayer = new TextLayer({
      container: textContainer,
      textContentSource: page.streamTextContent(),
      viewport,
    });
    await Promise.all([this.#renderTask.promise, this.#textLayer.render()]);
    await renderExternalLinks(page, viewport, linkContainer, this.#onExternalLink);
  }

  #observeResize(): void {
    let previousWidth = this.#container.clientWidth;
    this.#resizeObserver = new ResizeObserver(() => {
      const width = this.#container.clientWidth;
      if (width === previousWidth) return;
      previousWidth = width;
      if (this.#resizeFrame !== undefined) cancelAnimationFrame(this.#resizeFrame);
      this.#resizeFrame = requestAnimationFrame(() => {
        void this.#renderPage().catch((error: unknown) => {
          if (!(error instanceof RenderingCancelledException)) this.#onRenderError(error);
        });
      });
    });
    this.#resizeObserver.observe(this.#container);
  }
}

function createPdfWorker(): PDFWorker {
  const port = new Worker(new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url), {
    type: 'module',
  });
  return PDFWorker.create({ port });
}

async function renderExternalLinks(
  page: Awaited<ReturnType<PDFDocumentProxy['getPage']>>,
  viewport: PdfViewport,
  container: HTMLElement,
  onExternalLink: (url: string) => void,
): Promise<void> {
  const annotations: unknown = await page.getAnnotations({ intent: 'display' });
  if (!Array.isArray(annotations)) return;
  for (const annotation of annotations as unknown[]) {
    if (!isExternalPdfLink(annotation)) continue;
    const [left, top] = viewport.convertToViewportPoint(annotation.rect[0], annotation.rect[1]) as [
      number,
      number,
    ];
    const [right, bottom] = viewport.convertToViewportPoint(
      annotation.rect[2],
      annotation.rect[3],
    ) as [number, number];
    const link = document.createElement('a');
    link.setAttribute('aria-label', annotation.titleObj?.str ?? annotation.url);
    link.href = '#';
    link.style.inset = `${Math.min(bottom, top)}px auto auto ${Math.min(left, right)}px`;
    link.style.width = `${Math.abs(right - left)}px`;
    link.style.height = `${Math.abs(top - bottom)}px`;
    link.addEventListener('click', (event) => {
      event.preventDefault();
      onExternalLink(annotation.url);
    });
    container.append(link);
  }
}

interface PdfViewport {
  convertToViewportPoint(x: number, y: number): number[];
}

function isExternalPdfLink(annotation: unknown): annotation is Record<string, unknown> & {
  rect: [number, number, number, number];
  titleObj?: { str?: string };
  url: string;
} {
  return (
    typeof annotation === 'object' &&
    annotation !== null &&
    'url' in annotation &&
    'rect' in annotation &&
    typeof annotation.url === 'string' &&
    /^(?:https?:|mailto:|tel:)/i.test(annotation.url) &&
    Array.isArray(annotation.rect) &&
    annotation.rect.length === 4 &&
    annotation.rect.every((value) => typeof value === 'number')
  );
}

function resolveInitialPage(location: string | undefined, pageCount: number): number {
  const match = /^page=(\d+)$/.exec(location ?? '');
  const page = Number(match?.[1] ?? 1);
  return Math.max(1, Math.min(pageCount, Number.isSafeInteger(page) ? page : 1));
}
