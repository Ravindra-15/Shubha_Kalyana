import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { X } from 'lucide-react-native';
import { reportChatUser, CHAT_REPORT_REASONS, ChatReportReason } from '../api/complaint';

type Props = {
  visible: boolean;
  chatId: string;
  onClose: () => void;
  onSubmitted: () => void;
};

export default function ReportUserModal({ visible, chatId, onClose, onSubmitted }: Props) {
  const [reason, setReason] = useState<ChatReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setReason(null);
    setDescription('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (!reason) return;
    try {
      setLoading(true);
      await reportChatUser(chatId, { reason, description: description.trim() || undefined });
      reset();
      onSubmitted();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headRow}>
            <Text style={styles.headTitle}>Report User</Text>
            <TouchableOpacity onPress={handleClose}>
              <X color="#999" size={20} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Help us maintain a safe and respectful platform.</Text>

          {CHAT_REPORT_REASONS.map((r) => (
            <TouchableOpacity key={r} style={styles.reasonRow} onPress={() => setReason(r)}>
              <View style={[styles.radio, reason === r && styles.radioActive]}>
                {reason === r && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.reasonText}>{r}</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.label}>Describe the issue (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Tell us more about the issue..."
            placeholderTextColor="#aaa"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, !reason && styles.submitBtnDisabled]}
              onPress={submit}
              disabled={!reason || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitText}>Submit Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 22, maxHeight: '85%' },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headTitle: { fontSize: 17, fontWeight: '700', color: '#D20236' },
  subtitle: { fontSize: 12, color: '#888', marginTop: 4, marginBottom: 14 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#D20236' },
  radioDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#D20236' },
  reasonText: { fontSize: 14, color: '#333' },
  label: { fontSize: 12, color: '#888', marginTop: 10, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 10,
    fontSize: 13, color: '#000', textAlignVertical: 'top', minHeight: 70,
  },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#000' },
  submitBtn: { flex: 1, backgroundColor: '#D20236', borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#e9a9b6' },
  submitText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});