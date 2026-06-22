import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { normalizeDisplayImageUri } from '../utils/imageUri';

type SelfiePreviewImageProps = {
  uri: string;
  imageWidth?: number;
  imageHeight?: number;
};

export function SelfiePreviewImage({
  uri,
  imageWidth,
  imageHeight,
}: SelfiePreviewImageProps) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const aspectRatio =
    imageWidth && imageHeight && imageWidth > 0
      ? imageHeight / imageWidth
      : 4 / 3;

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout({ width, height });
  };

  const displayUri = normalizeDisplayImageUri(uri);
  const { width: boxWidth, height: boxHeight } = layout;

  let imageStyle: {
    position: 'absolute';
    right: number;
    bottom: number;
    width: number;
    height: number;
  } | null = null;

  if (boxWidth > 0 && boxHeight > 0) {
    const scale = Math.max(boxWidth, boxHeight / aspectRatio);
    imageStyle = {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: scale,
      height: scale * aspectRatio,
    };
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      {imageStyle ? (
        <Image
          source={{ uri: displayUri }}
          style={imageStyle}
          resizeMode="cover"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
});
