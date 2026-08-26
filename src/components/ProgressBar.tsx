import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(((step - 1) / (total - 1)) * 100)));
  return (
    <View style={styles.wrapper}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.pctText}>{pct}%</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: '#f0e0e4',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    backgroundColor: '#D20236',
    borderRadius: 3,
  },
  pctText: {
    marginLeft: 10,
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#D20236',
    minWidth: 34,
    textAlign: 'right',
  },
});
