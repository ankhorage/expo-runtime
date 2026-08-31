export function resolveReaderKeyboardIntent(input: {
  canGoNext: boolean;
  canGoPrevious: boolean;
  direction: 'ltr' | 'rtl';
  hasModifier?: boolean;
  isInteractiveTarget?: boolean;
  key: string;
}): 'next' | 'previous' | null {
  if (input.hasModifier || input.isInteractiveTarget) return null;

  let intent: 'next' | 'previous' | null = null;
  if (input.key === 'PageUp') intent = 'previous';
  if (input.key === 'PageDown') intent = 'next';
  if (input.key === 'ArrowLeft') intent = input.direction === 'ltr' ? 'previous' : 'next';
  if (input.key === 'ArrowRight') intent = input.direction === 'ltr' ? 'next' : 'previous';

  if (intent === 'next') return input.canGoNext ? intent : null;
  if (intent === 'previous') return input.canGoPrevious ? intent : null;
  return null;
}
