import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KeyboardWrapper from '../../../components/KeyboardWrapper';
import ProgressBar from '../../../components/ProgressBar';
import { useSignup } from '../../../context/SignupContext';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useScrollToError } from '../../../hooks/useScrollToError';

export default function SignupContactScreen({ navigation }: any) {
  const { data, setField } = useSignup();
  const [mobile, setMobile] = useState(data.mobile || '');
  const [email, setEmail] = useState(data.email || '');
  const [errors, setErrors] = useState<{ mobile?: string; email?: string }>({});
  const { scrollRef, registerField, scrollToError } = useScrollToError();

  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtpValue, setMobileOtpValue] = useState('');
  const [mobileVerified, setMobileVerified] = useState(false);
  const [mobileSending, setMobileSending] = useState(false);
  const [mobileVerifying, setMobileVerifying] = useState(false);
  const [mobileCooldown, setMobileCooldown] = useState(0);
  const [userId, setUserId] = useState('');

  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpValue, setEmailOtpValue] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSkipped, setEmailSkipped] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);

  useEffect(() => {
    if (mobileCooldown <= 0) return;
    const timer = setInterval(() => {
      setMobileCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [mobileCooldown > 0]);

  useEffect(() => {
    if (emailCooldown <= 0) return;
    const timer = setInterval(() => {
      setEmailCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [emailCooldown > 0]);

  const sendMobileOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      setErrors((e) => ({ ...e, mobile: 'Enter a valid 10 digit mobile number' }));
      scrollToError(['mobile'], ['mobile', 'email']);
      return;
    }
    try {
      setMobileSending(true);
      setErrors((e) => ({ ...e, mobile: '' }));
      const res = await apiClient.post('/onboarding/contact/mobile/send-otp', {
        mobile: mobile.trim(),
      });
      setMobileOtpSent(true);
      setMobileCooldown(60);
    } catch (err: any) {
      setErrors((e) => ({ ...e, mobile: err?.response?.data?.message || 'Unable to send OTP' }));
    } finally {
      setMobileSending(false);
    }
  };

  const verifyMobileOtp = async () => {
    try {
      setMobileVerifying(true);
      const res = await apiClient.post('/onboarding/contact/mobile/verify-otp', {
        mobile: mobile.trim(),
        // Server validation expects `otp`, the controller reads `code` —
        // send both so it passes validation and reaches the right value.
        otp: mobileOtpValue,
        code: mobileOtpValue,
      });
      const resData = res.data?.data || {};
      if (resData.onboardingToken) {
        await AsyncStorage.setItem('onboardingToken', resData.onboardingToken);
      }
      if (resData.userId) {
        setUserId(resData.userId);
        await AsyncStorage.setItem('onboardingUserId', resData.userId);
      }

      if (resData.hasExistingProgress) {
        Alert.alert('Welcome back', 'Resuming your previous progress.');
        // Navigate to wherever your app's resume logic points, e.g.:
        navigation.navigate('BasicLifestyle');
        return;
      }

      setMobileVerified(true);
      setErrors((e) => ({ ...e, mobile: '' }));
    } catch (err: any) {
      setErrors((e) => ({ ...e, mobile: err?.response?.data?.message || 'Invalid OTP' }));
    } finally {
      setMobileVerifying(false);
    }
  };

  const sendEmailOtp = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrors((e) => ({ ...e, email: 'Enter a valid email' }));
      scrollToError(['email'], ['mobile', 'email']);
      return;
    }
    try {
      setEmailSending(true);
      setErrors((e) => ({ ...e, email: '' }));
      const res = await apiClient.post('/onboarding/contact/email/send-otp', {
        email: email.trim().toLowerCase(),
      });
      setEmailOtpSent(true);
      setEmailCooldown(60);
    } catch (err: any) {
      setErrors((e) => ({ ...e, email: err?.response?.data?.message || 'Unable to send OTP' }));
    } finally {
      setEmailSending(false);
    }
  };

  const verifyEmailOtp = async () => {
    try {
      setEmailVerifying(true);
      const res = await apiClient.post('/onboarding/contact/email/verify-otp', {
        email: email.trim().toLowerCase(),
        // Server validation expects `otp`, the controller reads `code` —
        // send both so it passes validation and reaches the right value.
        otp: emailOtpValue,
        code: emailOtpValue,
      });
      const resData = res.data?.data || {};

      if (resData.hasExistingProgress) {
        Alert.alert('Welcome back', 'Resuming your previous progress.');
        navigation.navigate('BasicLifestyle');
        return;
      }

      setEmailVerified(true);
      setErrors((e) => ({ ...e, email: '' }));
    } catch (err: any) {
      setErrors((e) => ({ ...e, email: err?.response?.data?.message || 'Invalid OTP' }));
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleContinue = () => {
    if (!mobileVerified || (!emailVerified && !emailSkipped)) {
      scrollToError(!mobileVerified ? ['mobile'] : ['email'], ['mobile', 'email']);
      Alert.alert('Required', 'Please verify your mobile number, and either verify or skip email');
      return;
    }

    setField('mobile', mobile.trim());
    setField('email', emailSkipped ? '' : email.trim());
    navigation.navigate('SignupCaste');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardWrapper ref={scrollRef}>
        <View style={styles.scroll}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>

          <ProgressBar step={3} total={16} />

        <View style={styles.iconCircle}>
          <Image
            source={require('../../../assets/images/user-icon.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>

          <Text style={styles.title}>
            <Text style={styles.titleRed}>Contact</Text> Details
          </Text>

          <Text style={styles.label}>Mobile number <Text style={styles.star}>*</Text></Text>
          <View style={styles.row} ref={registerField('mobile')}>
            <TextInput
              style={[styles.input, styles.flexInput, errors.mobile && styles.inputError]}
              placeholder="Enter your mobile number"
              placeholderTextColor="#999"
              value={mobile}
              editable={!mobileVerified}
              onChangeText={(t) => {
                setMobile(t);
                setMobileOtpSent(false);
                setMobileVerified(false);
                setErrors((e) => ({ ...e, mobile: '' }));
              }}
              keyboardType="phone-pad"
              maxLength={10}
            />
            {!mobileVerified && mobileCooldown <= 0 && (
              <TouchableOpacity
                style={styles.otpBtn}
                onPress={sendMobileOtp}
                disabled={mobileSending}
              >
                {mobileSending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.otpBtnText}>
                    {mobileOtpSent ? 'Resend' : 'Get OTP'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
            {!mobileVerified && mobileCooldown > 0 && (
              <View style={styles.cooldownBox}>
                <Text style={styles.cooldownText}>{mobileCooldown}s</Text>
              </View>
            )}
          </View>

          {!mobileVerified && mobileOtpSent && (
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.flexInput]}
                placeholder="Enter OTP"
                placeholderTextColor="#999"
                value={mobileOtpValue}
                onChangeText={setMobileOtpValue}
                keyboardType="number-pad"
                maxLength={6}
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
              />
              <TouchableOpacity
                style={styles.otpBtn}
                onPress={verifyMobileOtp}
                disabled={mobileVerifying || mobileOtpValue.length !== 6}
              >
                {mobileVerifying ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.otpBtnText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          {errors.mobile ? <Text style={styles.errorText}>{errors.mobile}</Text> : null}
          {mobileVerified && <Text style={styles.verifiedText}>✓ Mobile verified</Text>}

          <View style={[styles.row, { marginTop: 20, justifyContent: 'space-between' }]}>
            <Text style={styles.label}>Email ID (optional)</Text>
            {mobileVerified && !emailVerified && (
              <TouchableOpacity
                onPress={() => {
                  if (emailSkipped) {
                    setEmailSkipped(false);
                  } else {
                    setEmailSkipped(true);
                    setEmail('');
                    setEmailOtpSent(false);
                    setEmailOtpValue('');
                    setEmailCooldown(0);
                    setErrors((e) => ({ ...e, email: '' }));
                  }
                }}
              >
                <Text style={styles.skipLink}>
                  {emailSkipped ? 'Add email instead' : 'Skip for now'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.row} ref={registerField('email')}>
            <TextInput
              style={[
                styles.input,
                styles.flexInput,
                errors.email && styles.inputError,
                (!mobileVerified || emailVerified || emailSkipped) && styles.inputDisabled,
              ]}
              placeholder={emailSkipped ? 'Skipped — you can add this later' : 'Enter your email address'}
              placeholderTextColor="#999"
              value={email}
              editable={mobileVerified && !emailVerified && !emailSkipped}
              onChangeText={(t) => {
                setEmail(t);
                setEmailOtpSent(false);
                setEmailVerified(false);
                setErrors((e) => ({ ...e, email: '' }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {mobileVerified && !emailVerified && !emailSkipped && emailCooldown <= 0 && (
              <TouchableOpacity
                style={styles.otpBtn}
                onPress={sendEmailOtp}
                disabled={emailSending}
              >
                {emailSending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.otpBtnText}>
                    {emailOtpSent ? 'Resend' : 'Get OTP'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
            {mobileVerified && !emailVerified && !emailSkipped && emailCooldown > 0 && (
              <View style={styles.cooldownBox}>
                <Text style={styles.cooldownText}>{emailCooldown}s</Text>
              </View>
            )}
          </View>

          {mobileVerified && !emailVerified && !emailSkipped && emailOtpSent && (
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.flexInput]}
                placeholder="Enter OTP"
                placeholderTextColor="#999"
                value={emailOtpValue}
                onChangeText={setEmailOtpValue}
                keyboardType="number-pad"
                maxLength={6}
                textContentType="oneTimeCode"
              />
              <TouchableOpacity
                style={styles.otpBtn}
                onPress={verifyEmailOtp}
                disabled={emailVerifying || emailOtpValue.length !== 6}
              >
                {emailVerifying ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.otpBtnText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          {emailVerified && <Text style={styles.verifiedText}>✓ Email verified</Text>}
          {emailSkipped && (
            <Text style={styles.skippedText}>
              Email skipped — you can add it later from your profile settings.
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.continueBtn,
              (!mobileVerified || (!emailVerified && !emailSkipped)) && styles.continueBtnDisabled,
            ]}
            onPress={handleContinue}
            disabled={!mobileVerified || (!emailVerified && !emailSkipped)}
          >
            <Text style={styles.continueText}>Continue →</Text>
          </TouchableOpacity>
        </View>
      </KeyboardWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { paddingHorizontal: 24, paddingBottom: 30 },
  back: { fontSize: 24, color: '#000', marginTop: 8, marginBottom: 10 },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fbfbfb',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: { width: 34, height: 34 },
  title: { fontSize: 24, fontFamily: 'Outfit-Regular', color: '#000', textAlign: 'center', marginBottom: 30 },
  titleRed: { color: '#D20236', fontFamily: 'Outfit-Bold' },
  label: { fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#000', marginBottom: 10 },
  star: { color: '#D20236' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 10,
    color: '#000',
  },
  flexInput: { flex: 1 },
  inputDisabled: { backgroundColor: '#f5f5f5', color: '#999' },
  otpBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  otpBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Outfit-Bold' },
  cooldownBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  cooldownText: { color: '#999', fontSize: 14, fontFamily: 'Outfit-SemiBold' },
  errorText: { color: '#D20236', fontSize: 13, marginBottom: 10 },
  verifiedText: { color: '#2e7d32', fontSize: 14, fontFamily: 'Outfit-SemiBold', marginBottom: 10 },
  skippedText: { color: '#888', fontSize: 13, marginBottom: 10 },
  skipLink: { color: '#D20236', fontSize: 13, fontFamily: 'Outfit-SemiBold', textDecorationLine: 'underline' },
  continueBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  continueBtnDisabled: { backgroundColor: '#f0a8b8' },
  continueText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold' },
  inputError: { borderColor: '#D20236', borderWidth: 1.5 },
});