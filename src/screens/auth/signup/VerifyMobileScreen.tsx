import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressBar from '../../../components/ProgressBar';
import apiClient from '../../../api/client';
import { useSignup } from '../../../context/SignupContext';

export default function VerifyMobileScreen({ navigation }: any) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [timer, setTimer] = useState(0);
  const otpRefs = useRef<Array<TextInput | null>>([]);

  const { data } = useSignup();
  // send OTP on mount
  useEffect(() => {
    sendOtp();
  }, []);

  // countdown for resend
  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  //   const sendOtp = async () => {
  //     try {
  //       setSending(true);
  //       const res = await apiClient.post('/onboarding/otp/send', { purpose: 'MOBILE_VERIFY' });
  //       setTimer(60);
  //       const devOtp = res.data?.data?.devOtp;
  //       if (devOtp) {
  //         Alert.alert('Test OTP', `Your OTP is: ${devOtp}`);
  //         setOtp(String(devOtp).split('').slice(0, 6));
  //       }
  //     } catch (err: any) {
  //       Alert.alert('Error', err?.response?.data?.message || 'Could not send OTP');
  //     } finally {
  //       setSending(false);
  //     }
  //   };

  const sendOtp = async () => {
    try {
      setSending(true);
      const res = await apiClient.post('/onboarding/otp/send', {
        purpose: 'MOBILE_VERIFY',
      });
      setTimer(60);
      const devOtp = res.data?.data?.devOtp;
      if (devOtp) {
        Alert.alert('Test OTP', `Your OTP is: ${devOtp}`);
        setOtp(String(devOtp).split('').slice(0, 6));
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not send OTP';
      // already verified → skip ahead to MPIN
      if (/already verified/i.test(msg)) {
        navigation.replace('SetupMpin');
        return;
      }
      Alert.alert('Error', msg);
    } finally {
      setSending(false);
    }
  };
  const handleChange = (value: string, index: number) => {
    if (value.length > 1) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (!value && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6)
      return Alert.alert('Required', 'Enter the 6-digit OTP');

    try {
      setVerifying(true);
      await apiClient.post('/onboarding/otp/verify', { code });
      setVerified(true);
      setTimeout(() => navigation.navigate('SetupMpin'), 1200);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Invalid OTP');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <ProgressBar step={8} total={9} />

        <Text style={styles.title}>
          Verify your{'\n'}
          <Text style={styles.titleRed}>Mobile Number</Text>
        </Text>

        <Text style={styles.subtitle}>We will sent you an OTP to</Text>
        {data.mobile ? (
          <Text style={styles.phone}>+91 {data.mobile}</Text>
        ) : null}

        {verified ? (
          <View style={styles.card}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.cardText}>Mobile number verified</Text>
          </View>
        ) : (
          <>
            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={el => {
                    otpRefs.current[i] = el;
                  }}
                  style={styles.otpBox}
                  value={digit}
                  onChangeText={v => handleChange(v, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                />
              ))}
            </View>

            <View style={styles.resendRow}>
              {timer > 0 ? (
                <Text style={styles.timer}>
                  0 : {timer < 10 ? `0${timer}` : timer}
                </Text>
              ) : (
                <TouchableOpacity onPress={sendOtp} disabled={sending}>
                  <Text style={styles.resend}>
                    {sending ? 'Sending...' : 'Resend OTP'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        <View style={styles.spacer} />

        {!verified && (
          <>
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={verifyOtp}
              disabled={verifying}
            >
              {verifying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.nextText}>Next →</Text>
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
  inner: { flex: 1, paddingHorizontal: 24, paddingBottom: 30 },
  back: { fontSize: 24, color: '#000', marginTop: 8 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 10,
  },
  titleRed: { color: '#D20236' },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  otpBox: {
    width: 48,
    height: 54,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    color: '#000',
  },
  resendRow: { alignItems: 'flex-end', marginTop: 12, paddingHorizontal: 8 },
  timer: { color: '#D20236', fontSize: 14, fontWeight: '600' },
  resend: { color: '#D20236', fontSize: 14, fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 40,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    marginTop: 20,
  },
  check: { fontSize: 40, color: '#2ecc71', marginBottom: 12 },
  cardText: { fontSize: 18, fontWeight: '600', color: '#000' },
  spacer: { flex: 1 },
  nextBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  phone: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 40,
  },
});
