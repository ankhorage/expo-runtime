import type { ReaderViewportState } from './types';

export const LOADING_STATE: ReaderViewportState = {
  canGoNext: false,
  canGoPrevious: false,
  page: 1,
  progress: 0,
  status: 'loading',
};

export const READER_STYLES = `
  :root, body, #root { height: 100%; margin: 0; overflow: hidden; }
  * { box-sizing: border-box; }
  .reader-root { background: #fff; color: #111; height: 100%; outline: none; overflow: hidden; touch-action: pan-y; width: 100%; }
  .reader-dark { background: #111; color: #f5f5f5; }
  .reader-sepia { background: #f4ecd8; color: #3f3527; }
  .reader-content { height: 100%; overflow: auto; position: relative; width: 100%; }
  .reader-content > div:not(.reader-pdf-page) { height: 100%; width: 100%; }
  .reader-pdf-page { --user-unit: 1; --total-scale-factor: calc(var(--scale-factor) * var(--user-unit)); margin: 0 auto; position: relative; }
  .reader-pdf-page canvas { display: block; position: absolute; inset: 0; }
  .reader-pdf-text-layer { --min-font-size: 1; --text-scale-factor: calc(var(--total-scale-factor) * var(--min-font-size)); --min-font-size-inv: calc(1 / var(--min-font-size)); inset: 0; line-height: 1; opacity: 1; overflow: hidden; position: absolute; text-align: initial; text-size-adjust: none; transform-origin: 0 0; }
  .reader-pdf-text-layer span, .reader-pdf-text-layer br { color: transparent; cursor: text; position: absolute; transform-origin: 0 0; user-select: text; white-space: pre; }
  .reader-pdf-text-layer > :not(.markedContent), .reader-pdf-text-layer .markedContent span:not(.markedContent) { --font-height: 0; --scale-x: 1; --rotate: 0deg; font-size: calc(var(--text-scale-factor) * var(--font-height)); transform: rotate(var(--rotate)) scaleX(var(--scale-x)) scale(var(--min-font-size-inv)); }
  .reader-pdf-text-layer .markedContent { display: contents; }
  .reader-pdf-text-layer ::selection { background: rgba(0, 100, 255, 0.35); }
  .reader-pdf-link-layer { inset: 0; pointer-events: none; position: absolute; }
  .reader-pdf-link-layer a { outline-offset: 2px; pointer-events: auto; position: absolute; }
`;
