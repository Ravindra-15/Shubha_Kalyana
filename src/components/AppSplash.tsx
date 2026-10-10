import React from 'react';
import { View, Image, Text, ActivityIndicator, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type Props = {
  showSpinner?: boolean;
};

// The branded red/white launch screen (Shaadi.com-style) -- shown on every
// app open while we check for a saved session, not just for brand-new
// users. Pure presentational, no navigation of its own.
export default function AppSplash({ showSpinner = true }: Props) {
  return (
    <LinearGradient
      colors={['#6C011C', '#D20236']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.logoWrap}>
        <View style={styles.logoBox}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.domText}>.com</Text>
        </View>
      </View>
      {showSpinner && (
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.spinner} />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // A rotated Text element keeps its PRE-rotation box for layout purposes
  // in RN -- flexbox has no idea the visible glyph extends ~100px
  // vertically once rotated, so it can't be flowed next to the wordmark
  // with margins alone. Positioning it absolutely (anchored to this fixed-
  // size box around the logo image) and rotating around its own center is
  // the only way to land it exactly where the text block actually is.
  logoBox: { width: 180, height: 180, position: 'relative' },
  logo: { width: 180, height: 180 },
  // Rotated -90deg so it reads bottom-to-top, attached right next to the
  // wordmark. Same display font as the logo's "SHUBHA KALYANA" text
  // (Yeseva One). width here becomes the visual height after rotation --
  // tuned to roughly span both text rows -- and left/top position the
  // (invisible, pre-rotation) box so the rotated glyph's center lands just
  // past the wordmark's right edge, vertically centered on it.
  domText: {
    position: 'absolute',
    left: 112,
    top: 93,
    width: 110,
    color: '#fff',
    fontSize: 22,
    fontFamily: 'YesevaOne-Regular',
    letterSpacing: 2,
    transform: [{ rotate: '-90deg' }],
    textAlign: 'center',
  },
  spinner: { position: 'absolute', bottom: 80 },
});
