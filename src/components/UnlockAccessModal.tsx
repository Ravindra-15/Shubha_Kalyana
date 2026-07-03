import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { X, Lock, Phone, Users, MapPin } from 'lucide-react-native';

type Props = {
  visible: boolean;
  name?: string;
  price?: number;
  loading?: boolean;
  onClose: () => void;
  onUnlock: () => void;          // pay ₹price to unlock this profile
  onUpgrade: () => void;         // go to plans page
};

export default function UnlockAccessModal({
  visible,
  name,
  price = 99,
  loading = false,
  onClose,
  onUnlock,
  onUpgrade,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X color="#999" size={22} />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <Lock color="#fff" size={26} />
          </View>

          <Text style={styles.title}>Unlock Full Profile Access</Text>
          <Text style={styles.subtitle}>
            View contact details and start communicating with {name || 'this profile'} securely.
          </Text>

          <View style={styles.benefitBox}>
            <Text style={styles.benefitHead}>You'll get access to:</Text>
            <View style={styles.benefitRow}>
              <View style={styles.benefitIcon}><Phone color="#D20236" size={15} /></View>
              <Text style={styles.benefitText}>Contact number</Text>
            </View>
            <View style={styles.benefitRow}>
              <View style={styles.benefitIcon}><Users color="#D20236" size={15} /></View>
              <Text style={styles.benefitText}>Family contact details</Text>
            </View>
            <View style={styles.benefitRow}>
              <View style={styles.benefitIcon}><MapPin color="#D20236" size={15} /></View>
              <Text style={styles.benefitText}>Full address</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.unlockBtn} onPress={onUnlock} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.unlockText}>Unlock for ₹{price}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade} disabled={loading}>
            <Text style={styles.upgradeText}>Upgrade to Premium</Text>
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
  iconCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#D20236',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18, marginTop: 6,
  },
  title: { fontSize: 19, fontWeight: '700', color: '#000', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#777', textAlign: 'center', marginBottom: 20, lineHeight: 19 },
  benefitBox: {
    width: '100%', backgroundColor: '#f7f7f7', borderRadius: 12, padding: 16, marginBottom: 20,
  },
  benefitHead: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 12 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  benefitIcon: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#fdf2f5',
    alignItems: 'center', justifyContent: 'center',
  },
  benefitText: { fontSize: 14, color: '#333' },
  unlockBtn: {
    width: '100%', backgroundColor: '#D20236', borderRadius: 8,
    paddingVertical: 15, alignItems: 'center', marginBottom: 12,
  },
  unlockText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  upgradeBtn: {
    width: '100%', borderWidth: 1, borderColor: '#D20236', borderRadius: 8,
    paddingVertical: 15, alignItems: 'center',
  },
  upgradeText: { fontSize: 15, fontWeight: '600', color: '#D20236' },
});