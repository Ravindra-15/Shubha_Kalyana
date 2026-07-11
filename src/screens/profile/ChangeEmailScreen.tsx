import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  BackHandler, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Check } from 'lucide-react-native';
import { getAccountSettings, sendEmailOtp, verifyEmailOtp } from '../../api/settings';

type Step = 'ENTER' | 'OTP' | 'SUCCESS';

const extractWaitSeconds = (message?: string): number | null => {
  if (!message) return null;
  const match = message.match(/wait (\d+) seconds?/i);
  return match ? parseInt(match[1], 10) : null;
};

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function ChangeEmailScreen({ navigation }: any) {
  const [step, setStep] = useState<Step>('ENTER');
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [resendIn, setResendIn] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [devOtpMsg, setDevOtpMsg] = useState('');
  const otpRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    (async () => {
      try {
        const account = await getAccountSettings();
        setCurrentEmail(account?.email || '');
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (resendAt <= 0) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
      setResendIn(remaining);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [resendAt]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (step === 'OTP') {
          setStep('ENTER');
          return true;
        }
        if (step === 'SUCCESS') {
          navigation.goBack();
          return true;
        }
        return false;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [step, navigation])
  );

  const handleHeaderBack = () => {
    setErrorMsg('');
    if (step === 'OTP') {
      setStep('ENTER');
    } else {
      navigation.goBack();
    }
  };

  const sendOtp = async () => {
    setErrorMsg('');
    const email = newEmail.trim().toLowerCase();
    if (!isValidEmail(email)) {
      setErrorMsg('Enter a valid email address');
      return;
    }
    try {
      setLoading(true);
      const result = await sendEmailOtp(email);
      console.log('SEND EMAIL OTP RESULT:', JSON.stringify(result));
      setStep('OTP');
      setResendAt(Date.now() + 60 * 1000);
      const devOtp = result?.devOtp;
      if (devOtp) {
        setOtp(String(devOtp).split(''));
        setDevOtpMsg(`Test OTP: ${devOtp} (auto-filled below)`);
      } else {
        setOtp(['', '', '', '', '', '']);
        setDevOtpMsg('');
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Could not send verification code';
      setErrorMsg(message);
      const waitSeconds = extractWaitSeconds(message);
      if (waitSeconds) {
        setResendAt(Date.now() + waitSeconds * 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendIn > 0) return;
    setErrorMsg('');
    const email = newEmail.trim().toLowerCase();
    try {
      const result = await sendEmailOtp(email);
      setResendAt(Date.now() + 60 * 1000);
      const devOtp = result?.devOtp;
      if (devOtp) {
        setOtp(String(devOtp).split(''));
        setDevOtpMsg(`Test OTP: ${devOtp} (auto-filled below)`);
      } else {
        setOtp(['', '', '', '', '', '']);
        setDevOtpMsg('');
        otpRefs.current[0]?.focus();
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Could not resend code';
      setErrorMsg(message);
      const waitSeconds = extractWaitSeconds(message);
      if (waitSeconds) {
        setResendAt(Date.now() + waitSeconds * 1000);
      }
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
    setErrorMsg('');
    const code = otp.join('');
    if (code.length !== 6) {
      setErrorMsg('Enter the 6-digit code');
      return;
    }
    try {
      setLoading(true);
      await verifyEmailOtp(code);
      setStep('SUCCESS');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Could not verify code');
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
        <Text style={styles.headerTitle}>Change Email Address</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          <View style={styles.content}>
            {step === 'ENTER' && (
              <>
                <Text style={styles.label}>Current Email Address</Text>
                <View style={styles.readonlyBox}>
                  <Text style={styles.readonlyText}>{currentEmail || '—'}</Text>
                </View>

                <Text style={styles.label}>New Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new email address"
                  placeholderTextColor="#999"
                  value={newEmail}
                  onChangeText={setNewEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                {!!errorMsg && (
                  <Text style={styles.errorText}>
                    {resendIn > 0 ? `Please wait ${resendIn}s before trying again` : errorMsg}
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.primaryBtn, (!newEmail || loading || resendIn > 0) && styles.primaryBtnDisabled]}
                  onPress={sendOtp}
                  disabled={!newEmail || loading || resendIn > 0}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Send Verification Code</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {step === 'OTP' && (
              <>
                <Text style={styles.label}>Current Email Address</Text>
                <View style={styles.readonlyBox}>
                  <Text style={styles.readonlyText}>{currentEmail || '—'}</Text>
                </View>

                <Text style={styles.label}>New Email Address</Text>
                <View style={styles.readonlyBox}>
                  <Text style={styles.readonlyText}>{newEmail}</Text>
                </View>

                <Text style={styles.label}>Enter Verification Code</Text>
                <Text style={styles.hint}>We've sent a 6-digit code to your new email</Text>
                {!!devOtpMsg && <Text style={styles.devOtpText}>{devOtpMsg}</Text>}

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
                      {resendIn > 0 ? `Resend Code (${resendIn}s)` : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setStep('ENTER')}>
                    <Text style={styles.changeNumberText}>Change Email</Text>
                  </TouchableOpacity>
                </View>

                {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                  onPress={verifyAndUpdate}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Update Email</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {step === 'SUCCESS' && (
              <View style={styles.successWrap}>
                <View style={styles.successIcon}>
                  <Check color="#1a7f37" size={32} />
                </View>
                <Text style={styles.successTitle}>Email Address Updated Successfully</Text>
                <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 16 },
  hint: { fontSize: 12, color: '#888', marginBottom: 6 },
  devOtpText: { fontSize: 12, color: '#1a7f37', fontWeight: '600', marginBottom: 14 },
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
  errorText: { fontSize: 13, color: '#D20236', marginTop: 12, fontWeight: '500' },
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