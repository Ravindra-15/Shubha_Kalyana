import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { validateGalleryPhotoAsset } from '../utils/profilePhotoValidation';

type GalleryPhoto = { publicId?: string; url: string };

type Props = {
  photos: GalleryPhoto[];
  onAdd?: (asset: any) => void;
  onRemove?: (publicId: string) => void;
  maxCount?: number;
  uploadingSlotIndex?: number | null;
  title?: string;
  // When true, renders the gallery as a plain read-only strip: no "+" add
  // slot and no per-photo "×" remove badge. Used by the Edit Profile screen
  // now that profile/gallery photos are fully locked server-side; the
  // onboarding photo screens keep using this component in its normal,
  // interactive mode and are unaffected (readOnly defaults to false).
  readOnly?: boolean;
};

export default function GalleryPhotoRow({
  photos = [],
  onAdd,
  onRemove,
  maxCount = 3,
  uploadingSlotIndex = null,
  title = 'Add up to 3 more photos (optional)',
  readOnly = false,
}: Props) {
  const emptySlots = readOnly ? 0 : Math.max(0, maxCount - photos.length);
  const isUploading = uploadingSlotIndex !== null;

  const pickPhoto = async () => {
    if (readOnly || isUploading || !onAdd) return;

    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.didCancel || result.errorCode) return;

    const asset = result.assets?.[0];
    if (!asset) return;

    const validationError = validateGalleryPhotoAsset(asset);
    if (validationError) {
      Alert.alert('Invalid photo', validationError);
      return;
    }

    onAdd(asset);
  };

  if (readOnly && photos.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.row}>
        {photos.map((photo, index) => (
          <View key={photo.publicId || photo.url || index} style={styles.tile}>
            <Image source={{ uri: photo.url }} style={styles.image} />
            {!readOnly && (
              <TouchableOpacity
                style={styles.removeBadge}
                onPress={() => onRemove?.(photo.publicId || '')}
              >
                <Text style={styles.removeText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {!readOnly &&
          Array.from({ length: emptySlots }).map((_, i) => {
            const slotIndex = photos.length + i;
            const isThisSlotUploading = uploadingSlotIndex === slotIndex;

            return (
              <TouchableOpacity
                key={`empty-${i}`}
                style={styles.emptyTile}
                onPress={pickPhoto}
                disabled={isUploading}
              >
                {isThisSlotUploading ? (
                  <ActivityIndicator size="small" color="#D20236" />
                ) : (
                  <Text style={styles.plus}>+</Text>
                )}
              </TouchableOpacity>
            );
          })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16 },
  title: { fontSize: 13, fontFamily: 'Outfit-SemiBold', color: '#333', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 4 },
  tile: {
    width: 58,
    height: 58,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#eee',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  removeBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: '#fff', fontSize: 12, fontFamily: 'Outfit-Bold', lineHeight: 14 },
  emptyTile: {
    width: 58,
    height: 58,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: { fontSize: 22, color: '#999', fontFamily: 'Outfit-Bold' },
});
