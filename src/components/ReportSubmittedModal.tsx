import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ban } from 'lucide-react-native';

type Props = {
  visible: boolean;
  onBackToChat: () => void;
};

export default function ReportSubmittedModal({ visible, onBackToChat }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onBackToChat}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ban color="#D20236" size={26} />
          </View>
          <Text style={styles.title}>Report Submitted Successfully</Text>
          <Text style={styles.subtitle}>
            Thank you for helping us maintain a safe and respectful platform. Our support team will review the report.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={onBackToChat}>
            <Text style={styles.btnText}>Back to Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 26, alignItems: 'center' },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fdf2f5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#777', textAlign: 'center', lineHeight: 19, marginBottom: 20 },
  btn: { backgroundColor: '#D20236', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 40, alignItems: 'center', width: '100%' },
  btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});