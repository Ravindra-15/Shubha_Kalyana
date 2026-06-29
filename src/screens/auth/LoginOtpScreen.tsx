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

export default function LoginOtpScreen({ route, navigation }: any) {
  const initialMobile = route.params?.mobile || '';
  const [mobile, setMobile] = useState(initialMobile);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const otpRefs = useRef<Array<TextInput | null>>([]);

  // auto-send OTP if mobile already provided
  useEffect(() => {
    if (initialMobile) sendOtp(initialMobile);
  }, []);

  const sendOtp = async (num: string) => {
    if (!num.trim()) return Alert.alert('Error', 'Enter mobile number');
    try {
      setLoading(true);
      const res = await apiClient.post('/auth/mobile/login/otp/send', {
        mobile: num.trim(),
      });
      setSent(true);
      const devOtp = res.data?.data?.devOtp;
      if (devOtp) {
        Alert.alert('Test OTP', `Your OTP is: ${devOtp}`);
        // auto-fill for testing
        setOtp(String(devOtp).split(''));
      }
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.message || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (!value && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) return Alert.alert('Error', 'Enter 6-digit OTP');
    try {
      setLoading(true);
      const res = await apiClient.post('/auth/mobile/login/otp/verify', {
        mobile: mobile.trim(),
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
        <Text style={styles.titleRed}>Mobile Number</Text>

        {!initialMobile && !sent ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Enter mobile number"
              placeholderTextColor="#999"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
            />
            <TouchableOpacity style={styles.submitBtn} onPress={() => sendOtp(mobile)}>
              <Text style={styles.submitText}>Send OTP</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>We will sent you an OTP to</Text>
            <Text style={styles.phone}>+91 {mobile}</Text>

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
                  maxLength={1}
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
  title: { fontSize: 24, fontWeight: '700', color: '#333' },
  titleRed: { fontSize: 24, fontWeight: '700', color: '#D20236', marginBottom: 16 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 4 },
  phone: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 30 },
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
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});