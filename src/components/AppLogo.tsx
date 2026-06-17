import React from 'react';
import {
  Dimensions,
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
} from 'react-native';

const logoSource = require('../../assets/opg-logo.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LOGO_ASPECT_RATIO = 1.5;

export type AppLogoVariant = 'splash' | 'header' | 'compact';

const VARIANT_WIDTH: Record<AppLogoVariant, number> = {
  splash: Math.min(SCREEN_WIDTH * 0.78, 320) * 0.7,
  header: Math.min(SCREEN_WIDTH * 0.68, 260),
  compact: Math.min(SCREEN_WIDTH * 0.5, 180),
};

type AppLogoProps = {
  variant?: AppLogoVariant;
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  centered?: boolean;
};

export default function AppLogo({
  variant = 'splash',
  width,
  height,
  style,
  centered = true,
}: AppLogoProps) {
  const resolvedWidth = width ?? VARIANT_WIDTH[variant];
  const resolvedHeight = height ?? resolvedWidth / LOGO_ASPECT_RATIO;

  const image = (
    <Image
      source={logoSource}
      style={[{ width: resolvedWidth, height: resolvedHeight }, style]}
      resizeMode="contain"
      accessibilityLabel="OPG Security logo"
    />
  );

  if (!centered) {
    return image;
  }

  return <View style={styles.centered}>{image}</View>;
}

const styles = StyleSheet.create({
  centered: {
    width: '100%',
    alignItems: 'center',
  },
});
