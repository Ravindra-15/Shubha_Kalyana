import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.min(100, Math.round((step / total) * 100));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </View>
  );
}
const styles = StyleSheet.create({
  track: {
    height: 6,
    backgroundColor: '#f0e0e4',
    borderRadius: 3,
    marginVertical: 16,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    backgroundColor: '#D20236',
    borderRadius: 3,
  },
});