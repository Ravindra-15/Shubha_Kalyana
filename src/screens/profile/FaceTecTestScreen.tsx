import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft, BadgeCheck, Camera} from 'lucide-react-native';

import {API_BASE_URL} from '../../api/client';
import {
  completeProfilePictureVerification,
  createProfilePictureVerificationSession,
} from '../../api/profile';
import {
  initializeFaceTec,
  startFaceTecEnrollment,
} from '../../services/faceTecService';

const FACETEC_PROCESS_SESSION_URL =
  `${API_BASE_URL.replace(/\/+$/, '')}/facetec/session-request`;

type VerificationStatus = 'initializing' | 'scanning' | 'completed' | 'failed';

type FaceTecEnrollmentResult = {
  success?: boolean;
  sessionStatus?: string;
  status?: string;
};

type VerificationResult = {
  sessionStatus: string | null;
  matchLevel: number | null;
  completedAt: string;
};

const getErrorMessage = (error: unknown): string => {
  const apiError = error as any;
  return (
    apiError?.response?.data?.message ||
    apiError?.message ||
    'Face verification could not be completed.'
  );
};

const FaceTecTestScreen = ({navigation}: any) => {
  const sessionStartedRef = useRef(false);
  const [status, setStatus] = useState<VerificationStatus>('initializing');
  const [errorMessage, setErrorMessage] = useState('');
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);

  const startVerification = useCallback(async () => {
    try {
      setStatus('initializing');
      setErrorMessage('');
      setVerificationResult(null);

      const verificationSession =
        await createProfilePictureVerificationSession();
      const externalDatabaseRefID =
        verificationSession?.externalDatabaseRefID;

      if (!externalDatabaseRefID) {
        throw new Error('Could not create a FaceTec verification session.');
      }

      const authToken = await AsyncStorage.getItem('token');
      if (!authToken) {
        throw new Error('Your login session has expired. Please log in again.');
      }

      await initializeFaceTec({
        backendProcessSessionUrl: FACETEC_PROCESS_SESSION_URL,
        authToken,
      });

      setStatus('scanning');

      const faceTecSessionResult =
        (await startFaceTecEnrollment(
          externalDatabaseRefID,
        )) as FaceTecEnrollmentResult;

      const verificationResponse =
        await completeProfilePictureVerification(
          externalDatabaseRefID,
        );

      setVerificationResult({
        sessionStatus:
          faceTecSessionResult?.sessionStatus ||
          faceTecSessionResult?.status ||
          null,
        matchLevel:
          verificationResponse?.verification?.matchLevel ?? null,
        completedAt: new Date().toISOString(),
      });
      setStatus('completed');
    } catch (error: unknown) {
      setStatus('failed');
      setErrorMessage(getErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    if (sessionStartedRef.current) {
      return;
    }

    sessionStartedRef.current = true;
    startVerification();
  }, [startVerification]);

  const isProcessing = status === 'initializing' || status === 'scanning';

  const goBackToEditProfile = () => {
    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('EditProfile');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goBackToEditProfile}
          disabled={isProcessing}
          style={styles.backBtn}>
          <ArrowLeft
            color={isProcessing ? '#bbb' : '#000'}
            size={24}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {status === 'initializing' && (
          <VerificationState
            icon={<Camera color="#D20236" size={36} />}
            title="Preparing FaceTec"
            message="Setting up your secure profile verification session."
            loading
          />
        )}

        {status === 'scanning' && (
          <VerificationState
            icon={<Camera color="#D20236" size={36} />}
            title="Face verification in progress"
            message="Follow the instructions shown in the FaceTec camera screen."
            loading
          />
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
              Your live FaceTec selfie matched your current profile photo.
            </Text>
            {verificationResult?.matchLevel != null && (
              <Text style={styles.resultText}>
                Match level: {verificationResult.matchLevel}
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
              onPress={startVerification}>
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

function VerificationState({
  icon,
  title,
  message,
  loading,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  loading?: boolean;
}) {
  return (
    <View style={styles.stateCard}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateMessage}>{message}</Text>
      {loading && (
        <ActivityIndicator
          color="#D20236"
          size="large"
          style={styles.loader}
        />
      )}
    </View>
  );
}

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
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {fontSize: 18, fontWeight: '700', color: '#000'},
  headerSpacer: {width: 40},
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
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
  stateTitle: {
    marginTop: 18,
    fontSize: 21,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
  },
  successTitle: {color: '#1a7f37'},
  failedTitle: {color: '#D20236'},
  stateMessage: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#666',
    textAlign: 'center',
  },
  resultText: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  loader: {marginTop: 22},
  primaryButton: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#D20236',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  primaryButtonText: {fontSize: 15, fontWeight: '700', color: '#fff'},
  secondaryButton: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {fontSize: 14, fontWeight: '700', color: '#333'},
});

export default FaceTecTestScreen;
