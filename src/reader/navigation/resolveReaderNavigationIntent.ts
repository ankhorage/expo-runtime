export function resolveReaderNavigationIntent(input: {
  canGoNext: boolean;
  canGoPrevious: boolean;
  deltaX: number;
  deltaY: number;
  direction: 'ltr' | 'rtl';
  hasSelection?: boolean;
  isInteractiveTarget?: boolean;
  viewportWidth: number;
}): 'next' | 'previous' | null {
  if (input.hasSelection || input.isInteractiveTarget) return null;

  const horizontalDistance = Math.abs(input.deltaX);
  const verticalDistance = Math.abs(input.deltaY);
  const distanceThreshold = Math.max(48, input.viewportWidth * 0.15);

  if (horizontalDistance <= verticalDistance * 1.25) return null;
  if (horizontalDistance <= distanceThreshold) return null;

  const movesForward = input.direction === 'ltr' ? input.deltaX < 0 : input.deltaX > 0;
  if (movesForward) return input.canGoNext ? 'next' : null;
  return input.canGoPrevious ? 'previous' : null;
}
