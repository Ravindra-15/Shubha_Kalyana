import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Square, CheckSquare, Check } from 'lucide-react-native';
import { requestDeleteAccount } from '../../api/settings';
import { useAuth } from '../../context/AuthContext';

const REASONS = [
  'Found a Match',
  'Privacy Concerns',
  'Not Using the Platform',
  'Too Many Notifications',
  'Other',
];

type Step = 'FORM' | 'SUCCESS';

export default function DeleteAccountScreen({ navigation }: any) {
  const { logout } = useAuth();
  const [step, setStep] = useState<Step>('FORM');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const canSubmit = selectedReasons.length > 0 && confirmed && !loading;

  const handleSubmit = async () => {
    setErrorMsg('');
    setAttemptedSubmit(true);

    if (selectedReasons.length === 0) {
      setErrorMsg('Please select at least one reason');
      return;
    }
    if (!confirmed) {
      setErrorMsg('Please check the box to confirm this action is permanent');
      return;
    }

    try {
      setLoading(true);
      const reasons = feedback.trim()
        ? [...selectedReasons, `Other feedback: ${feedback.trim()}`]
        : selectedReasons;
      await requestDeleteAccount(reasons);
      setStep('SUCCESS');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Could not submit deletion request');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delete Account</Text>
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
          <Text style={styles.successTitle}>Deletion Request Submitted</Text>
          <Text style={styles.successSubtitle}>
            Your request has been received. Our team will process it shortly, and your account will remain active until then.
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Why are you leaving?</Text>

        {REASONS.map((reason) => {
          const selected = selectedReasons.includes(reason);
          return (
            <TouchableOpacity
              key={reason}
              style={styles.reasonRow}
              onPress={() => toggleReason(reason)}
            >
              {selected ? (
                <CheckSquare color="#D20236" size={20} />
              ) : (
                <Square color="#ccc" size={20} />
              )}
              <Text style={styles.reasonText}>{reason}</Text>
            </TouchableOpacity>
          );
        })}

        <Text style={styles.sectionTitle}>Tell us more (optional)</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Your feedback helps us improve..."
          placeholderTextColor="#999"
          value={feedback}
          onChangeText={setFeedback}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[
            styles.confirmRow,
            attemptedSubmit && !confirmed && styles.confirmRowError,
          ]}
          onPress={() => {
            setConfirmed((c) => !c);
            setErrorMsg('');
          }}
        >
          {confirmed ? (
            <CheckSquare color="#D20236" size={20} />
          ) : (
            <Square color={attemptedSubmit ? '#D20236' : '#ccc'} size={20} />
          )}
          <Text style={styles.confirmText}>I understand this action is permanent.</Text>
        </TouchableOpacity>

        {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteBtn, !canSubmit && styles.deleteBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#D20236" />
          ) : (
            <Text style={styles.deleteText}>Request to Delete Account</Text>
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
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  content: { padding: 16, paddingBottom: 30 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#000', marginBottom: 12, marginTop: 6 },
  reasonRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 10,
  },
  reasonText: { fontSize: 14, color: '#333', fontWeight: '500' },
  textArea: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12,
    fontSize: 13, color: '#000', textAlignVertical: 'top', minHeight: 90, marginBottom: 8,
  },
  confirmRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, marginBottom: 20,
    padding: 10, borderRadius: 8,
  },
  confirmRowError: { backgroundColor: '#fdf2f5' },
  confirmText: { fontSize: 13, color: '#333', flex: 1 },
  errorText: { fontSize: 13, color: '#D20236', marginBottom: 14, fontWeight: '500' },
  cancelBtn: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10,
    paddingVertical: 15, alignItems: 'center', marginBottom: 12,
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#333' },
  deleteBtn: {
    borderWidth: 1, borderColor: '#D20236', borderRadius: 10,
    paddingVertical: 15, alignItems: 'center',
  },
  deleteBtnDisabled: { borderColor: '#e9a9b6' },
  deleteText: { fontSize: 15, fontWeight: '700', color: '#D20236' },
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
  doneText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});