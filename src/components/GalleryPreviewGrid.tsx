import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import GalleryLightboxModal from './GalleryLightboxModal';

type GalleryPhoto = { publicId?: string; url: string };

type Props = {
  photos: GalleryPhoto[];
  title?: string;
};

export default function GalleryPreviewGrid({ photos = [], title = 'Gallery Photos' }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!photos.length) return null;

  const visible = photos.slice(0, 3);
  const remaining = photos.length - 2;
  const showOverlayOnLast = photos.length > 3;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.row}>
        {visible.map((photo, index) => {
          const isLastTile = index === 2 && showOverlayOnLast;

          return (
            <TouchableOpacity
              key={photo.publicId || photo.url || index}
              style={styles.tile}
              onPress={() => setLightboxIndex(index)}
              activeOpacity={0.85}
            >
              <Image source={{ uri: photo.url }} style={styles.image} />
              {isLastTile && (
                <View style={[StyleSheet.absoluteFill, styles.overlay]}>
                  <Text style={styles.overlayText}>+{remaining} More</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <GalleryLightboxModal
        visible={lightboxIndex !== null}
        photos={photos}
        startIndex={lightboxIndex || 0}
        onClose={() => setLightboxIndex(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 14 },
  title: { fontSize: 12, fontFamily: 'Outfit-SemiBold', color: '#666', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  tile: {
    width: 58,
    height: 58,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  image: { width: '100%', height: '100%' },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: { color: '#fff', fontSize: 11, fontFamily: 'Outfit-Bold' },
});
