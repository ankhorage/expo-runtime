import type { ReaderErrorEvent, ReaderLocationChangeEvent } from '@ankhorage/zora';
import type { DOMProps } from 'expo/dom';

export interface ReaderAppearance {
  readonly colorScheme: 'dark' | 'light' | 'sepia' | 'system';
  readonly fontScale: number;
  readonly lineHeight: number;
}

export interface ReaderCommand {
  readonly id: number;
  readonly sourceUri: string;
  readonly type: 'next' | 'previous';
}

export interface ReaderViewportState {
  readonly canGoNext: boolean;
  readonly canGoPrevious: boolean;
  readonly location?: ReaderLocationChangeEvent;
  readonly page: number;
  readonly pageCount?: number;
  readonly progress: number;
  readonly status: 'loading' | 'ready';
}

export interface ReaderViewportProps {
  readonly appearance: ReaderAppearance;
  readonly command?: ReaderCommand;
  readonly format: 'epub' | 'pdf';
  readonly initialLocation?: string;
  readonly onError: (event: ReaderErrorEvent) => Promise<void>;
  readonly onOpenExternalLink: (event: { readonly url: string }) => Promise<void>;
  readonly onStateChange: (state: ReaderViewportState) => Promise<void>;
  readonly sourceUri: string;
  readonly dom?: DOMProps;
}

export interface ReaderDriverState {
  readonly canGoNext: boolean;
  readonly canGoPrevious: boolean;
  readonly chapterId?: string;
  readonly chapterTitle?: string;
  readonly locator: string;
  readonly page: number;
  readonly pageCount?: number;
  readonly progression: number;
}

export interface ReaderDriver {
  readonly direction: 'ltr' | 'rtl';
  destroy(): Promise<void>;
  getState(): ReaderDriverState;
  goNext(trigger: ReaderLocationChangeEvent['trigger']): Promise<void>;
  goPrevious(trigger: ReaderLocationChangeEvent['trigger']): Promise<void>;
}

export interface ReaderTouchStart {
  readonly interactive: boolean;
  readonly x: number;
  readonly y: number;
}
