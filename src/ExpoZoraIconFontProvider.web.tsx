import fontAwesome from '@react-native-vector-icons/fontawesome/fonts/FontAwesome.ttf';
import fontAwesome5Brands from '@react-native-vector-icons/fontawesome5/fonts/FontAwesome5_Brands.ttf';
import fontAwesome5Regular from '@react-native-vector-icons/fontawesome5/fonts/FontAwesome5_Regular.ttf';
import fontAwesome5Solid from '@react-native-vector-icons/fontawesome5/fonts/FontAwesome5_Solid.ttf';
import fontAwesome6Brands from '@react-native-vector-icons/fontawesome6/fonts/FontAwesome6_Brands.ttf';
import fontAwesome6Regular from '@react-native-vector-icons/fontawesome6/fonts/FontAwesome6_Regular.ttf';
import fontAwesome6Solid from '@react-native-vector-icons/fontawesome6/fonts/FontAwesome6_Solid.ttf';
import ionicons from '@react-native-vector-icons/ionicons/fonts/Ionicons.ttf';
import materialDesignIcons from '@react-native-vector-icons/material-design-icons/fonts/MaterialDesignIcons.ttf';
import { useFonts } from 'expo-font';
import React from 'react';

const ZORA_ICON_FONTS = {
  FontAwesome: fontAwesome,
  'FontAwesome5Brands-Regular': fontAwesome5Brands,
  'FontAwesome5Free-Regular': fontAwesome5Regular,
  'FontAwesome5Free-Solid': fontAwesome5Solid,
  'FontAwesome6Brands-Regular': fontAwesome6Brands,
  'FontAwesome6Free-Regular': fontAwesome6Regular,
  'FontAwesome6Free-Solid': fontAwesome6Solid,
  Ionicons: ionicons,
  MaterialDesignIcons: materialDesignIcons,
} as const;

export interface ExpoZoraIconFontProviderProps {
  readonly children: React.ReactNode;
}

export function ExpoZoraIconFontProvider(props: ExpoZoraIconFontProviderProps) {
  const [loaded, error] = useFonts(ZORA_ICON_FONTS);

  if (error) {
    throw error;
  }

  if (!loaded) {
    return null;
  }

  return <>{props.children}</>;
}
