import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendChangeMpinOtp, verifyForgotMpinOtp } from '../../api/settings';

const RESEND_SECONDS = 60;

export default function ForgotMpinVerifyScreen({ navigation, route }: any) {
  const identifier: string = route?.params?.identifier || '';
  const isEmail = identifier.includes('@');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const otpRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  const resendOtp = async () => {
    try {
      setSending(true);
      await sendChangeMpinOtp(identifier);
      setTimer(RESEND_SECONDS);
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || 'Could not resend OTP');
    } finally {
      setSending(false);
    }
  };

  const handleChange = (value: string, index: number) => {
    if (value.length > 1) return;
    setOtpError('');
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (!value && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleNext = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setOtpError('Enter the 6-digit OTP first');
      return;
    }

    try {
      setVerifying(true);
      await verifyForgotMpinOtp(identifier, code);
      setOtpError('');
      setVerified(true);
      setTimeout(() => {
        navigation.navigate('ForgotMpinReset', { identifier, code });
      }, 1200);
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || 'Invalid OTP');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>
          Verify your{'\n'}
          <Text style={styles.titleRed}>{isEmail ? 'Email' : 'Mobile Number'}</Text>
        </Text>

        <Text style={styles.subtitle}>We will sent you an OTP to</Text>
        {identifier ? <Text style={styles.phone}>{identifier}</Text> : null}

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => {
                otpRefs.current[i] = el;
              }}
              style={[styles.otpBox, otpError && styles.otpBoxError]}
              value={digit}
              onChangeText={(v) => handleChange(v, i)}
              keyboardType="number-pad"
              maxLength={1}
              editable={!verified}
            />
          ))}
        </View>

        {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

        <View style={styles.resendRow}>
          {timer > 0 ? (
            <Text style={styles.timer}>0 : {timer < 10 ? `0${timer}` : timer}</Text>
          ) : (
            <TouchableOpacity onPress={resendOtp} disabled={sending || verified}>
              <Text style={styles.resend}>{sending ? 'Sending...' : 'Resend OTP'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} disabled={verifying || verified}>
          {verifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextText}>Next →</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={verified} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.card}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.cardText}>
              {isEmail ? 'Email verified' : 'Mobile number verified'}
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, paddingHorizontal: 24, paddingBottom: 30, paddingTop: 20 },
  title: {
    fontSize: 26,
    fontFamily: 'Outfit-Regular',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 10,
  },
  titleRed: { color: '#D20236', fontFamily: 'Outfit-Bold' },
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
  otpBoxError: { borderColor: '#D20236', borderWidth: 1.5 },
  errorText: {
    color: '#D20236',
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
    textAlign: 'center',
    marginTop: 10,
  },
  resendRow: { alignItems: 'flex-end', marginTop: 12, paddingHorizontal: 8 },
  timer: { color: '#D20236', fontSize: 14, fontFamily: 'Outfit-SemiBold' },
  resend: { color: '#D20236', fontSize: 14, fontFamily: 'Outfit-SemiBold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
  },
  check: { fontSize: 40, color: '#2ecc71', marginBottom: 12 },
  cardText: { fontSize: 18, fontFamily: 'Outfit-SemiBold', color: '#000' },
  spacer: { flex: 1 },
  nextBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold' },
  phone: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 24,
  },
});
