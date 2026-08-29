import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
} from 'react-native';
import { X } from 'lucide-react-native';

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

          <View style={styles.iconWrapper}>
            <View style={[styles.dot, styles.dotTopLeft]} />
            <View style={[styles.dot, styles.dotTopRight]} />
            <View style={[styles.dot, styles.dotLeft]} />
            <View style={[styles.dot, styles.dotRight]} />
            <View style={[styles.dot, styles.dotBottomLeft]} />
            <View style={styles.iconCircle}>
              <Image
                source={require('../../assets/images/cingratsUsericon.png')}
                style={styles.iconImage}
                resizeMode="contain"
              />
            </View>
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
  iconWrapper: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#D20236',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: 40,
    height: 40,
  },
  dot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D9D9D9',
  },
  dotTopLeft: { top: 8, left: 20 },
  dotTopRight: { top: 8, right: 20 },
  dotLeft: { top: 68, left: 0 },
  dotRight: { top: 68, right: 0 },
  dotBottomLeft: { bottom: 10, left: 30 },
  congrats: { fontSize: 24, fontFamily: 'Outfit-Bold', color: '#D20236', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#333', marginBottom: 30, textAlign: 'center' },
  browseBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  browseText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold' },
});