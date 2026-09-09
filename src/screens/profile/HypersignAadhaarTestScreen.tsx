import React, {useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AlertCircle, ArrowLeft, CheckCircle, Fingerprint, Smartphone} from 'lucide-react-native';
import {
  confirmHypersignAadhaarOtp,
  requestHypersignAadhaarOtp,
} from '../../api/hypersignAadhaar';

const digitsOnly = (value = '') => String(value).replace(/\D/g, '');

const formatAadhaar = (value = '') =>
  digitsOnly(value)
    .slice(0, 12)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

// Internal test screen for the new Hypersign Aadhaar OTP flow. Fully
// separate from the existing Surepass-based Aadhaar verification --
// does not touch that flow, Face Match, or any other screen.
const HypersignAadhaarTestScreen = ({navigation}: any) => {
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verifiedName, setVerifiedName] = useState('');

  const handleGetOtp = async () => {
    setError('');
    setMessage('');
    const normalized = digitsOnly(aadhaarNumber);
    if (normalized.length !== 12) {
      setError('Enter a valid 12-digit Aadhaar number.');
      return;
    }

    try {
      setLoading(true);
      await requestHypersignAadhaarOtp(normalized);
      setStep('otp');
      setMessage('OTP sent to the registered mobile number.');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Unable to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    if (digitsOnly(otp).length < 4) {
      setError('Enter the OTP.');
      return;
    }

    try {
      setLoading(true);
      const data = await confirmHypersignAadhaarOtp(otp);
      setVerifiedName(data?.name || '');
      setStep('success');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#111" size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hypersign Aadhaar OTP (Test)</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.body}>
          <Text style={styles.subtitle}>
            Internal test of the new Hypersign integration. This does not affect your
            existing Aadhaar verification.
          </Text>

          {step === 'form' && (
            <>
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

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={handleGetOtp}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Fingerprint color="#fff" size={17} />}
                <Text style={styles.primaryText}>{loading ? 'Sending...' : 'Get OTP'}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'otp' && (
            <>
              {message ? <Text style={styles.hint}>{message}</Text> : null}
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
                  textContentType="oneTimeCode"
                />
              </View>

              {error ? (
                <View style={[styles.messageBox, styles.errorBox]}>
                  <AlertCircle color="#D20236" size={17} />
                  <Text style={[styles.messageText, styles.errorText]}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={handleVerify}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Fingerprint color="#fff" size={17} />}
                <Text style={styles.primaryText}>{loading ? 'Verifying...' : 'Verify'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.laterBtn}
                onPress={() => {
                  setStep('form');
                  setOtp('');
                  setError('');
                }}
                disabled={loading}
              >
                <Text style={styles.laterText}>Back</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'success' && (
            <View style={styles.successWrap}>
              <CheckCircle color="#1a7f37" size={40} />
              <Text style={styles.successTitle}>Aadhaar Verified Successfully</Text>
              {verifiedName ? (
                <Text style={styles.successSubtitle}>Name on Aadhaar: {verifiedName}</Text>
              ) : null}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#fff'},
  flex: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f6f6f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {color: '#111', fontSize: 17, fontFamily: 'Outfit-Black'},
  body: {padding: 20, gap: 10},
  subtitle: {color: '#666', fontSize: 13, fontFamily: 'Outfit-Medium', lineHeight: 18, marginBottom: 6},
  label: {color: '#222', fontSize: 13, fontFamily: 'Outfit-ExtraBold'},
  hint: {color: '#444', fontSize: 14, fontFamily: 'Outfit-Medium', marginBottom: 4},
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
  input: {flex: 1, color: '#000', fontSize: 15, fontFamily: 'Outfit-Bold', paddingVertical: 0},
  messageBox: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f6f6f6',
  },
  errorBox: {backgroundColor: '#fff1f3'},
  messageText: {flex: 1, fontSize: 13, fontFamily: 'Outfit-Bold', lineHeight: 18, color: '#444'},
  errorText: {color: '#D20236'},
  primaryBtn: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#D20236',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  disabledBtn: {backgroundColor: '#e69aab'},
  primaryText: {color: '#fff', fontSize: 15, fontFamily: 'Outfit-ExtraBold'},
  laterBtn: {minHeight: 40, alignItems: 'center', justifyContent: 'center'},
  laterText: {color: '#666', fontSize: 14, fontFamily: 'Outfit-ExtraBold'},
  successWrap: {alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 30},
  successTitle: {color: '#111', fontSize: 17, fontFamily: 'Outfit-Black'},
  successSubtitle: {color: '#666', fontSize: 14, fontFamily: 'Outfit-Medium'},
});

export default HypersignAadhaarTestScreen;
