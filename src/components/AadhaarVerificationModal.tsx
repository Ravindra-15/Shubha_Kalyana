import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertCircle, Camera, CheckCircle, Fingerprint, Smartphone, X } from 'lucide-react-native';
import {
  requestAadhaarOtp,
  confirmAadhaarOtp,
  getAadhaarVerificationStatus,
} from '../api/aadhaarVerification';

type Props = {
  visible: boolean;
  photoVerified?: boolean;
  onClose: () => void;
  onVerified?: () => void | Promise<void>;
  onVerifyPhoto?: () => void;
};

type Step = 'checking' | 'aadhaar' | 'otp' | 'success';

const digitsOnly = (value = '') => String(value).replace(/\D/g, '');

const formatAadhaar = (value = '') =>
  digitsOnly(value)
    .slice(0, 12)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

// A failed axios request with no `response` means the request never reached
// the server (offline, DNS, timeout) — that's a network error, not the
// provider rejecting anything, so it should never be shown as "verification
// failed" and should never move the user off the step they were on.
const isNetworkError = (error: any) => !error?.response;

const getErrorMessage = (error: any, fallback: string) => {
  if (isNetworkError(error)) {
    return 'Network error. Please check your connection and try again.';
  }
  return error?.response?.data?.message || error?.message || fallback;
};

export default function AadhaarVerificationModal({
  visible,
  photoVerified = false,
  onClose,
  onVerified,
  onVerifyPhoto,
}: Props) {
  const [step, setStep] = useState<Step>('checking');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) {
      setStep('checking');
      setAadhaarNumber('');
      setOtp('');
      setError('');
      setLoading(false);
      return;
    }

    // Resume in place: if a previous attempt already sent an OTP and the
    // user closed the modal before entering it, that attempt is still
    // "pending" on the server — pick up right at the OTP step instead of
    // making them start over. If it's already verified, just show success.
    (async () => {
      try {
        const status = await getAadhaarVerificationStatus();
        if (status?.status === 'VERIFIED') {
          setStep('success');
        } else if (status?.status === 'OTP_SENT') {
          setStep('otp');
        } else {
          setStep('aadhaar');
        }
      } catch {
        // Status check failing shouldn't block verification — just start fresh.
        setStep('aadhaar');
      }
    })();
  }, [visible]);

  const close = () => {
    if (!loading) onClose();
  };

  const sendOtp = async () => {
    const normalized = digitsOnly(aadhaarNumber);
    if (normalized.length !== 12) {
      setError('Enter a valid 12-digit Aadhaar number.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await requestAadhaarOtp(normalized);
      setStep('otp');
    } catch (err: any) {
      // A network error here means nothing was sent — the user is still on
      // the Aadhaar-number step and can just retry, nothing is "pending" yet.
      setError(getErrorMessage(err, 'Could not send Aadhaar OTP.'));
    } finally {
      setLoading(false);
    }
  };

  const changeAadhaarNumber = () => {
    setStep('aadhaar');
    setOtp('');
    setError('');
  };

  const verifyOtp = async () => {
    const normalizedOtp = digitsOnly(otp);
    if (normalizedOtp.length < 4) {
      setError('Enter the OTP sent to the Aadhaar-linked mobile number.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await confirmAadhaarOtp(normalizedOtp);
      try {
        await onVerified?.();
      } catch {
        // Verification succeeded; a refresh failure should not show as a failure.
      }
      setStep('success');
    } catch (err: any) {
      // Network errors leave the verification "pending" on the server (no
      // attempt was consumed) — stay on this step so the user can just retry
      // instead of losing their place or being told it "failed".
      setError(getErrorMessage(err, 'Aadhaar OTP verification failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>Aadhaar Verification</Text>
              <Text style={styles.title}>
                {step === 'otp' ? 'Enter OTP' : 'Verify Aadhaar'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={close} disabled={loading}>
              <X color="#666" size={18} />
            </TouchableOpacity>
          </View>

          {step === 'checking' && (
            <View style={styles.checkingBox}>
              <ActivityIndicator color="#D20236" />
            </View>
          )}

          {step === 'aadhaar' && (
            <>
              <View style={styles.body}>
                <Text style={styles.label}>Aadhaar number</Text>
                <View style={styles.inputWrap}>
                  <Fingerprint color="#999" size={18} />
                  <TextInput
                    value={aadhaarNumber}
                    onChangeText={(text) => setAadhaarNumber(formatAadhaar(text))}
                    editable={!loading}
                    keyboardType="number-pad"
                    placeholder="1234 5678 9012"
                    placeholderTextColor="#aaa"
                    style={styles.input}
                  />
                </View>

                {error ? (
                  <View style={[styles.messageBox, styles.errorBox]}>
                    <AlertCircle color="#D20236" size={17} />
                    <Text style={[styles.messageText, styles.errorText]}>{error}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.disabledBtn]}
                  onPress={sendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Fingerprint color="#fff" size={17} />
                  )}
                  <Text style={styles.primaryText}>{loading ? 'Sending OTP...' : 'Send OTP'}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'otp' && (
            <>
              <View style={styles.body}>
                <Text style={styles.helperText}>
                  Enter the OTP sent to the mobile number linked with this Aadhaar.
                </Text>
                <Text style={styles.label}>OTP</Text>
                <View style={styles.inputWrap}>
                  <Smartphone color="#999" size={18} />
                  <TextInput
                    value={otp}
                    onChangeText={(text) => setOtp(digitsOnly(text).slice(0, 6))}
                    editable={!loading}
                    keyboardType="number-pad"
                    placeholder="6-digit OTP"
                    placeholderTextColor="#aaa"
                    style={styles.input}
                  />
                </View>

                {error ? (
                  <View style={[styles.messageBox, styles.errorBox]}>
                    <AlertCircle color="#D20236" size={17} />
                    <Text style={[styles.messageText, styles.errorText]}>{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity onPress={changeAadhaarNumber} disabled={loading}>
                  <Text style={styles.linkText}>Wrong Aadhaar number? Change it</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.disabledBtn]}
                  onPress={verifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Fingerprint color="#fff" size={17} />
                  )}
                  <Text style={styles.primaryText}>{loading ? 'Verifying...' : 'Verify'}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'success' && (
            <>
              <View style={styles.body}>
                <View style={[styles.messageBox, styles.successBox]}>
                  <CheckCircle color="#1a7f37" size={17} />
                  <Text style={[styles.messageText, styles.successText]}>
                    Aadhaar verified successfully.
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                {!photoVerified && onVerifyPhoto ? (
                  <TouchableOpacity style={styles.primaryBtn} onPress={onVerifyPhoto}>
                    <Camera color="#fff" size={17} />
                    <Text style={styles.primaryText}>Verify Photo</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={styles.laterBtn} onPress={close}>
                  <Text style={styles.laterText}>Done</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  headerText: { flex: 1 },
  eyebrow: {
    color: '#D20236',
    fontSize: 11,
    fontFamily: 'Outfit-ExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: { marginTop: 7, color: '#111', fontSize: 22, fontFamily: 'Outfit-Black' },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#f6f6f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkingBox: { paddingVertical: 40, alignItems: 'center' },
  body: { paddingHorizontal: 20, paddingTop: 16, gap: 9 },
  helperText: { color: '#555', fontSize: 13, fontFamily: 'Outfit-Regular', marginBottom: 2 },
  label: { color: '#222', fontSize: 13, fontFamily: 'Outfit-ExtraBold' },
  inputWrap: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  input: { flex: 1, color: '#000', fontSize: 15, fontFamily: 'Outfit-Bold', paddingVertical: 0 },
  linkText: {
    color: '#D20236',
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    marginTop: 2,
    marginBottom: 6,
  },
  messageBox: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  successBox: { backgroundColor: '#e9f8ee' },
  errorBox: { backgroundColor: '#fff1f3' },
  messageText: { flex: 1, fontSize: 13, fontFamily: 'Outfit-Bold', lineHeight: 18 },
  successText: { color: '#1a7f37' },
  errorText: { color: '#D20236' },
  actions: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18, gap: 10 },
  primaryBtn: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#D20236',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  disabledBtn: { backgroundColor: '#e69aab' },
  primaryText: { color: '#fff', fontSize: 15, fontFamily: 'Outfit-ExtraBold' },
  laterBtn: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  laterText: { color: '#666', fontSize: 14, fontFamily: 'Outfit-ExtraBold' },
});
