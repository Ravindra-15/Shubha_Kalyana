import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import ProgressBar from '../../../components/ProgressBar';
import apiClient from '../../../api/client';

export default function ProfilePhotoScreen({ navigation }: any) {
  const [photo, setPhoto] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = () => {
    Alert.alert('Upload Photo', 'Choose an option', [
      { text: 'Camera', onPress: openCamera },
      { text: 'Gallery', onPress: openGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openCamera = async () => {
    const result = await launchCamera({ mediaType: 'photo', quality: 0.8 });
    handleResult(result);
  };

  const openGallery = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    handleResult(result);
  };

  const handleResult = (result: any) => {
    if (result.didCancel) return;
    if (result.errorCode) {
      return Alert.alert('Error', result.errorMessage || 'Could not pick image');
    }
    const asset = result.assets?.[0];
    if (asset) {
      // size check (5MB)
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        return Alert.alert('Too large', 'Image must be under 5MB');
      }
      setPhoto(asset);
    }
  };

  const uploadPhoto = async () => {
    if (!photo) return Alert.alert('Required', 'Please select a photo first');

    const formData = new FormData();
    formData.append('profilePhoto', {
      uri: photo.uri,
      type: photo.type || 'image/jpeg',
      name: photo.fileName || `photo_${Date.now()}.jpg`,
    } as any);

    try {
      setLoading(true);
      await apiClient.post('/onboarding/profile-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigation.navigate('Hobbies');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const skipPhoto = async () => {
    try {
      setLoading(true);
      await apiClient.post('/onboarding/profile-photo/skip');
      navigation.navigate('Hobbies');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not skip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <ProgressBar step={9} total={9} />

        <Text style={styles.congrats}>Congratulations !</Text>
        <Text style={styles.title}>Profile has been created</Text>
        <Text style={styles.subtitle}>Upload photo and get better matches</Text>

        <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} activeOpacity={0.8}>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
          <View style={styles.plusBadge}>
            <Text style={styles.plus}>+</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
          <Text style={styles.uploadText}>Upload photo</Text>
        </TouchableOpacity>

        <Text style={styles.guidelines}>View Photo Guidelines</Text>

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.nextBtn} onPress={uploadPhoto} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextText}>Next  →</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={skipPhoto} disabled={loading}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, paddingHorizontal: 24, paddingBottom: 30 },
  back: { fontSize: 24, color: '#000', marginTop: 8 },
  congrats: { fontSize: 22, fontWeight: '700', color: '#D20236', textAlign: 'center', marginTop: 10 },
  title: { fontSize: 20, fontWeight: '700', color: '#000', textAlign: 'center', marginTop: 4 },
  subtitle: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 8, marginBottom: 30 },
  avatarWrap: { alignSelf: 'center', marginBottom: 24 },
  avatar: { width: 130, height: 130, borderRadius: 65 },
  avatarPlaceholder: { width: 130, height: 130, borderRadius: 65, backgroundColor: '#eee' },
  plusBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#D20236',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: { color: '#fff', fontSize: 20, fontWeight: '700' },
  uploadBtn: {
    backgroundColor: '#D20236',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 50,
  },
  uploadText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  guidelines: { fontSize: 13, color: '#333', textAlign: 'center', marginTop: 14 },
  spacer: { flex: 1 },
  nextBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipBtn: {
    borderWidth: 1,
    borderColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipText: { color: '#000', fontSize: 16, fontWeight: '600' },
});