import { describe, expect, test } from 'bun:test';

import { resolveReaderNavigationIntent } from './resolveReaderNavigationIntent';

const defaultInput = {
  canGoNext: true,
  canGoPrevious: true,
  deltaX: -49,
  deltaY: 0,
  direction: 'ltr' as const,
  viewportWidth: 300,
};

describe('resolveReaderNavigationIntent', () => {
  test('maps one qualified LTR swipe to its logical page direction', () => {
    expect(resolveReaderNavigationIntent(defaultInput)).toBe('next');
    expect(resolveReaderNavigationIntent({ ...defaultInput, deltaX: 49 })).toBe('previous');
  });

  test('inverts horizontal navigation for RTL publications', () => {
    expect(resolveReaderNavigationIntent({ ...defaultInput, direction: 'rtl' })).toBe('previous');
    expect(resolveReaderNavigationIntent({ ...defaultInput, deltaX: 49, direction: 'rtl' })).toBe(
      'next',
    );
  });

  test('requires horizontal intent and a strict responsive distance threshold', () => {
    expect(resolveReaderNavigationIntent({ ...defaultInput, deltaX: -100, deltaY: 80 })).toBeNull();
    expect(resolveReaderNavigationIntent({ ...defaultInput, deltaX: -48 })).toBeNull();
    expect(
      resolveReaderNavigationIntent({ ...defaultInput, deltaX: -60, viewportWidth: 400 }),
    ).toBeNull();
    expect(
      resolveReaderNavigationIntent({ ...defaultInput, deltaX: -61, viewportWidth: 400 }),
    ).toBe('next');
  });

  test('does not claim selection, interactive content, or a document boundary', () => {
    expect(resolveReaderNavigationIntent({ ...defaultInput, hasSelection: true })).toBeNull();
    expect(
      resolveReaderNavigationIntent({ ...defaultInput, isInteractiveTarget: true }),
    ).toBeNull();
    expect(resolveReaderNavigationIntent({ ...defaultInput, canGoNext: false })).toBeNull();
    expect(
      resolveReaderNavigationIntent({ ...defaultInput, canGoPrevious: false, deltaX: 49 }),
    ).toBeNull();
  });
});
