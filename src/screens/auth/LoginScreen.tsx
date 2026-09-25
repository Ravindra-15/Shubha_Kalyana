import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KeyboardWrapper from '../../components/KeyboardWrapper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getResumeScreen } from '../../utils/resumeOnboarding';
import apiClient from '../../api/client';
import { handleLoginOtpError } from '../../utils/loginOtpErrors';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function LoginScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [mobile, setMobile] = useState('');
  const [sending, setSending] = useState(false);

  // The logo fades up as the screen opens, and the soft circles drift in just
  // behind it. Decorative only -- nothing waits on this.
  const entrance = useRef(new Animated.Value(0)).current;
  const [keyboardOpen, setKeyboardOpen] = useState(false);


  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  // Send the OTP from here, and only move to the OTP screen once it has
  // actually gone out -- unknown numbers and profiles still under review stay
  // on this screen with a clear message.
  const handleLogin = async () => {
    const trimmed = mobile.trim();
    if (!trimmed) return Alert.alert(t('common.error'), t('login.errorEnterMobile'));
    if (sending) return;

    const normalized = trimmed.includes('@') ? trimmed.toLowerCase() : trimmed;
    try {
      setSending(true);
      const res = await apiClient.post('/auth/mobile/login/otp/send', { mobile: normalized });
      // Temporary: while SMS is unavailable the server returns the code.
      const bypassOtp = res.data?.data?.bypassOtp;
      navigation.navigate('LoginOtp', { mobile: trimmed, otpSent: true, bypassOtp });
    } catch (err: any) {
      const alreadySent = handleLoginOtpError(err, { onSignup: handleSignup });
      if (alreadySent) navigation.navigate('LoginOtp', { mobile: trimmed, otpSent: true });
    } finally {
      setSending(false);
    }
  };

  const handleSignup = async () => {
    const onboardingToken = await AsyncStorage.getItem('onboardingToken');
    if (!onboardingToken) {
      // no in-progress onboarding → fresh signup
      return navigation.navigate('SignupProfileFor');
    }

    const resumeScreen = await getResumeScreen();
    if (!resumeScreen || resumeScreen === 'ReviewProfile') {
      // completed or nothing to resume → start fresh
      await AsyncStorage.removeItem('onboardingToken');
      return navigation.navigate('SignupProfileFor');
    }

    // mid-way → ask
    Alert.alert(
      t('login.continueSignupTitle'),
      t('login.continueSignupMessage'),
      [
        {
          text: t('login.startNew'),
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('onboardingToken');
            navigation.navigate('SignupProfileFor');
          },
        },
        { text: t('login.continueLabel'), onPress: () => navigation.navigate(resumeScreen as never) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Soft branded backdrop: a pale wash plus two faint circles, so the
          screen does not read as an empty white page. Purely decorative. */}
      <View pointerEvents="none" style={styles.backdrop}>
        <Animated.View
          style={[
            styles.blob,
            styles.blobTop,
            {
              opacity: entrance,
              transform: [
                { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.blob,
            styles.blobBottom,
            {
              opacity: entrance,
              transform: [
                { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
              ],
            },
          ]}
        />
      </View>

      {/* The Select Language screen cannot be reached again, so the language
          can be changed from here. */}
      <View style={styles.topBar}>
        <LanguageSwitcher />
      </View>

      <KeyboardWrapper>
        <View style={styles.content}>
          <Animated.Image
            // White artwork on a transparent background, painted red by
            // styles.logo. It is far higher resolution, so it stays sharp.
            source={require('../../assets/images/logo-white-stacked.png')}
            style={[
              styles.logo,
              {
                opacity: entrance,
                transform: [
                  {
                    translateY: entrance.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 0],
                    }),
                  },
                ],
              },
            ]}
            resizeMode="contain"
          />

          <Text style={styles.label}>{t('login.mobileEmailLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('login.mobilePlaceholder')}
            placeholderTextColor="#999"
            value={mobile}
            onChangeText={(text) => setMobile(text.includes('@') ? text.toLowerCase() : text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>{t('login.logIn')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>{t('login.noAccount')}</Text>
            <TouchableOpacity onPress={handleSignup}>
              <Text style={styles.signupLink}>{t('login.signUp')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardWrapper>

      {/* Pinned to the bottom, but hidden while the keyboard is open so it
          never sits just above the keys. */}
      {keyboardOpen ? null : (
        <Text style={styles.copyright}>
          © 2026 Shubhakalyana. All Rights Reserved.
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7F9' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(210, 2, 54, 0.06)' },
  blobTop: { width: 260, height: 260, top: -90, right: -70 },
  blobBottom: { width: 320, height: 320, bottom: -140, left: -110 },
  flex: { flex: 1 },
  topBar: { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 8 },
  content: { paddingHorizontal: 24, paddingVertical: 40, flexGrow: 1, justifyContent: 'center' },
  logo: {
    width: 180,
    height: 128,
    alignSelf: 'center',
    marginTop: -40,
    marginBottom: 56,
    tintColor: '#D20236',
  },
  label: { fontSize: 16, color: '#333', marginBottom: 8, fontFamily: 'Outfit-Medium' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 18,
    fontSize: 15,
    marginBottom: 24,
    color: '#000',
  },
  loginBtn: {
    backgroundColor: '#D20236',
    borderRadius: 14,
    paddingVertical: 18,
    marginTop: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  loginText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold' },
  signupRow: { flexDirection: 'row', justifyContent: 'center' },
  signupText: { color: '#333', fontSize: 16,fontFamily: 'Outfit-Medium' },
  signupLink: { color: '#D20236', fontSize: 16, fontFamily: 'Outfit-Bold' },
  copyright: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
    paddingBottom: 16,
  },
});