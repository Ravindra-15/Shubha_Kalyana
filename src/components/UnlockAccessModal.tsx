import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { X, Lock, Phone, Users, MapPin } from 'lucide-react-native';
import {
  getSingleProfileUnlockLimitMessage,
  getSingleProfileUnlockRemainingLabel,
  isFreePlanSingleUnlockLimitReached,
} from '../utils/singleProfileUnlockAccess';

type Props = {
  visible: boolean;
  name?: string;
  price?: number;
  access?: any;
  variant?: 'profile' | 'accept';
  loading?: boolean;
  onClose: () => void;
  onUnlock: () => void;          // pay ₹price to unlock this profile
  onUpgrade: () => void;         // go to plans page
};

export default function UnlockAccessModal({
  visible,
  name,
  price = 99,
  access,
  variant = 'profile',
  loading = false,
  onClose,
  onUnlock,
  onUpgrade,
}: Props) {
  const showSingleUnlockUsage = Boolean(access && !access.hasActiveMembership);
  const singleUnlockLimitReached = isFreePlanSingleUnlockLimitReached(access);
  const isAcceptFlow = variant === 'accept';

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

          <Text style={styles.title}>
            {isAcceptFlow ? 'Oops !' : 'Unlock Full Profile Access'}
          </Text>
          <Text style={styles.subtitle}>
            {singleUnlockLimitReached
              ? getSingleProfileUnlockLimitMessage(access)
              : isAcceptFlow
                ? `Access required to accept ${name || 'this profile'}.`
                : `View contact details and start communicating with ${name || 'this profile'} securely.`}
          </Text>
          {showSingleUnlockUsage ? (
            <View style={styles.remainingBox}>
              <Text style={styles.remainingText}>
                {getSingleProfileUnlockRemainingLabel(access)}
              </Text>
            </View>
          ) : null}

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

          {!singleUnlockLimitReached ? (
            <TouchableOpacity style={styles.unlockBtn} onPress={onUnlock} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.unlockText}>Unlock for ₹{price}</Text>
            )}
            </TouchableOpacity>
          ) : null}

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
  title: { fontSize: 19, fontFamily: 'Outfit-Bold', color: '#000', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#777', textAlign: 'center', marginBottom: 20, lineHeight: 19 },
  remainingBox: {
    width: '100%',
    backgroundColor: '#fdf2f5',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  remainingText: { color: '#D20236', fontSize: 13, fontFamily: 'Outfit-ExtraBold', textAlign: 'center' },
  benefitBox: {
    width: '100%', backgroundColor: '#f7f7f7', borderRadius: 12, padding: 16, marginBottom: 20,
  },
  benefitHead: { fontSize: 13, fontFamily: 'Outfit-Bold', color: '#333', marginBottom: 12 },
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
  unlockText: { fontSize: 15, fontFamily: 'Outfit-Bold', color: '#fff' },
  upgradeBtn: {
    width: '100%', borderWidth: 1, borderColor: '#D20236', borderRadius: 8,
    paddingVertical: 15, alignItems: 'center',
  },
  upgradeText: { fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#D20236' },
});
