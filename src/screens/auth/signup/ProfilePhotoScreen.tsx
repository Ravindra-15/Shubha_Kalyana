import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import ProgressBar from '../../../components/ProgressBar';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateProfilePhotoAsset } from '../../../utils/profilePhotoValidation';

const guidelineItems = [
  {
    source: require('../../../assets/images/profile-guidelines/closeup.png'),
    label: 'Close up',
    ok: true,
  },
  {
    source: require('../../../assets/images/profile-guidelines/halfview.png'),
    label: 'Half View',
    ok: true,
  },
  {
    source: require('../../../assets/images/profile-guidelines/fullview.png'),
    label: 'Full View',
    ok: true,
  },
  {
    source: require('../../../assets/images/profile-guidelines/sideface.png'),
    label: 'Side Face',
    ok: false,
  },
  {
    source: require('../../../assets/images/profile-guidelines/unclear.png'),
    label: 'Unclear',
    ok: false,
  },
  {
    source: require('../../../assets/images/profile-guidelines/group.png'),
    label: 'Group',
    ok: false,
  },
];

const doGuidelines = [
  'Your photo should be front facing and your entire face should be visible.',
  'Ensure that your photo is recent and not with a group.',
  'Use a JPG or PNG photo up to 2MB.',
];

const dontGuidelines = [
  'Watermarked, morphed, unclear or irrelevant photographs may be rejected.',
];

export default function ProfilePhotoScreen({ navigation }: any) {
  const [photo, setPhoto] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('onboardingToken').then(token => {
      console.log('ONBOARDING TOKEN:', token);
    });
  }, []);

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
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });
    handleResult(result);
  };

  const handleResult = (result: any) => {
    if (result.didCancel) return;
    if (result.errorCode) {
      return Alert.alert(
        'Error',
        result.errorMessage || 'Could not pick image',
      );
    }
    const asset = result.assets?.[0];
    if (asset) {
      const validationError = validateProfilePhotoAsset(asset);
      if (validationError) return Alert.alert('Invalid photo', validationError);

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
      await apiClient.post('/onboarding/profile-photo', formData);
      navigation.navigate('Hobbies');
    } catch (err: any) {
      console.log('PHOTO UPLOAD ERROR:', err?.message, err?.code);
      console.log(
        'RAW RESPONSE:',
        JSON.stringify(err?.response?.data),
        '| STATUS:',
        err?.response?.status,
      );
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
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>

          <ProgressBar step={9} total={9} />

          <Text style={styles.congrats}>Congratulations !</Text>
          <Text style={styles.title}>Profile has been created</Text>
          <Text style={styles.subtitle}>
            Upload photo and get better matches
          </Text>
          <Text style={styles.recentPhotoMessage}>
            Please upload your most recent photo
          </Text>

          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={pickImage}
            activeOpacity={0.8}
          >
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

          <View style={styles.guidelinesSection}>
            <View style={styles.guidelinesHeader}>
              <View style={styles.guidelinesLine} />
              <Text style={styles.guidelinesTitle}>Photo Guidelines</Text>
              <View style={styles.guidelinesLine} />
            </View>

            <View style={styles.guidelineGrid}>
              {guidelineItems.map(item => (
                <View key={item.label} style={styles.guidelineTile}>
                  <View style={styles.guidelineImageWrap}>
                    <Image source={item.source} style={styles.guidelineImage} />
                    <View
                      style={[
                        styles.statusBadge,
                        item.ok ? styles.okBadge : styles.noBadge,
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {item.ok ? 'OK' : 'X'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.guidelineLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.guidelineCopy}>
              <Text style={styles.guidelineSubTitle}>Do's</Text>
              {doGuidelines.map(item => (
                <View key={item} style={styles.guidelinePoint}>
                  <View style={[styles.guidelineDot, styles.okDot]} />
                  <Text style={styles.guidelinePointText}>{item}</Text>
                </View>
              ))}

              <Text style={[styles.guidelineSubTitle, styles.dontTitle]}>
                Don't
              </Text>
              {dontGuidelines.map(item => (
                <View key={item} style={styles.guidelinePoint}>
                  <View style={[styles.guidelineDot, styles.noDot]} />
                  <Text style={styles.guidelinePointText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={uploadPhoto}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextText}>Next →</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={skipPhoto}
            disabled={loading}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, paddingHorizontal: 24, paddingBottom: 20 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 18 },
  back: { fontSize: 24, color: '#000', marginTop: 8 },
  congrats: {
    fontSize: 22,
    fontWeight: '700',
    color: '#D20236',
    textAlign: 'center',
    marginTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 8 },
  recentPhotoMessage: {
    fontSize: 13,
    color: '#D20236',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  avatarWrap: { alignSelf: 'center', marginBottom: 22 },
  avatar: { width: 130, height: 130, borderRadius: 65 },
  avatarPlaceholder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#eee',
  },
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
  guidelinesSection: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#F3CCD5',
    borderRadius: 8,
    backgroundColor: '#FFF8FA',
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 14,
  },
  guidelinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidelinesLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EFB6C3',
  },
  guidelinesTitle: {
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  guidelineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  guidelineTile: {
    width: '31%',
    alignItems: 'center',
    marginBottom: 14,
  },
  guidelineImageWrap: {
    width: 58,
    height: 58,
    borderRadius: 8,
    backgroundColor: '#FCE4EA',
    overflow: 'hidden',
  },
  guidelineImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statusBadge: {
    position: 'absolute',
    right: 3,
    bottom: 3,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  okBadge: { backgroundColor: '#24A148' },
  noBadge: { backgroundColor: '#D20236' },
  statusBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },
  guidelineLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
  },
  guidelineCopy: {
    borderTopWidth: 1,
    borderTopColor: '#F2D1D8',
    paddingTop: 12,
  },
  guidelineSubTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
    marginBottom: 6,
  },
  dontTitle: { marginTop: 8 },
  guidelinePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  guidelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 8,
  },
  okDot: { backgroundColor: '#24A148' },
  noDot: { backgroundColor: '#D20236' },
  guidelinePointText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#555',
  },
  footer: {
    paddingTop: 12,
    backgroundColor: '#fff',
  },
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
