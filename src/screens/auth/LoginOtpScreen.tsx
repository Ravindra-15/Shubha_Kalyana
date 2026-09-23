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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleLoginOtpError } from '../../utils/loginOtpErrors';

export default function LoginOtpScreen({ route, navigation }: any) {
  const initialMobile = route.params?.mobile || '';
  const [mobile, setMobile] = useState(initialMobile);
  const isEmail = mobile.includes('@');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  // The Login screen now sends the OTP itself before coming here.
  const otpAlreadySent = Boolean(route.params?.otpSent);
  // Temporary: shown only while the SMS bypass is switched on server-side.
  const [bypassOtp, setBypassOtp] = useState<string>(route.params?.bypassOtp || '');
  const [sent, setSent] = useState(otpAlreadySent);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const otpRefs = useRef<Array<TextInput | null>>([]);

  // auto-send OTP if mobile already provided
  useEffect(() => {
    if (initialMobile && !otpAlreadySent) sendOtp(initialMobile);
  }, []);

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

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={verifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Submit</Text>
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
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center', paddingTop: 60 },
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
  submitText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold' },
});