import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Eye, Trash2, Ban, X } from 'lucide-react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onViewProfile: () => void;
  onDeleteChat: () => void;
  onBlockAndReport: () => void;
};

export default function ChatOptionsModal({
  visible, onClose, onViewProfile, onDeleteChat, onBlockAndReport,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          <View style={styles.headRow}>
            <Text style={styles.headTitle}>Options</Text>
            <TouchableOpacity onPress={onClose}>
              <X color="#999" size={20} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.row} onPress={onViewProfile}>
            <Eye color="#333" size={18} />
            <Text style={styles.rowText}>View Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={onDeleteChat}>
            <Trash2 color="#333" size={18} />
            <Text style={styles.rowText}>Delete Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={onBlockAndReport}>
            <Ban color="#D20236" size={18} />
            <Text style={[styles.rowText, { color: '#D20236' }]}>Block and Report User</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 28 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headTitle: { fontSize: 16, fontWeight: '700', color: '#000' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#f2f2f2' },
  rowText: { fontSize: 15, color: '#333', fontWeight: '500' },
  cancelBtn: { marginTop: 14, backgroundColor: '#f0f0f0', borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#000' },
});