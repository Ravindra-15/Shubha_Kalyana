import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff, Check } from 'lucide-react-native';
import { changeMpin } from '../../api/settings';

type Step = 'FORM' | 'SUCCESS';

export default function ChangeMpinScreen({ navigation }: any) {
  const [step, setStep] = useState<Step>('FORM');
  const [currentMpin, setCurrentMpin] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isValidMpin = (v: string) => /^\d{4,6}$/.test(v);

  const canSubmit =
    isValidMpin(currentMpin) &&
    isValidMpin(newMpin) &&
    isValidMpin(confirmMpin) &&
    !loading;

  const handleSubmit = async () => {
    setErrorMsg('');

    if (!isValidMpin(currentMpin) || !isValidMpin(newMpin) || !isValidMpin(confirmMpin)) {
      setErrorMsg('MPIN must be 4 to 6 digits');
      return;
    }
    if (newMpin !== confirmMpin) {
      setErrorMsg('New MPIN and Confirm MPIN do not match');
      return;
    }
    if (newMpin === currentMpin) {
      setErrorMsg('New MPIN must be different from current MPIN');
      return;
    }

    try {
      setLoading(true);
      await changeMpin(currentMpin, newMpin, confirmMpin);
      setStep('SUCCESS');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Could not change MPIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change MPIN</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {step === 'FORM' && (
            <>
              <Text style={styles.label}>Current MPIN</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter current MPIN"
                  placeholderTextColor="#999"
                  value={currentMpin}
                  onChangeText={(t) => setCurrentMpin(t.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  secureTextEntry={!showCurrent}
                  maxLength={6}
                />
                <TouchableOpacity onPress={() => setShowCurrent((s) => !s)} style={styles.eyeBtn}>
                  {showCurrent ? <EyeOff color="#999" size={18} /> : <Eye color="#999" size={18} />}
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>New MPIN</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new MPIN"
                  placeholderTextColor="#999"
                  value={newMpin}
                  onChangeText={(t) => setNewMpin(t.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  secureTextEntry={!showNew}
                  maxLength={6}
                />
                <TouchableOpacity onPress={() => setShowNew((s) => !s)} style={styles.eyeBtn}>
                  {showNew ? <EyeOff color="#999" size={18} /> : <Eye color="#999" size={18} />}
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirm MPIN</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new MPIN"
                  placeholderTextColor="#999"
                  value={confirmMpin}
                  onChangeText={(t) => setConfirmMpin(t.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  secureTextEntry={!showConfirm}
                  maxLength={6}
                />
                <TouchableOpacity onPress={() => setShowConfirm((s) => !s)} style={styles.eyeBtn}>
                  {showConfirm ? <EyeOff color="#999" size={18} /> : <Eye color="#999" size={18} />}
                </TouchableOpacity>
              </View>

              {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

              <TouchableOpacity
                style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Update MPIN</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {step === 'SUCCESS' && (
            <View style={styles.successWrap}>
              <View style={styles.successIcon}>
                <Check color="#1a7f37" size={32} />
              </View>
              <Text style={styles.successTitle}>MPIN Changed Successfully</Text>
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
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 14,
  },
  input: { flex: 1, paddingVertical: 13, fontSize: 14, color: '#000' },
  eyeBtn: { padding: 4 },
  errorText: { fontSize: 13, color: '#D20236', marginTop: 12, fontWeight: '500' },
  primaryBtn: {
    backgroundColor: '#D20236', borderRadius: 10, paddingVertical: 15,
    alignItems: 'center', marginTop: 28,
  },
  primaryBtnDisabled: { backgroundColor: '#e9a9b6' },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
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