import { isExternalReference, resolveArchivePath } from './path';

const REMOVED_ELEMENTS = 'script, form, iframe, frame, object, embed';
const RESOURCE_ATTRIBUTES = ['src', 'poster', 'data'] as const;

export function sanitizeEpubDocument(
  source: string,
  resourcePath: string,
  resolveResourceUrl: (path: string) => string | undefined,
): string {
  const document = new DOMParser().parseFromString(source, 'application/xhtml+xml');
  if (document.querySelector('parsererror')) {
    throw new Error(`Invalid EPUB XHTML resource: ${resourcePath}`);
  }

  document.querySelectorAll(REMOVED_ELEMENTS).forEach((element) => element.remove());
  document
    .querySelectorAll('meta[http-equiv]')
    .forEach(
      (element) =>
        element.getAttribute('http-equiv')?.toLowerCase() === 'refresh' && element.remove(),
    );

  sanitizeElementAttributes(document, resourcePath, resolveResourceUrl);
  rewriteDocumentResources(document, resourcePath, resolveResourceUrl);
  rewriteDocumentLinks(document);
  return new XMLSerializer().serializeToString(document);
}

function sanitizeElementAttributes(
  document: XMLDocument,
  resourcePath: string,
  resolveResourceUrl: (path: string) => string | undefined,
): void {
  for (const element of document.querySelectorAll('*')) {
    for (const attribute of Array.from(element.attributes)) {
      if (attribute.name.toLowerCase().startsWith('on')) element.removeAttribute(attribute.name);
    }
    const inlineStyle = element.getAttribute('style');
    if (inlineStyle) {
      element.setAttribute(
        'style',
        sanitizeEpubStylesheet(inlineStyle, resourcePath, resolveResourceUrl),
      );
    }
    element.removeAttribute('srcset');
  }

  for (const style of document.querySelectorAll('style')) {
    style.textContent = sanitizeEpubStylesheet(style.textContent, resourcePath, resolveResourceUrl);
  }
}

function rewriteDocumentResources(
  document: XMLDocument,
  resourcePath: string,
  resolveResourceUrl: (path: string) => string | undefined,
): void {
  for (const attributeName of RESOURCE_ATTRIBUTES) {
    for (const element of document.querySelectorAll(`[${attributeName}]`)) {
      rewriteResourceAttribute(element, attributeName, resourcePath, resolveResourceUrl);
    }
  }

  for (const link of document.querySelectorAll('link[href]')) {
    rewriteResourceAttribute(link, 'href', resourcePath, resolveResourceUrl);
  }
}

function rewriteDocumentLinks(document: XMLDocument): void {
  for (const anchor of document.querySelectorAll('a[href]')) {
    const href = anchor.getAttribute('href')?.trim();
    if (!href) continue;
    if (/^(?:https?:|mailto:|tel:|\/\/)/i.test(href)) {
      anchor.setAttribute('data-reader-external-href', href);
      anchor.removeAttribute('href');
    } else if (isExternalReference(href)) {
      anchor.removeAttribute('href');
    }
  }
}

export function sanitizeEpubStylesheet(
  source: string,
  resourcePath: string,
  resolveResourceUrl: (path: string) => string | undefined,
): string {
  const withoutImports = source.replaceAll(/@import\s+(?:url\([^)]*\)|[^;]+);?/gi, '');
  return withoutImports.replaceAll(
    /url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/gi,
    (match, _quote, value: string) => {
      if (isExternalReference(value)) return 'url(about:blank)';
      try {
        return `url("${resolveResourceUrl(resolveArchivePath(resourcePath, value)) ?? 'about:blank'}")`;
      } catch {
        return 'url(about:blank)';
      }
    },
  );
}

function rewriteResourceAttribute(
  element: Element,
  attributeName: string,
  resourcePath: string,
  resolveResourceUrl: (path: string) => string | undefined,
): void {
  const value = element.getAttribute(attributeName)?.trim();
  if (!value) return;
  if (isExternalReference(value)) {
    element.removeAttribute(attributeName);
    return;
  }
  try {
    const resolved = resolveResourceUrl(resolveArchivePath(resourcePath, value));
    if (resolved === undefined) element.removeAttribute(attributeName);
    else element.setAttribute(attributeName, resolved);
  } catch {
    element.removeAttribute(attributeName);
  }
}
