import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  Alert, BackHandler, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Check } from 'lucide-react-native';
import { getAccountSettings, sendChangeMobileOtp, verifyChangeMobileOtp } from '../../api/settings';

type Step = 'ENTER' | 'OTP' | 'SUCCESS';

export default function ChangeMobileNumberScreen({ navigation }: any) {
  const [step, setStep] = useState<Step>('ENTER');
  const [currentMobile, setCurrentMobile] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const otpRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    (async () => {
      try {
        const account = await getAccountSettings();
        setCurrentMobile(account?.mobile || '');
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Hardware back button: step back instead of leaving the screen, except on ENTER
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (step === 'OTP') {
          setStep('ENTER');
          return true; // handled, don't exit screen
        }
        if (step === 'SUCCESS') {
          navigation.goBack();
          return true;
        }
        return false; // let default back (goBack) happen on ENTER
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [step, navigation])
  );

  const handleHeaderBack = () => {
    if (step === 'OTP') {
      setStep('ENTER');
    } else {
      navigation.goBack();
    }
  };

  const sendOtp = async () => {
    if (!/^\d{10}$/.test(newMobile)) {
      Alert.alert('Invalid Number', 'Enter a valid 10-digit mobile number');
      return;
    }
    try {
      setLoading(true);
      await sendChangeMobileOtp(newMobile);
      setStep('OTP');
      setResendIn(60);
      setOtp(['', '', '', '', '', '']);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendIn > 0) return;
    try {
      await sendChangeMobileOtp(newMobile);
      setResendIn(60);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not resend OTP');
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

  const verifyAndUpdate = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      Alert.alert('Invalid OTP', 'Enter the 6-digit code');
      return;
    }
    try {
      setLoading(true);
      const result = await verifyChangeMobileOtp(code);
      if (result?.accessToken) {
        await AsyncStorage.setItem('token', result.accessToken);
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          parsed.mobile = result.mobile;
          await AsyncStorage.setItem('user', JSON.stringify(parsed));
        }
      }
      setStep('SUCCESS');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleHeaderBack}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Mobile Number</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {step === 'ENTER' && (
            <>
              <Text style={styles.label}>Current Mobile Number</Text>
              <View style={styles.readonlyBox}>
                <Text style={styles.readonlyText}>
                  {currentMobile ? `+91 ${currentMobile}` : '—'}
                </Text>
              </View>

              <Text style={styles.label}>New Mobile Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter new mobile number"
                placeholderTextColor="#999"
                value={newMobile}
                onChangeText={(t) => setNewMobile(t.replace(/\D/g, '').slice(0, 10))}
                keyboardType="number-pad"
                maxLength={10}
              />

              <TouchableOpacity
                style={[styles.primaryBtn, (!newMobile || loading) && styles.primaryBtnDisabled]}
                onPress={sendOtp}
                disabled={!newMobile || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {step === 'OTP' && (
            <>
              <Text style={styles.label}>Current Mobile Number</Text>
              <View style={styles.readonlyBox}>
                <Text style={styles.readonlyText}>
                  {currentMobile ? `+91 ${currentMobile}` : '—'}
                </Text>
              </View>

              <Text style={styles.label}>New Mobile Number</Text>
              <View style={styles.readonlyBox}>
                <Text style={styles.readonlyText}>+91 {newMobile}</Text>
              </View>

              <Text style={styles.label}>Enter Verification Code</Text>
              <Text style={styles.hint}>We've sent a 6-digit code to your new number</Text>

              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    style={styles.otpBox}
                    value={digit}
                    onChangeText={(v) => handleOtpChange(v, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                  />
                ))}
              </View>

              <View style={styles.otpActionsRow}>
                <TouchableOpacity onPress={resendOtp} disabled={resendIn > 0}>
                  <Text style={[styles.resendText, resendIn > 0 && styles.resendTextDisabled]}>
                    {resendIn > 0 ? `Resend OTP (${resendIn}s)` : 'Resend OTP'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep('ENTER')}>
                  <Text style={styles.changeNumberText}>Change Number</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={verifyAndUpdate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Verify & Update Number</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {step === 'SUCCESS' && (
            <View style={styles.successWrap}>
              <View style={styles.successIcon}>
                <Check color="#1a7f37" size={32} />
              </View>
              <Text style={styles.successTitle}>Mobile Number Updated Successfully</Text>
              <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 16 },
  hint: { fontSize: 12, color: '#888', marginBottom: 14 },
  readonlyBox: {
    backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13,
  },
  readonlyText: { fontSize: 14, color: '#666' },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: '#000',
  },
  primaryBtn: {
    backgroundColor: '#D20236', borderRadius: 10, paddingVertical: 15,
    alignItems: 'center', marginTop: 28,
  },
  primaryBtnDisabled: { backgroundColor: '#e9a9b6' },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  otpBox: {
    width: 44, height: 50, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8,
    textAlign: 'center', fontSize: 18, color: '#000',
  },
  otpActionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  resendText: { fontSize: 13, fontWeight: '600', color: '#D20236' },
  resendTextDisabled: { color: '#bbb' },
  changeNumberText: { fontSize: 13, fontWeight: '600', color: '#666' },
  successWrap: { alignItems: 'center', marginTop: 60 },
  successIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#eafaf0',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  successTitle: { fontSize: 17, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 28 },
  doneBtn: {
    backgroundColor: '#D20236', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 50,
  },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});