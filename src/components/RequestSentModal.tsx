import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { X } from 'lucide-react-native';

type Props = {
  visible: boolean;
  name?: string;
  onClose: () => void;
  onContinueBrowsing: () => void;
  onViewSentRequests: () => void;
};

export default function RequestSentModal({
  visible,
  name,
  onClose,
  onContinueBrowsing,
  onViewSentRequests,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X color="#999" size={22} />
          </TouchableOpacity>

          <Image
            source={require('../assets/images/yellowtick.png')}
            style={styles.tick}
            resizeMode="contain"
          />

          <Text style={styles.title}>Request Sent Successfully</Text>
          <Text style={styles.subtitle}>
            Your interest has been sent to{'\n'}{name || 'this profile'}.
          </Text>

          <TouchableOpacity style={styles.browseBtn} onPress={onContinueBrowsing}>
            <Text style={styles.browseText}>Continue Browsing</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.viewBtn} onPress={onViewSentRequests}>
            <Text style={styles.viewText}>View Sent Requests</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 28,
    alignItems: 'center',
  },
  closeBtn: { position: 'absolute', top: 16, right: 16, padding: 4 },
  tick: { width: 70, height: 70, marginBottom: 20, marginTop: 6 },
  title: { fontSize: 19, fontWeight: '700', color: '#000', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#777', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  browseBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  browseText: { fontSize: 15, fontWeight: '600', color: '#000' },
  viewBtn: {
    width: '100%',
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  viewText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});