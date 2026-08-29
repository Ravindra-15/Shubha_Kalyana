import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KeyboardWrapper from '../../components/KeyboardWrapper';
import apiClient from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getResumeScreen } from '../../utils/resumeOnboarding';

export default function LoginScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const [mobile, setMobile] = useState('');
  const [mpin, setMpin] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login } = useAuth();
  const mpinRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (route?.params?.justResetMpin) {
      Alert.alert(t('login.mpinResetTitle'), t('login.mpinResetMessage'));
      navigation.setParams({ justResetMpin: undefined });
    }
  }, [route?.params?.justResetMpin]);

  const handleMpinChange = (value: string, index: number) => {
    if (value.length > 1) return;
    const next = [...mpin];
    next[index] = value;
    setMpin(next);
    if (value && index < 3) mpinRefs.current[index + 1]?.focus();
    if (!value && index > 0) mpinRefs.current[index - 1]?.focus();
  };

  const handleLogin = async () => {
    const pin = mpin.join('');
    if (!mobile.trim()) return Alert.alert(t('common.error'), t('login.errorEnterMobile'));
    if (pin.length !== 4) return Alert.alert(t('common.error'), t('login.errorEnterMpin'));

    try {
      setLoading(true);
      const res = await apiClient.post('/auth/mobile/login/mpin', {
        mobile: mobile.trim(),
        mpin: pin,
      });
      const token = res.data?.data?.accessToken;
      const userData = res.data?.data?.user;
      if (token) {
        setLoading(false);
        setLoginSuccess(true);
        setTimeout(async () => {
          await login(token, userData);
          // navigation auto-switches to Home
        }, 1500);
      } else {
        setLoading(false);
        Alert.alert(t('common.error'), t('login.noTokenReceived'));
      }
    } catch (err: any) {
      setLoading(false);
      Alert.alert(t('login.loginFailedTitle'), err?.response?.data?.message || t('login.tryAgain'));
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
      <KeyboardWrapper>
        <View style={styles.content}>
          <Image
            source={require('../../assets/images/logo-red.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.label}>{t('login.mobileEmailLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('login.mobilePlaceholder')}
            placeholderTextColor="#999"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>{t('login.mpinLabel')}</Text>
          <View style={styles.mpinRow}>
            {mpin.map((digit, i) => (
              <TextInput
                key={i}
                ref={(el) => {
                  mpinRefs.current[i] = el;
                }}
                style={styles.mpinBox}
                value={digit}
                onChangeText={(v) => handleMpinChange(v, i)}
                keyboardType="number-pad"
                maxLength={1}
                secureTextEntry
                placeholder="*"
                placeholderTextColor="#bbb"
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.forgotWrap}
            onPress={() => navigation.navigate('ForgotMpin')}
          >
            <Text style={styles.forgot}>{t('login.forgotMpin')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>{t('login.logIn')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.otpBtn}
            onPress={() => navigation.navigate('LoginOtp', { mobile })}
          >
            <Text style={styles.otpText}>{t('login.logInWithOtp')}</Text>
          </TouchableOpacity>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>{t('login.noAccount')}</Text>
            <TouchableOpacity onPress={handleSignup}>
              <Text style={styles.signupLink}>{t('login.signUp')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardWrapper>

      <Modal visible={loginSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.iconWrapper}>
              <View style={[styles.dot, styles.dotTopLeft]} />
              <View style={[styles.dot, styles.dotTopRight]} />
              <View style={[styles.dot, styles.dotLeft]} />
              <View style={[styles.dot, styles.dotRight]} />
              <View style={[styles.dot, styles.dotBottomLeft]} />
              <View style={styles.iconCircle}>
                <Image
                  source={require('../../assets/images/cingratsUsericon.png')}
                  style={styles.iconImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            <Text style={styles.successTitle}>{t('login.loginSuccessful')}</Text>
            <Text style={styles.successSubtitle}>{t('login.redirecting')}</Text>

            <ActivityIndicator color="#333" size="small" style={{ marginTop: 10 }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, paddingVertical: 40, flexGrow: 1, justifyContent: 'center' },
  logo: { width: 180, height: 130, alignSelf: 'center', marginBottom: 40 },
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
  mpinRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  mpinBox: {
    width: 65,
    height: 56,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    color: '#000',
  },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 24 },
  forgot: { color: '#D20236', fontSize: 14, fontFamily: 'Outfit-Medium' },
  loginBtn: {
    backgroundColor: '#D20236',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  loginText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold' },
  otpBtn: {
    borderWidth: 1,
    borderColor: '#D20236',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  otpText: { color: '#000', fontSize: 16, fontFamily: 'Outfit-Medium'},
  signupRow: { flexDirection: 'row', justifyContent: 'center' },
  signupText: { color: '#333', fontSize: 16,fontFamily: 'Outfit-Medium' },
  signupLink: { color: '#D20236', fontSize: 16, fontFamily: 'Outfit-Medium' },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#D20236',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: { width: 50, height: 50 },
  dot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D9D9D9',
  },
  dotTopLeft: { top: 8, left: 20 },
  dotTopRight: { top: 8, right: 20 },
  dotLeft: { top: 68, left: 0 },
  dotRight: { top: 68, right: 0 },
  dotBottomLeft: { bottom: 10, left: 30 },
  successTitle: { fontSize: 22, fontFamily: 'Outfit-Bold', color: '#D20236', marginBottom: 10 },
  successSubtitle: { fontSize: 15, color: '#333', textAlign: 'center' },
});