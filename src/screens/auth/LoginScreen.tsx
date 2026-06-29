import React, { useState, useRef } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }: any) {
  const [mobile, setMobile] = useState('');
  const [mpin, setMpin] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const mpinRefs = useRef<Array<TextInput | null>>([]);

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
    if (!mobile.trim()) return Alert.alert('Error', 'Enter mobile number');
    if (pin.length !== 4) return Alert.alert('Error', 'Enter 4-digit MPIN');

    try {
      setLoading(true);
      const res = await apiClient.post('/auth/mobile/login/mpin', {
        mobile: mobile.trim(),
        mpin: pin,
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
      Alert.alert('Login failed', err?.response?.data?.message || 'Try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          <Image
            source={require('../../assets/images/logo-red.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.label}>Mobile / Email login</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter mobile number or email id"
            placeholderTextColor="#999"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Enter your MPIN</Text>
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
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.forgotWrap}
            onPress={() => navigation.navigate('ForgotMpin')}
          >
            <Text style={styles.forgot}>Forgot MPIN?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>Log In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.otpBtn}
            onPress={() => navigation.navigate('LoginOtp', { mobile })}
          >
            <Text style={styles.otpText}>Log In with OTP</Text>
          </TouchableOpacity>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have a Account ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignupProfileFor')}>
              <Text style={styles.signupLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  logo: { width: 180, height: 130, alignSelf: 'center', marginBottom: 40 },
  label: { fontSize: 14, color: '#333', marginBottom: 8, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 24,
    color: '#000',
  },
  mpinRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  mpinBox: {
    width: 60,
    height: 56,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    color: '#000',
  },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 24 },
  forgot: { color: '#D20236', fontSize: 13, fontWeight: '500' },
  loginBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 14,
  },
  loginText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  otpBtn: {
    borderWidth: 1,
    borderColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  otpText: { color: '#D20236', fontSize: 16, fontWeight: '600' },
  signupRow: { flexDirection: 'row', justifyContent: 'center' },
  signupText: { color: '#333', fontSize: 14 },
  signupLink: { color: '#D20236', fontSize: 14, fontWeight: '700' },
});