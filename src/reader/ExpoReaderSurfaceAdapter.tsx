import { type ReaderErrorEvent, ReaderSurface, type ReaderSurfaceProps } from '@ankhorage/zora';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import ReaderViewport from './ReaderViewport';
import type { ReaderAppearance, ReaderCommand, ReaderViewportState } from './types';

const INITIAL_STATE: ReaderViewportState = {
  canGoNext: false,
  canGoPrevious: false,
  page: 1,
  progress: 0,
  status: 'loading',
};

export function ExpoReaderSurfaceAdapter(props: ReaderSurfaceProps) {
  const sourceUri = resolveReaderSourceUri(props.source);
  const controller = useReaderController(props, sourceUri);
  const appearance = useReaderAppearance(props);
  const viewport = sourceUri ? (
    <ReaderAdapterViewport
      appearance={appearance}
      command={controller.command}
      format={props.format}
      initialLocation={props.location}
      onError={controller.handleError}
      onOpenExternalLink={controller.handleOpenExternalLink}
      onStateChange={controller.handleStateChange}
      sourceUri={sourceUri}
    />
  ) : undefined;

  return (
    <ReaderSurface
      {...props}
      canGoNext={controller.state.canGoNext}
      canGoPrevious={controller.state.canGoPrevious}
      chapterLabel={controller.state.location?.chapterTitle ?? props.chapterLabel}
      onNextPage={controller.handleNextPage}
      onPreviousPage={controller.handlePreviousPage}
      page={controller.state.page}
      pageCount={controller.state.pageCount}
      progress={controller.state.progress}
      status={controller.error ? 'error' : sourceUri ? controller.state.status : 'idle'}
      viewport={viewport}
    />
  );
}

function ReaderAdapterViewport({
  appearance,
  command,
  format,
  initialLocation,
  onError,
  onOpenExternalLink,
  onStateChange,
  sourceUri,
}: React.ComponentProps<typeof ReaderViewport>) {
  return (
    <View style={styles.viewport}>
      <ReaderViewport
        appearance={appearance}
        command={command}
        dom={DOM_CONFIGURATION}
        format={format}
        initialLocation={initialLocation}
        key={`${format}:${sourceUri}`}
        onError={onError}
        onOpenExternalLink={onOpenExternalLink}
        onStateChange={onStateChange}
        sourceUri={sourceUri}
      />
    </View>
  );
}

function useReaderController(props: ReaderSurfaceProps, sourceUri: string | undefined) {
  const { onLocationChange, onNextPage, onOpenExternalLink, onPreviousPage, onReaderError } = props;
  const [state, setState] = React.useState<ReaderViewportState>(INITIAL_STATE);
  const [error, setError] = React.useState<ReaderErrorEvent>();
  const { command, issueCommand } = useReaderCommandState(sourceUri);
  const handlePreviousPage = React.useCallback(() => {
    issueCommand('previous');
    void onPreviousPage?.();
  }, [issueCommand, onPreviousPage]);
  const handleNextPage = React.useCallback(() => {
    issueCommand('next');
    void onNextPage?.();
  }, [issueCommand, onNextPage]);
  const handleStateChange = React.useCallback(
    async (nextState: ReaderViewportState) => {
      setState(nextState);
      setError(undefined);
      if (nextState.location) await onLocationChange?.(nextState.location);
    },
    [onLocationChange],
  );
  const handleError = React.useCallback(
    async (event: ReaderErrorEvent) => {
      setError(event);
      await onReaderError?.(event);
    },
    [onReaderError],
  );
  const handleOpenExternalLink = React.useCallback(
    async (event: { readonly url: string }) => onOpenExternalLink?.(event),
    [onOpenExternalLink],
  );
  return {
    command,
    error,
    handleError,
    handleNextPage,
    handleOpenExternalLink,
    handlePreviousPage,
    handleStateChange,
    state,
  };
}

function useReaderCommandState(sourceUri: string | undefined) {
  const [command, setCommand] = React.useState<ReaderCommand>();
  const commandIdRef = React.useRef(0);
  const issueCommand = React.useCallback(
    (type: ReaderCommand['type']) => {
      if (!sourceUri) return;
      commandIdRef.current += 1;
      setCommand({ id: commandIdRef.current, sourceUri, type });
    },
    [sourceUri],
  );
  return { command, issueCommand };
}

function useReaderAppearance(props: ReaderSurfaceProps): ReaderAppearance {
  const colorScheme = props.readerColorScheme ?? 'system';
  const fontScale = props.fontScale ?? 1;
  const lineHeight = resolveLineHeight(props.lineHeight ?? 'normal');
  return React.useMemo(
    () => ({ colorScheme, fontScale, lineHeight }),
    [colorScheme, fontScale, lineHeight],
  );
}

function resolveReaderSourceUri(source: ReaderSurfaceProps['source']): string | undefined {
  if (typeof source === 'string') return source;
  if (typeof source === 'number') return Image.resolveAssetSource(source).uri;
  return source ? source.uri : undefined;
}

function resolveLineHeight(lineHeight: NonNullable<ReaderSurfaceProps['lineHeight']>): number {
  if (lineHeight === 'compact') return 1.25;
  if (lineHeight === 'relaxed') return 1.75;
  return 1.5;
}

const styles = StyleSheet.create({
  viewport: { flex: 1, minHeight: 360 },
});

const DOM_CONFIGURATION = {
  allowsInlineMediaPlayback: false,
  javaScriptCanOpenWindowsAutomatically: false,
  mediaPlaybackRequiresUserAction: true,
  originWhitelist: ['about:blank', 'blob:*'],
  scrollEnabled: false,
  style: styles.viewport,
  unstable_useExpoModulesBridge: false,
};
