import { useAuth } from '../../context/AuthContext';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleLoginOtpError } from '../../utils/loginOtpErrors';

const RESEND_SECONDS = 60;

export default function LoginOtpScreen({ route, navigation }: any) {
  const initialMobile = route.params?.mobile || '';
  const [mobile, setMobile] = useState(initialMobile);
  const isEmail = mobile.includes('@');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  // The Login screen now sends the OTP itself before coming here.
  const otpAlreadySent = Boolean(route.params?.otpSent);
  // Temporary: shown only while the SMS bypass is switched on server-side.
  const [bypassOtp, setBypassOtp] = useState<string>(route.params?.bypassOtp || '');
  // The server refuses another OTP within 60 seconds, so the button waits too.
  // The code itself stays valid for 10 minutes, which this does not affect.
  const [resendIn, setResendIn] = useState(otpAlreadySent ? RESEND_SECONDS : 0);
  const [sent, setSent] = useState(otpAlreadySent);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const otpRefs = useRef<Array<TextInput | null>>([]);

  // auto-send OTP if mobile already provided
  useEffect(() => {
    if (initialMobile && !otpAlreadySent) sendOtp(initialMobile);
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return undefined;

    const timer = setInterval(() => {
      setResendIn((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendIn > 0]);

  const sendOtp = async (num: string) => {
    const trimmed = num.trim();
    if (!trimmed) return Alert.alert('Error', 'Enter mobile number');
    const normalized = trimmed.includes('@') ? trimmed.toLowerCase() : trimmed;
    try {
      setLoading(true);
      const res = await apiClient.post('/auth/mobile/login/otp/send', {
        mobile: normalized,
      });
      setBypassOtp(res.data?.data?.bypassOtp || '');
      setSent(true);
      setResendIn(RESEND_SECONDS);
      setOtp(['', '', '', '', '', '']);
    } catch (err: any) {
      if (handleLoginOtpError(err)) {
        setSent(true);
      } else if (initialMobile) {
        // Nothing was sent, so there is nothing to type in -- go back to login.
        navigation.goBack();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const digits = value.replace(/\D/g, '');

    // Autofill/paste delivers the whole code to whichever box is focused --
    // spread it across the remaining boxes instead of dropping it.
    if (digits.length > 1) {
      const next = [...otp];
      for (let i = 0; i < digits.length && index + i < next.length; i++) {
        next[index + i] = digits[i];
      }
      setOtp(next);
      const lastFilledIndex = Math.min(index + digits.length, next.length) - 1;
      otpRefs.current[lastFilledIndex]?.focus();
      return;
    }

    const next = [...otp];
    next[index] = digits;
    setOtp(next);
    if (digits && index < 5) otpRefs.current[index + 1]?.focus();
    if (!digits && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleBack = () => {
    setOtp(['', '', '', '', '', '']);

    // Number typed on this screen: step back to that input instead of leaving.
    if (sent && !initialMobile) {
      setSent(false);
      setResendIn(0);
      setBypassOtp('');
      return;
    }

    navigation.goBack();
  };

  // Android hardware back should do exactly the same thing.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });

    return () => subscription.remove();
  });

  // Submit stays inactive until all six digits are in.
  const canSubmit = otp.join('').length === 6 && !loading;

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) return Alert.alert('Error', 'Enter 6-digit OTP');
    try {
      setLoading(true);
      const trimmedMobile = mobile.trim();
      const res = await apiClient.post('/auth/mobile/login/otp/verify', {
        mobile: trimmedMobile.includes('@') ? trimmedMobile.toLowerCase() : trimmedMobile,
        code,
      });
      const token = res.data?.data?.accessToken;
      const userData = res.data?.data?.user;
      if (token) {
        await login(token, userData);
        // navigation auto-switches to Home
      } else {
        Alert.alert('Error', 'No token received');
      }
    } catch (err: any) {
      Alert.alert('Verify failed', err?.response?.data?.message || 'Try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={handleBack} hitSlop={12}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Image
          source={require('../../assets/images/logo-red.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Verify your</Text>
        <Text style={styles.titleRed}>{isEmail ? 'Email Address' : 'Mobile Number'}</Text>

        {!initialMobile && !sent ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Enter mobile number or email"
              placeholderTextColor="#999"
              value={mobile}
              onChangeText={(text) => setMobile(text.includes('@') ? text.toLowerCase() : text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.submitBtn} onPress={() => sendOtp(mobile)}>
              <Text style={styles.submitText}>Send OTP</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>We will sent you an OTP to</Text>
            <Text style={styles.phone}>{isEmail ? mobile : `+91 ${mobile}`}</Text>

            {bypassOtp ? (
              <View style={styles.bypassBox}>
                <Text style={styles.bypassNote}>
                  SMS service is temporarily unavailable. Please use this code:
                </Text>
                <Text style={styles.bypassCode}>{bypassOtp}</Text>
              </View>
            ) : null}

            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  style={styles.otpBox}
                  value={digit}
                  onChangeText={(v) => handleOtpChange(v, i)}
                  keyboardType="number-pad"
                  maxLength={6}
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                />
              ))}
            </View>

            <View style={styles.resendRow}>
              <TouchableOpacity
                onPress={() => sendOtp(mobile)}
                disabled={resendIn > 0 || loading}
              >
                <Text style={[styles.resendText, resendIn > 0 && styles.resendTextWaiting]}>
                  {resendIn > 0 ? `Resend OTP (${resendIn}s)` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
              onPress={verifyOtp}
              disabled={!canSubmit}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
                  Submit
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backBtn: { paddingHorizontal: 24, paddingTop: 12 },
  backArrow: { fontSize: 24, color: '#000' },
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center', paddingTop: 30 },
  logo: { width: 140, height: 100, marginBottom: 30 },
  title: { fontSize: 24, fontFamily: 'Outfit-Bold', color: '#333' },
  titleRed: { fontSize: 24, fontFamily: 'Outfit-Bold', color: '#D20236', marginBottom: 16 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 4 },
  phone: { fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#000', marginBottom: 30 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 20,
    marginTop: 20,
    color: '#000',
  },
  bypassBox: {
    borderWidth: 1,
    borderColor: '#f0c36d',
    backgroundColor: '#fff8e6',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  bypassNote: { fontSize: 12, color: '#8a6d1f', textAlign: 'center' },
  bypassCode: {
    fontSize: 22,
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 4,
    color: '#D20236',
    fontFamily: 'Outfit-Bold',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
  },
  otpBox: {
    width: 48,
    height: 54,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    color: '#000',
  },
  submitBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    width: '100%',
  },
  submitBtnDisabled: { backgroundColor: '#f0b9c4' },
  submitTextDisabled: { color: '#fff' },
  resendRow: { width: '100%', alignItems: 'flex-end', marginBottom: 16 },
  resendText: { fontSize: 14, color: '#D20236', fontFamily: 'Outfit-SemiBold' },
  resendTextWaiting: { color: '#999' },
  submitText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold' },
});