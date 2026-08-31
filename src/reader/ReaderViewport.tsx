'use dom';

import React from 'react';

import { EpubReaderDriver } from './drivers/EpubReaderDriver';
import { PdfReaderDriver } from './drivers/PdfReaderDriver';
import { loadReaderSourceAsync } from './loadReaderSourceAsync';
import { resolveReaderKeyboardIntent } from './navigation/resolveReaderKeyboardIntent';
import { resolveReaderNavigationIntent } from './navigation/resolveReaderNavigationIntent';
import { ReaderDocumentError } from './ReaderDocumentError';
import { LOADING_STATE, READER_STYLES } from './readerViewportPresentation';
import type {
  ReaderDriver,
  ReaderDriverState,
  ReaderTouchStart,
  ReaderViewportProps,
  ReaderViewportState,
} from './types';

type ReaderTrigger = NonNullable<ReaderViewportState['location']>['trigger'];
type EmitReaderState = (state: ReaderDriverState, trigger: ReaderTrigger) => void;

export default function ReaderViewport(props: ReaderViewportProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const runtime = useReaderLifecycle(props, containerRef);
  useReaderCommand(props.command, props.sourceUri, runtime.driverRef, runtime.emitState);
  const input = useReaderInput(runtime.driverRef, runtime.driverStateRef, runtime.emitState);

  return (
    <div
      aria-label="Reader viewport"
      className={`reader-root reader-${props.appearance.colorScheme}`}
      onKeyDown={input.handleKeyDown}
      onTouchEnd={input.handleTouchEnd}
      onTouchStart={input.handleTouchStart}
      role="document"
      tabIndex={0}
    >
      <style>{READER_STYLES}</style>
      <div className="reader-content" ref={containerRef} />
    </div>
  );
}

function useReaderLifecycle(
  props: ReaderViewportProps,
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const driverRef = React.useRef<ReaderDriver | undefined>(undefined);
  const driverStateRef = React.useRef<ReaderDriverState | undefined>(undefined);
  const emitState = useEmitReaderState(props, driverStateRef);
  useReaderDriverEffect(props, containerRef, driverRef, driverStateRef, emitState);
  return { driverRef, driverStateRef, emitState };
}

function useEmitReaderState(
  props: ReaderViewportProps,
  stateRef: React.RefObject<ReaderDriverState | undefined>,
): EmitReaderState {
  const { format, onStateChange } = props;
  return React.useCallback<EmitReaderState>(
    (state, trigger) => {
      stateRef.current = state;
      void onStateChange(toViewportState(state, format, trigger));
    },
    [format, onStateChange, stateRef],
  );
}

function useReaderDriverEffect(
  props: ReaderViewportProps,
  containerRef: React.RefObject<HTMLDivElement | null>,
  driverRef: React.RefObject<ReaderDriver | undefined>,
  driverStateRef: React.RefObject<ReaderDriverState | undefined>,
  emitState: EmitReaderState,
): void {
  const { appearance, format, onError, onOpenExternalLink, onStateChange, sourceUri } = props;
  const { colorScheme, fontScale, lineHeight } = appearance;
  const [initialLocation] = React.useState(props.initialLocation);

  React.useEffect(
    () =>
      mountReaderDriver({
        container: containerRef.current,
        driverRef,
        driverStateRef,
        emitState,
        onError,
        onStateChange,
        reader: {
          appearance: { colorScheme, fontScale, lineHeight },
          format,
          initialLocation,
          onError,
          onOpenExternalLink,
          sourceUri,
        },
      }),
    [
      colorScheme,
      containerRef,
      driverRef,
      driverStateRef,
      emitState,
      format,
      fontScale,
      initialLocation,
      lineHeight,
      onError,
      onOpenExternalLink,
      onStateChange,
      sourceUri,
    ],
  );
}

function mountReaderDriver(args: MountReaderDriverArgs): () => void {
  const controller = new AbortController();
  const holder: { driver?: ReaderDriver } = {};
  args.container?.replaceChildren();
  void args.onStateChange(LOADING_STATE);
  if (args.container) {
    void initializeReaderDriver(args.reader, args.container, controller.signal, args.emitState)
      .then(async (driver) => {
        if (controller.signal.aborted) return driver.destroy();
        holder.driver = driver;
        args.driverRef.current = driver;
        args.emitState(driver.getState(), 'location');
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          void args.onError(normalizeReaderError(error, args.reader.format));
      });
  }
  return () => {
    controller.abort();
    args.driverRef.current = undefined;
    args.driverStateRef.current = undefined;
    if (holder.driver) void holder.driver.destroy();
  };
}

async function initializeReaderDriver(
  props: Pick<
    ReaderViewportProps,
    'appearance' | 'format' | 'initialLocation' | 'onError' | 'onOpenExternalLink' | 'sourceUri'
  >,
  container: HTMLElement,
  signal: AbortSignal,
  emitState: EmitReaderState,
): Promise<ReaderDriver> {
  const bytes = await loadReaderSourceAsync(props.sourceUri, signal);
  if (props.format === 'pdf') {
    return PdfReaderDriver.create({
      bytes,
      container,
      initialLocation: props.initialLocation,
      onExternalLink: (url) => void props.onOpenExternalLink({ url }),
      onRenderError: (error) => void props.onError(normalizeReaderError(error, props.format)),
    });
  }
  return EpubReaderDriver.create({
    appearance: props.appearance,
    bytes,
    container,
    initialLocation: props.initialLocation,
    onExternalLink: (url) => void props.onOpenExternalLink({ url }),
    onStateChange: (state) => emitState(state, 'location'),
    signal,
  });
}

interface MountReaderDriverArgs {
  readonly container: HTMLElement | null;
  readonly driverRef: React.RefObject<ReaderDriver | undefined>;
  readonly driverStateRef: React.RefObject<ReaderDriverState | undefined>;
  readonly emitState: EmitReaderState;
  readonly onError: ReaderViewportProps['onError'];
  readonly onStateChange: ReaderViewportProps['onStateChange'];
  readonly reader: Pick<
    ReaderViewportProps,
    'appearance' | 'format' | 'initialLocation' | 'onError' | 'onOpenExternalLink' | 'sourceUri'
  >;
}

function useReaderCommand(
  command: ReaderViewportProps['command'],
  sourceUri: string,
  driverRef: React.RefObject<ReaderDriver | undefined>,
  emitState: EmitReaderState,
): void {
  const lastCommandIdRef = React.useRef(0);
  React.useEffect(() => {
    if (command?.sourceUri !== sourceUri || command.id <= lastCommandIdRef.current) return;
    lastCommandIdRef.current = command.id;
    const trigger = command.type === 'next' ? 'nextControl' : 'previousControl';
    void navigate(driverRef.current, command.type, trigger, emitState);
  }, [command, driverRef, emitState, sourceUri]);
}

function useReaderInput(
  driverRef: React.RefObject<ReaderDriver | undefined>,
  stateRef: React.RefObject<ReaderDriverState | undefined>,
  emitState: EmitReaderState,
) {
  const touchStartRef = React.useRef<ReaderTouchStart | undefined>(undefined);
  const handleTouchStart = React.useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0];
    if (touch) {
      touchStartRef.current = {
        interactive: isInteractiveTarget(event.target),
        x: touch.clientX,
        y: touch.clientY,
      };
    }
  }, []);
  const handleTouchEnd = React.useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      handleSwipe(event, touchStartRef.current, driverRef.current, stateRef.current, emitState);
      touchStartRef.current = undefined;
    },
    [driverRef, emitState, stateRef],
  );
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) =>
      handleKeyboard(event, driverRef.current, stateRef.current, emitState),
    [driverRef, emitState, stateRef],
  );
  return { handleKeyDown, handleTouchEnd, handleTouchStart };
}

function handleSwipe(
  event: React.TouchEvent<HTMLDivElement>,
  start: ReaderTouchStart | undefined,
  driver: ReaderDriver | undefined,
  state: ReaderDriverState | undefined,
  emitState: EmitReaderState,
): void {
  const touch = event.changedTouches[0];
  if (!start || !touch || !driver || !state) return;
  const intent = resolveReaderNavigationIntent({
    canGoNext: state.canGoNext,
    canGoPrevious: state.canGoPrevious,
    deltaX: touch.clientX - start.x,
    deltaY: touch.clientY - start.y,
    direction: driver.direction,
    hasSelection: !window.getSelection()?.isCollapsed,
    isInteractiveTarget: start.interactive,
    viewportWidth: event.currentTarget.clientWidth,
  });
  if (intent) void navigate(driver, intent, 'swipe', emitState);
}

function handleKeyboard(
  event: React.KeyboardEvent<HTMLDivElement>,
  driver: ReaderDriver | undefined,
  state: ReaderDriverState | undefined,
  emitState: EmitReaderState,
): void {
  if (!driver || !state) return;
  const intent = resolveReaderKeyboardIntent({
    canGoNext: state.canGoNext,
    canGoPrevious: state.canGoPrevious,
    direction: driver.direction,
    hasModifier: event.altKey || event.ctrlKey || event.metaKey || event.shiftKey,
    isInteractiveTarget: isInteractiveTarget(event.target),
    key: event.key,
  });
  if (!intent) return;
  event.preventDefault();
  void navigate(driver, intent, 'keyboard', emitState);
}

async function navigate(
  driver: ReaderDriver | undefined,
  intent: 'next' | 'previous',
  trigger: ReaderTrigger,
  emitState: EmitReaderState,
): Promise<void> {
  if (!driver) return;
  if (intent === 'next') await driver.goNext(trigger);
  else await driver.goPrevious(trigger);
  emitState(driver.getState(), trigger);
}

function toViewportState(
  state: ReaderDriverState,
  format: ReaderViewportProps['format'],
  trigger: ReaderTrigger,
): ReaderViewportState {
  return {
    canGoNext: state.canGoNext,
    canGoPrevious: state.canGoPrevious,
    location: { format, trigger, ...state },
    page: state.page,
    pageCount: state.pageCount,
    progress: state.progression,
    status: 'ready',
  };
}

function isInteractiveTarget(target: EventTarget): boolean {
  return (
    target instanceof Element &&
    target.closest(
      'a, button, input, select, textarea, [contenteditable="true"], [role="button"]',
    ) !== null
  );
}

function normalizeReaderError(error: unknown, format: ReaderViewportProps['format']) {
  if (error instanceof ReaderDocumentError)
    return { code: error.code, format, message: error.message };
  return {
    code: 'load-failed' as const,
    format,
    message: error instanceof Error ? error.message : 'The document could not be loaded.',
  };
}
