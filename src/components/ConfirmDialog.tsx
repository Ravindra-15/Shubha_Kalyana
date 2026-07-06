import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  confirmColor = '#D20236',
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: confirmColor }]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 22 },
  title: { fontSize: 17, fontWeight: '700', color: '#000', marginBottom: 8 },
  message: { fontSize: 13, color: '#777', lineHeight: 19, marginBottom: 20 },
  btnRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#000' },
  confirmBtn: { flex: 1, borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  confirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});