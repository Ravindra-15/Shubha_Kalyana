import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CheckSquare, Square } from 'lucide-react-native';
import {
  submitInactivityFeedback,
  InactivityFeedbackReason,
} from '../api/inactivityFeedback';

type Props = {
  visible: boolean;
  reasons: InactivityFeedbackReason[];
  onSubmitted: () => void;
};

const DESCRIPTION_MAX_LENGTH = 500;

export default function InactivityFeedbackModal({ visible, reasons, onSubmitted }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!visible) return null;

  const hasOther = selected.includes('Other');

  const toggleReason = (reason: string) => {
    setSelected((prev) =>
      prev.includes(reason) ? prev.filter((item) => item !== reason) : [...prev, reason],
    );
    setError('');
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      setError('Please select at least one reason to continue.');
      return;
    }
    if (hasOther && !description.trim()) {
      setError('Please describe the reason since you selected "Other".');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await submitInactivityFeedback({
        reasons: selected as InactivityFeedbackReason[],
        description: description.trim(),
      });
      onSubmitted();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to submit your feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.centerWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.card}>
            <View style={styles.headRow}>
              <Text style={styles.headTitle}>We&apos;ve missed you!</Text>
            </View>
            <Text style={styles.subtitle}>
              You have an active membership but haven&apos;t used Shubha Kalyana in a while.
              Let us know why so we can improve your experience.
            </Text>

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              <Text style={styles.label}>Select your reason(s)</Text>
              {reasons.map((reason) => {
                const active = selected.includes(reason);
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[styles.reasonRow, active && styles.reasonRowActive]}
                    onPress={() => toggleReason(reason)}
                  >
                    {active ? (
                      <CheckSquare color="#D20236" size={20} />
                    ) : (
                      <Square color="#ccc" size={20} />
                    )}
                    <Text style={styles.reasonText}>{reason}</Text>
                  </TouchableOpacity>
                );
              })}

              {hasOther && (
                <>
                  <Text style={styles.label}>Please describe the reason</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Tell us more about the issue..."
                    placeholderTextColor="#aaa"
                    value={description}
                    onChangeText={(text) => setDescription(text.slice(0, DESCRIPTION_MAX_LENGTH))}
                    multiline
                    numberOfLines={4}
                    maxLength={DESCRIPTION_MAX_LENGTH}
                  />
                  <Text style={styles.counter}>
                    {description.length}/{DESCRIPTION_MAX_LENGTH}
                  </Text>
                </>
              )}

              {!!error && <Text style={styles.errorText}>{error}</Text>}
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  centerWrap: { flex: 1, justifyContent: 'center', padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    maxHeight: '85%',
  },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headTitle: { fontSize: 18, fontFamily: 'Outfit-Bold', color: '#D20236' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 6, marginBottom: 14, lineHeight: 19 },
  scrollArea: { flexGrow: 0, flexShrink: 1 },
  scrollContent: { paddingBottom: 4 },
  label: { fontSize: 13, fontFamily: 'Outfit-SemiBold', color: '#000', marginBottom: 10, marginTop: 6 },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  reasonRowActive: { borderColor: '#D20236', backgroundColor: '#fdf2f5' },
  reasonText: { fontSize: 14, color: '#333', flex: 1 },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12,
    fontSize: 13, color: '#000', textAlignVertical: 'top', minHeight: 90,
  },
  counter: { fontSize: 11, color: '#999', textAlign: 'right', marginTop: 4 },
  errorText: { fontSize: 13, color: '#D20236', fontFamily: 'Outfit-SemiBold', marginTop: 12 },
  submitBtn: {
    marginTop: 16,
    backgroundColor: '#D20236',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { fontSize: 15, fontFamily: 'Outfit-Bold', color: '#fff' },
});
