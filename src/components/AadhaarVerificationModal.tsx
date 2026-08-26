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
import { verifyAadhaarWithMobile } from '../api/aadhaarVerification';

type Props = {
  visible: boolean;
  photoVerified?: boolean;
  onClose: () => void;
  onVerified?: () => void | Promise<void>;
  onVerifyPhoto?: () => void;
};

const digitsOnly = (value = '') => String(value).replace(/\D/g, '');

const formatAadhaar = (value = '') =>
  digitsOnly(value)
    .slice(0, 12)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

export default function AadhaarVerificationModal({
  visible,
  photoVerified = false,
  onClose,
  onVerified,
  onVerifyPhoto,
}: Props) {
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!visible) {
      setStatus('idle');
      setMessage('');
      setAadhaarNumber('');
      setMobileNumber('');
    }
  }, [visible]);

  const loading = status === 'submitting';
  const success = status === 'success';

  const close = () => {
    if (!loading) onClose();
  };

  const submit = async () => {
    const normalizedAadhaar = digitsOnly(aadhaarNumber);
    const normalizedMobile = digitsOnly(mobileNumber);

    if (normalizedAadhaar.length !== 12) {
      setStatus('error');
      setMessage('Enter a valid 12-digit Aadhaar number.');
      return;
    }

    if (normalizedMobile.length < 10) {
      setStatus('error');
      setMessage('Enter the mobile number linked with Aadhaar.');
      return;
    }

    try {
      setStatus('submitting');
      setMessage('');
      await verifyAadhaarWithMobile({
        aadhaarNumber: normalizedAadhaar,
        mobileNumber: normalizedMobile,
      });
      try {
        await onVerified?.();
      } catch {
        // Verification succeeded; refresh failures should not be shown as Aadhaar failures.
      }
      setStatus('success');
      setMessage('Aadhaar verified successfully.');
    } catch (error: any) {
      setStatus('error');
      setMessage(error?.response?.data?.message || error?.message || 'Aadhaar verification failed.');
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
              <Text style={styles.title}>Verify Aadhaar</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={close} disabled={loading}>
              <X color="#666" size={18} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={styles.label}>Aadhaar number</Text>
            <View style={styles.inputWrap}>
              <Fingerprint color="#999" size={18} />
              <TextInput
                value={aadhaarNumber}
                onChangeText={(text) => setAadhaarNumber(formatAadhaar(text))}
                editable={!loading && !success}
                keyboardType="number-pad"
                placeholder="1234 5678 9012"
                placeholderTextColor="#aaa"
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>Linked mobile number</Text>
            <View style={styles.inputWrap}>
              <Smartphone color="#999" size={18} />
              <TextInput
                value={mobileNumber}
                onChangeText={(text) => setMobileNumber(digitsOnly(text).slice(0, 15))}
                editable={!loading && !success}
                keyboardType="number-pad"
                placeholder="10-digit mobile number"
                placeholderTextColor="#aaa"
                style={styles.input}
              />
            </View>

            {message ? (
              <View style={[styles.messageBox, success ? styles.successBox : styles.errorBox]}>
                {success ? (
                  <CheckCircle color="#1a7f37" size={17} />
                ) : (
                  <AlertCircle color="#D20236" size={17} />
                )}
                <Text style={[styles.messageText, success ? styles.successText : styles.errorText]}>
                  {message}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actions}>
            {success ? (
              <>
                {!photoVerified && onVerifyPhoto ? (
                  <TouchableOpacity style={styles.primaryBtn} onPress={onVerifyPhoto}>
                    <Camera color="#fff" size={17} />
                    <Text style={styles.primaryText}>Verify Photo</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={styles.laterBtn} onPress={close}>
                  <Text style={styles.laterText}>Done</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={submit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Fingerprint color="#fff" size={17} />
                )}
                <Text style={styles.primaryText}>{loading ? 'Verifying...' : 'Verify'}</Text>
              </TouchableOpacity>
            )}
          </View>
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
  body: { paddingHorizontal: 20, paddingTop: 16, gap: 9 },
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
