import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';

type Props = {
  count: number;
  onPress: () => void;
};

export default function LockedGalleryPreview({ count, onPress }: Props) {
  const visibleCount = Math.min(3, count);
  const remaining = count - 2;
  const showOverlayOnLast = count > 3;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gallery Photos</Text>
      <View style={styles.row}>
        {Array.from({ length: visibleCount }).map((_, index) => {
          const isLastTile = index === 2 && showOverlayOnLast;

          return (
            <TouchableOpacity key={index} style={styles.tile} onPress={onPress} activeOpacity={0.8}>
              {isLastTile ? (
                <Text style={styles.overlayText}>+{remaining} More</Text>
              ) : (
                <Lock color="#D20236" size={14} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 14, paddingHorizontal: 16 },
  title: { fontSize: 12, fontFamily: 'Outfit-SemiBold', color: '#666', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  tile: {
    width: 58,
    height: 58,
    borderRadius: 8,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: { color: '#D20236', fontSize: 11, fontFamily: 'Outfit-Bold' },
});
