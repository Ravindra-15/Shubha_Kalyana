import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check } from 'lucide-react-native';
import { raiseComplaint } from '../../api/complaint';

type Step = 'FORM' | 'SUCCESS';

const REASONS = [
  'Fake Profile',
  'Harassment / Abuse',
  'Inappropriate Messages',
  'Fraud / Money Request',
  'Misleading Information',
  'Spam',
  'Other',
];

export default function ReportUserScreen({ navigation }: any) {
  const [step, setStep] = useState<Step>('FORM');
  const [reason, setReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!reason) {
      setErrorMsg('Please select a reason');
      return;
    }
    try {
      setLoading(true);
      await raiseComplaint({ type: reason, description: description.trim() || undefined });
      setStep('SUCCESS');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Could not submit report');
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
        <Text style={styles.headerTitle}>Report User</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {step === 'SUCCESS' ? (
          <View style={styles.successWrap}>
            <View style={styles.successIcon}>
              <Check color="#1a7f37" size={32} />
            </View>
            <Text style={styles.successTitle}>Report Submitted Successfully</Text>
            <Text style={styles.successSubtitle}>
              Thank you for helping us maintain a safe and respectful platform. Our support team will review the report.
            </Text>
            <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.doneBtnText}>Back to Settings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.subtitle}>Help us maintain a safe and respectful platform.</Text>

            {REASONS.map((r) => (
              <TouchableOpacity key={r} style={styles.reasonRow} onPress={() => setReason(r)}>
                <View style={[styles.radio, reason === r && styles.radioActive]}>
                  {reason === r && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.reasonText}>{r}</Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.label}>Describe the issue (optional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Tell us more about the issue..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

            <TouchableOpacity
              style={[styles.submitBtn, !reason && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!reason || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Submit Report</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#D20236' },
  content: { padding: 20 },
  subtitle: { fontSize: 12, color: '#888', marginBottom: 16 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#D20236' },
  radioDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#D20236' },
  reasonText: { fontSize: 14, color: '#333' },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 8 },
  textArea: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12,
    fontSize: 13, color: '#000', textAlignVertical: 'top', minHeight: 90,
  },
  errorText: { fontSize: 13, color: '#D20236', marginTop: 12, fontWeight: '500' },
  submitBtn: {
    backgroundColor: '#D20236', borderRadius: 10, paddingVertical: 15,
    alignItems: 'center', marginTop: 24,
  },
  submitBtnDisabled: { backgroundColor: '#e9a9b6' },
  submitText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  successIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#eafaf0',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  successTitle: { fontSize: 17, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 10 },
  successSubtitle: { fontSize: 13, color: '#777', textAlign: 'center', lineHeight: 19, marginBottom: 28 },
  doneBtn: {
    backgroundColor: '#D20236', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 50,
  },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});