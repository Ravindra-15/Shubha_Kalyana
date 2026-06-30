import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { UserCheck, X } from 'lucide-react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  userName?: string;
};

export default function WelcomePopup({ visible, onClose, userName }: Props) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, 5000); // auto-close after 5s
    return () => clearTimeout(timer);
  }, [visible, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X color="#999" size={22} />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <UserCheck color="#fff" size={44} />
          </View>

          <Text style={styles.congrats}>Congratulations !</Text>
          <Text style={styles.subtitle}>Your Profile has been Verified !</Text>

          <TouchableOpacity style={styles.browseBtn} onPress={onClose}>
            <Text style={styles.browseText}>Start Browsing</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  closeBtn: { position: 'absolute', top: 16, right: 16, padding: 4 },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#D20236',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  congrats: { fontSize: 24, fontWeight: '700', color: '#D20236', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#333', marginBottom: 30, textAlign: 'center' },
  browseBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  browseText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});