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
import { useSignup } from '../../../context/SignupContext';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getLookingForFromGender = (selectedGender?: string) => {
  if (selectedGender === 'MALE') return 'Groom';
  if (selectedGender === 'FEMALE') return 'Bride';
  return '';
};

export default function SignupContactScreen({ navigation }: any) {
  const { data, setField } = useSignup();
  const [mobile, setMobile] = useState(data.mobile || '');
  const [email, setEmail] = useState(data.email || '');
  const [errors, setErrors] = useState<{ mobile?: string; email?: string }>({});

  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtpValue, setMobileOtpValue] = useState('');
  const [mobileVerified, setMobileVerified] = useState(false);
  const [mobileSending, setMobileSending] = useState(false);
  const [mobileVerifying, setMobileVerifying] = useState(false);
  const [mobileDevOtp, setMobileDevOtp] = useState('');
  const [mobileCooldown, setMobileCooldown] = useState(0);
  const [userId, setUserId] = useState('');

  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpValue, setEmailOtpValue] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailDevOtp, setEmailDevOtp] = useState('');
  const [emailCooldown, setEmailCooldown] = useState(0);

  const [submitting, setSubmitting] = useState(false);

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
      return;
    }
    try {
      setMobileSending(true);
      setErrors((e) => ({ ...e, mobile: '' }));
      const res = await apiClient.post('/onboarding/contact/mobile/send-otp', {
        mobile: mobile.trim(),
      });
      setMobileDevOtp(res.data?.data?.devOtp || '');
      setMobileOtpSent(true);
      setMobileCooldown(15);
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
        navigation.navigate('Qualification');
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
      return;
    }
    try {
      setEmailSending(true);
      setErrors((e) => ({ ...e, email: '' }));
      const res = await apiClient.post('/onboarding/contact/email/send-otp', {
        email: email.trim().toLowerCase(),
      });
      setEmailDevOtp(res.data?.data?.devOtp || '');
      setEmailOtpSent(true);
      setEmailCooldown(15);
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
        code: emailOtpValue,
      });
      const resData = res.data?.data || {};

      if (resData.hasExistingProgress) {
        Alert.alert('Welcome back', 'Resuming your previous progress.');
        navigation.navigate('Qualification');
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

  const handleSubmit = async () => {
    if (!mobileVerified || !emailVerified) {
      Alert.alert('Required', 'Please verify both mobile number and email');
      return;
    }

    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      profileFor: data.profileFor,
      gender: data.gender,
      dob: data.dob,
      religion: data.religion,
      caste: data.caste,
      subCaste: data.subCaste,
      isCustomCaste: data.isCustomCaste || false,
      motherTongue: data.motherTongue || 'Kannada',
      lookingFor: data.lookingFor || getLookingForFromGender(data.gender),
    };

    try {
      setSubmitting(true);
      const res = await apiClient.post('/onboarding/register', payload);
      const onboardingToken = res.data?.data?.onboardingToken;

      if (onboardingToken) {
        await AsyncStorage.setItem('onboardingToken', onboardingToken);
        setField('mobile', mobile.trim());
        setField('email', email.trim());
        navigation.navigate('Qualification');
      } else {
        Alert.alert('Error', 'No onboarding token received');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Registration failed';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardWrapper>
        <View style={styles.scroll}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
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
          <View style={styles.row}>
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
          {mobileDevOtp ? (
            <Text style={styles.devOtp}>Testing OTP: {mobileDevOtp}</Text>
          ) : null}
          {errors.mobile ? <Text style={styles.errorText}>{errors.mobile}</Text> : null}
          {mobileVerified && <Text style={styles.verifiedText}>✓ Mobile verified</Text>}

          <Text style={[styles.label, { marginTop: 20 }]}>
            Email ID <Text style={styles.star}>*</Text>
          </Text>
          <View style={styles.row}>
            <TextInput
              style={[
                styles.input,
                styles.flexInput,
                errors.email && styles.inputError,
                (!mobileVerified || emailVerified) && styles.inputDisabled,
              ]}
              placeholder="Enter your email address"
              placeholderTextColor="#999"
              value={email}
              editable={mobileVerified && !emailVerified}
              onChangeText={(t) => {
                setEmail(t);
                setEmailOtpSent(false);
                setEmailVerified(false);
                setErrors((e) => ({ ...e, email: '' }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {mobileVerified && !emailVerified && emailCooldown <= 0 && (
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
            {mobileVerified && !emailVerified && emailCooldown > 0 && (
              <View style={styles.cooldownBox}>
                <Text style={styles.cooldownText}>{emailCooldown}s</Text>
              </View>
            )}
          </View>

          {mobileVerified && !emailVerified && emailOtpSent && (
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.flexInput]}
                placeholder="Enter OTP"
                placeholderTextColor="#999"
                value={emailOtpValue}
                onChangeText={setEmailOtpValue}
                keyboardType="number-pad"
                maxLength={6}
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
          {emailDevOtp ? (
            <Text style={styles.devOtp}>Testing OTP: {emailDevOtp}</Text>
          ) : null}
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          {emailVerified && <Text style={styles.verifiedText}>✓ Email verified</Text>}

          <TouchableOpacity
            style={[styles.continueBtn, (!mobileVerified || !emailVerified) && styles.continueBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting || !mobileVerified || !emailVerified}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.continueText}>Submit →</Text>
            )}
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
  title: { fontSize: 24, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 30 },
  titleRed: { color: '#D20236' },
  label: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 10 },
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
  otpBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cooldownBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  cooldownText: { color: '#999', fontSize: 14, fontWeight: '600' },
  devOtp: {
    backgroundColor: '#fff8e1',
    borderColor: '#ffe082',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#8a6d00',
    marginBottom: 10,
  },
  errorText: { color: '#D20236', fontSize: 13, marginBottom: 10 },
  verifiedText: { color: '#2e7d32', fontSize: 14, fontWeight: '600', marginBottom: 10 },
  continueBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  continueBtnDisabled: { backgroundColor: '#f0a8b8' },
  continueText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  inputError: { borderColor: '#D20236', borderWidth: 1.5 },
});