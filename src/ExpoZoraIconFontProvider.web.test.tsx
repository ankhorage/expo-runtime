import { afterAll, describe, expect, mock, test } from 'bun:test';
import React from 'react';

const useFonts = mock(
  (_fonts: Readonly<Record<string, number>>): readonly [boolean, Error | null] => [true, null],
);

void mock.module('expo-font', () => ({ useFonts }));

const { ExpoZoraIconFontProvider } = await import('./ExpoZoraIconFontProvider.web');

describe('ExpoZoraIconFontProvider Web', () => {
  afterAll(() => {
    mock.restore();
  });

  test('loads every font face used by the ZORA icon providers before rendering', () => {
    const child = React.createElement('child');
    const element = ExpoZoraIconFontProvider({ children: child });

    expect(useFonts).toHaveBeenCalledTimes(1);
    const fonts = useFonts.mock.calls[0]?.[0] ?? {};
    expect(
      Object.entries(fonts).map(([family, source]) => [family, String(source).split('/').at(-1)]),
    ).toEqual([
      ['FontAwesome', 'FontAwesome.ttf'],
      ['FontAwesome5Brands-Regular', 'FontAwesome5_Brands.ttf'],
      ['FontAwesome5Free-Regular', 'FontAwesome5_Regular.ttf'],
      ['FontAwesome5Free-Solid', 'FontAwesome5_Solid.ttf'],
      ['FontAwesome6Brands-Regular', 'FontAwesome6_Brands.ttf'],
      ['FontAwesome6Free-Regular', 'FontAwesome6_Regular.ttf'],
      ['FontAwesome6Free-Solid', 'FontAwesome6_Solid.ttf'],
      ['Ionicons', 'Ionicons.ttf'],
      ['MaterialDesignIcons', 'MaterialDesignIcons.ttf'],
    ]);
    expect(React.isValidElement(element)).toBe(true);
    if (!React.isValidElement(element)) {
      throw new Error('expected a React element');
    }
    expect(element.props.children).toBe(child);
  });

  test('holds the app boundary while fonts are loading', () => {
    useFonts.mockImplementationOnce(() => [false, null]);

    expect(ExpoZoraIconFontProvider({ children: React.createElement('child') })).toBeNull();
  });

  test('surfaces font-loading failures', () => {
    const error = new Error('font load failed');
    useFonts.mockImplementationOnce(() => [false, error]);

    expect(() => ExpoZoraIconFontProvider({ children: React.createElement('child') })).toThrow(
      error,
    );
  });
});
