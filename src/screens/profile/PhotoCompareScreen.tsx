import React, {useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {launchCamera} from 'react-native-image-picker';
import {ArrowLeft, BadgeCheck, Camera} from 'lucide-react-native';
import {compareFacePhoto} from '../../api/profile';

type VerificationStatus = 'idle' | 'uploading' | 'completed' | 'failed';

const getErrorMessage = (error: unknown): string => {
  const apiError = error as any;
  return (
    apiError?.response?.data?.message ||
    apiError?.message ||
    'Face verification could not be completed.'
  );
};

const PhotoCompareScreen = ({navigation}: any) => {
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [similarity, setSimilarity] = useState<number | null>(null);

  const goBackToEditProfile = () => {
    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('EditProfile');
  };

  const takeSelfieAndVerify = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      cameraType: 'front',
      quality: 0.8,
    });

    if (result.didCancel) return;
    if (result.errorCode) {
      setStatus('failed');
      setErrorMessage(result.errorMessage || 'Could not open camera.');
      return;
    }

    const asset = result.assets?.[0];
    if (!asset?.uri) {
      setStatus('failed');
      setErrorMessage('No photo was captured.');
      return;
    }

    try {
      setStatus('uploading');
      setErrorMessage('');
      setSimilarity(null);

      const response = await compareFacePhoto({
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `selfie_${Date.now()}.jpg`,
      });

      setSimilarity(response?.similarity ?? null);

      if (response?.matched) {
        setStatus('completed');
      } else {
        setStatus('failed');
        setErrorMessage('Your selfie did not match your profile photo.');
      }
    } catch (error: unknown) {
      setStatus('failed');
      setErrorMessage(getErrorMessage(error));
    }
  };

  const isProcessing = status === 'uploading';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goBackToEditProfile}
          disabled={isProcessing}
          style={styles.backBtn}>
          <ArrowLeft color={isProcessing ? '#bbb' : '#000'} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {status === 'idle' && (
          <View style={styles.stateCard}>
            <View style={styles.iconWrap}>
              <Camera color="#D20236" size={36} />
            </View>
            <Text style={styles.stateTitle}>Verify your photo</Text>
            <Text style={styles.stateMessage}>
              Take a quick selfie to confirm it matches your profile picture.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={takeSelfieAndVerify}>
              <Text style={styles.primaryButtonText}>Take Selfie</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'uploading' && (
          <View style={styles.stateCard}>
            <View style={styles.iconWrap}>
              <Camera color="#D20236" size={36} />
            </View>
            <Text style={styles.stateTitle}>Verifying...</Text>
            <Text style={styles.stateMessage}>
              Comparing your selfie with your profile photo.
            </Text>
            <ActivityIndicator color="#D20236" size="large" style={styles.loader} />
          </View>
        )}

        {status === 'completed' && (
          <View style={styles.stateCard}>
            <View style={[styles.iconWrap, styles.successIconWrap]}>
              <BadgeCheck color="#fff" fill="#1a7f37" size={40} />
            </View>
            <Text style={[styles.stateTitle, styles.successTitle]}>
              Profile verified
            </Text>
            <Text style={styles.stateMessage}>
              Your selfie matched your current profile photo.
            </Text>
            {similarity != null && (
              <Text style={styles.resultText}>
                Match: {Math.round(similarity)}%
              </Text>
            )}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={goBackToEditProfile}>
              <Text style={styles.primaryButtonText}>Return to Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'failed' && (
          <View style={styles.stateCard}>
            <View style={[styles.iconWrap, styles.failedIconWrap]}>
              <Text style={styles.failedIcon}>!</Text>
            </View>
            <Text style={[styles.stateTitle, styles.failedTitle]}>
              Verification failed
            </Text>
            <Text style={styles.stateMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={takeSelfieAndVerify}>
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={goBackToEditProfile}>
              <Text style={styles.secondaryButtonText}>Back to Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},
  headerTitle: {fontSize: 18, fontWeight: '700', color: '#000'},
  headerSpacer: {width: 40},
  content: {flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40},
  stateCard: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 34,
    backgroundColor: '#fff',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fdf2f5',
  },
  successIconWrap: {backgroundColor: '#e9f8ee'},
  failedIconWrap: {backgroundColor: '#fdf2f5'},
  failedIcon: {fontSize: 32, fontWeight: '800', color: '#D20236'},
  stateTitle: {marginTop: 18, fontSize: 21, fontWeight: '800', color: '#000', textAlign: 'center'},
  successTitle: {color: '#1a7f37'},
  failedTitle: {color: '#D20236'},
  stateMessage: {marginTop: 8, fontSize: 14, lineHeight: 21, color: '#666', textAlign: 'center'},
  resultText: {marginTop: 14, fontSize: 13, fontWeight: '700', color: '#333'},
  loader: {marginTop: 22},
  primaryButton: {
    minHeight: 48, borderRadius: 10, backgroundColor: '#D20236',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch',
    marginTop: 24, paddingHorizontal: 16,
  },
  primaryButtonText: {fontSize: 15, fontWeight: '700', color: '#fff'},
  secondaryButton: {
    minHeight: 46, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch',
    marginTop: 12, paddingHorizontal: 16,
  },
  secondaryButtonText: {fontSize: 14, fontWeight: '700', color: '#333'},
});

export default PhotoCompareScreen;