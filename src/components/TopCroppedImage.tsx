import React, { useState } from 'react';
import { Image, View, LayoutChangeEvent, ViewStyle, StyleProp } from 'react-native';

type Props = {
  uri: string;
  style?: StyleProp<ViewStyle>;
};

// Mirrors the idea the web app already uses for profile card photos
// (ProfileCard.jsx: a fixed aspect-ratio box with
// `object-cover object-[center_30%]`) -- plain resizeMode="cover" crops
// from dead-center, which tends to cut faces off tall photos since the
// subject is usually in the upper portion, not the middle. Here we render
// the image a bit taller than its box and shift it up, so the crop is
// biased toward the top instead of centered. Not a perfect fix for badly
// composed source photos (that needs upload-time cropping, planned later)
// -- just a simple, synchronous approximation of the web behavior.
const OVERSCAN = 1.18; // image rendered 18% taller than its box
const TOP_BIAS = 0.3; // ~ web's object-position 30% from top

export default function TopCroppedImage({ uri, style }: Props) {
  const [boxHeight, setBoxHeight] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h && h !== boxHeight) setBoxHeight(h);
  };

  const imageHeight = boxHeight * OVERSCAN;
  const marginTop = boxHeight ? -TOP_BIAS * (imageHeight - boxHeight) : 0;

  return (
    <View
      style={[{ overflow: 'hidden', backgroundColor: '#fce4ec' }, style]}
      onLayout={onLayout}
    >
      {boxHeight > 0 && (
        <Image
          source={{ uri }}
          resizeMode="cover"
          style={{ width: '100%', height: imageHeight, marginTop }}
        />
      )}
    </View>
  );
}
