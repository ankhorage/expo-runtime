import { describe, expect, test } from 'bun:test';

import { resolveReaderKeyboardIntent } from './resolveReaderKeyboardIntent';

const defaultInput = {
  canGoNext: true,
  canGoPrevious: true,
  direction: 'ltr' as const,
  key: 'ArrowRight',
};

describe('resolveReaderKeyboardIntent', () => {
  test('maps directional keys in LTR and RTL publications', () => {
    expect(resolveReaderKeyboardIntent(defaultInput)).toBe('next');
    expect(resolveReaderKeyboardIntent({ ...defaultInput, key: 'ArrowLeft' })).toBe('previous');
    expect(resolveReaderKeyboardIntent({ ...defaultInput, direction: 'rtl' })).toBe('previous');
    expect(
      resolveReaderKeyboardIntent({ ...defaultInput, direction: 'rtl', key: 'ArrowLeft' }),
    ).toBe('next');
  });

  test('keeps PageUp and PageDown tied to logical page order', () => {
    expect(resolveReaderKeyboardIntent({ ...defaultInput, key: 'PageUp' })).toBe('previous');
    expect(
      resolveReaderKeyboardIntent({ ...defaultInput, direction: 'rtl', key: 'PageDown' }),
    ).toBe('next');
  });

  test('ignores modified, interactive, unsupported, and boundary input', () => {
    expect(resolveReaderKeyboardIntent({ ...defaultInput, hasModifier: true })).toBeNull();
    expect(resolveReaderKeyboardIntent({ ...defaultInput, isInteractiveTarget: true })).toBeNull();
    expect(resolveReaderKeyboardIntent({ ...defaultInput, key: 'Enter' })).toBeNull();
    expect(resolveReaderKeyboardIntent({ ...defaultInput, canGoNext: false })).toBeNull();
    expect(
      resolveReaderKeyboardIntent({ ...defaultInput, canGoPrevious: false, key: 'ArrowLeft' }),
    ).toBeNull();
  });
});
