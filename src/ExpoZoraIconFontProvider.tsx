import React from 'react';

export interface ExpoZoraIconFontProviderProps {
  readonly children: React.ReactNode;
}

export function ExpoZoraIconFontProvider(props: ExpoZoraIconFontProviderProps) {
  return <>{props.children}</>;
}
