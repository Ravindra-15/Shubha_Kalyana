import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal } from 'react-native';

type GalleryPhoto = { publicId?: string; url: string };

type Props = {
  visible: boolean;
  photos: GalleryPhoto[];
  startIndex?: number;
  onClose: () => void;
};

export default function GalleryLightboxModal({ visible, photos, startIndex = 0, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);

  if (!photos.length) return null;

  const goPrev = () => setIndex((prev) => (prev - 1 + photos.length) % photos.length);
  const goNext = () => setIndex((prev) => (prev + 1) % photos.length);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onShow={() => setIndex(startIndex)}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>

        {photos.length > 1 && (
          <Text style={styles.counter}>
            {index + 1} / {photos.length}
          </Text>
        )}

        <Image source={{ uri: photos[index]?.url }} style={styles.image} resizeMode="contain" />

        {photos.length > 1 && (
          <>
            <TouchableOpacity style={[styles.navBtn, styles.navLeft]} onPress={goPrev}>
              <Text style={styles.navText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navBtn, styles.navRight]} onPress={goNext}>
              <Text style={styles.navText}>›</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '90%', height: '75%' },
  closeBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  closeText: { color: '#fff', fontSize: 20, lineHeight: 22 },
  counter: {
    position: 'absolute',
    top: 48,
    left: 20,
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLeft: { left: 12 },
  navRight: { right: 12 },
  navText: { color: '#fff', fontSize: 26, lineHeight: 28 },
});
