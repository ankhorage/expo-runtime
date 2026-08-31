# Reader renderer decision

The Expo reader uses one isolated DOM viewport on web, iOS, and Android. ZORA owns the controlled `ReaderSurface` shell; this package owns document loading, EPUB/PDF rendering, navigation, cleanup, and normalized adapter events.

## Selected packages

The renderer dependencies are exact optional peers and exact development dependencies:

| Responsibility                          | Package              | Selected version | License      |
| --------------------------------------- | -------------------- | ---------------- | ------------ |
| EPUB reflowable/fixed-layout navigation | `@readium/navigator` | `2.8.2`          | BSD-3-Clause |
| EPUB ZIP archive access                 | `@zip.js/zip.js`     | `2.9.0`          | BSD-3-Clause |
| PDF parsing and rendering               | `pdfjs-dist`         | `6.3.289`        | Apache-2.0   |

Exact versions keep renderer code and worker/assets in one tested compatibility set. Renovate remains the update owner: an update PR must rerun dependency audit, deterministic fixtures, DOM bundling, and platform acceptance before the pin changes.

Readium is selected because its current web navigator models reflowable and fixed-layout publications, reading progression, locators, and browser/embedded-browser navigation. `zip.js` supplies browser-native streamed archive access; Expo Runtime will translate the EPUB container, package, spine, navigation document, and resources into Readium's public `Publication`/`Fetcher` model. `pdfjs-dist` is the maintained upstream browser renderer and exposes the page, text-layer, annotation-layer, password, and worker APIs required by the roadmap.

Rejected alternatives:

- `epubjs@0.3.93` is permissively licensed but was last published years ago and has unresolved RTL/fixed-layout and resize/location defects that conflict with acceptance.
- the `foliate-js@1.0.1` npm package is not published by the upstream repository owner; upstream has no stable release/tag and documents its API as unstable. A Git dependency or copied source would weaken reproducibility and package ownership.
- Vivliostyle supports paged EPUB content but its AGPL-3.0 license is incompatible with this MIT package's intended reusable dependency boundary.

## Mandatory content-safety wrapper

The selected libraries are engines, not the security boundary. The reader implementation must enforce these rules before renderer integration:

1. Download a remote document as bytes with an abort signal, explicit HTTP-status handling, size limits, and canonical media-type/format validation. Never give a renderer ambient credentials.
2. Serve EPUB resources only from the opened archive through a package-owned Readium `Fetcher`. Reject path traversal, duplicate normalized paths, encrypted/DRM resources, malformed container/package documents, and undeclared active content.
3. Remove publication scripts, inline event handlers, forms, nested browsing contexts, and active-object content before Readium receives XHTML. Readium's own iframe needs scripts for navigation, so its default `allow-scripts` sandbox and CSP are not sufficient to disable publication scripts by themselves.
4. Keep the publication base local/blob-based. Allow local archive images, styles, and fonts; block network subresources and `connect-src`. Intercept external links and emit a serializable adapter event instead of navigating.
5. Create the PDF.js worker URL from the same installed `pdfjs-dist` pin; never use a CDN worker. Call `getDocument` with `enableScripting: false` and `isEvalSupported: false`. Render links through the adapter policy, and normalize password/encryption failures as `protected-document`.
6. Revoke object URLs and destroy Readium navigators, PDF loading/render tasks, workers, listeners, and abort controllers on source changes and unmount.

`pdfjs-dist@6.3.289` is newer than the patched version for GHSA-hq66-cqwq-w95j/CVE-2026-16633. Disabling scripting remains mandatory defense in depth and is covered by adapter tests rather than inferred from the installed version.

## DOM boundary

The viewport lives in its own file with the `'use dom'` directive and one default component export. Props across the Expo DOM boundary contain only JSON-serializable source/config/state data and async native actions. The WebView does not share mutable state with the native React tree.

Native actions carry completed location changes, normalized reader errors, and intercepted external links. A narrow serializable command input drives previous, next, and location restore; commands are acknowledged only after the destination is displayed. CSS, the PDF canvas/text/annotation layers, and publication containment remain inside the DOM component.

## Deterministic fixture matrix

Fixtures are small, locally authored, redistributable, checked-in files with no network dependency:

| Fixture             | Required evidence                                                                  |
| ------------------- | ---------------------------------------------------------------------------------- |
| Reflowable EPUB 3   | multiple spine items, nav document, heading/image/table, CFI restore, repagination |
| Fixed-layout EPUB 3 | pre-paginated package metadata, viewport scaling, one logical page                 |
| RTL EPUB 3          | RTL reading progression and exactly-one-page inverted navigation                   |
| Text PDF            | multiple pages, sharp DPR canvas, selectable text layer, page restore              |
| Invalid EPUB/PDF    | one normalized `invalid-document` error without a crash                            |
| Protected EPUB/PDF  | one normalized `protected-document` error without decoding attempts                |

Source fixture entries remain readable beside generated archives. Archive generation fixes entry order, compression settings, and timestamps so regeneration is byte-stable. Browser/platform acceptance verifies resize/orientation, appearance repagination, gesture thresholds, keyboard direction, boundaries, cleanup, external-link interception, reduced motion, and accessible page announcements.

## Release gate

This decision does not import unpublished ZORA or Contracts source. Driver and DOM integration can land only after the released `ReaderSurface` contract and `ebookReader` capability are installed through normal Renovate updates. The renderer pins and fixture plan may merge independently so those downstream phases start from an audited, reproducible baseline.
