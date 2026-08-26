import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image } from 'react-native';
import { X, Lock, AlertCircle } from 'lucide-react-native';
import {
  getSingleProfileUnlockLimitMessage,
  getSingleProfileUnlockRemainingLabel,
  isFreePlanSingleUnlockLimitReached,
} from '../utils/singleProfileUnlockAccess';

type Props = {
  visible: boolean;
  name?: string;
  access?: any;
  variant?: 'profile' | 'accept';
  action?: 'send' | 'accept';    // only used when variant === 'accept'
  loading?: boolean;
  onClose: () => void;
  onUpgrade: () => void;         // go to plans page
};

export default function UnlockAccessModal({
  visible,
  name,
  access,
  variant = 'profile',
  action = 'accept',
  loading = false,
  onClose,
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

          {isAcceptFlow ? (
            <AlertCircle color="#D20236" size={52} strokeWidth={1.5} style={styles.warningIcon} />
          ) : (
            <View style={styles.iconCircle}>
              <Lock color="#fff" size={26} />
            </View>
          )}

          <Text style={styles.title}>
            {isAcceptFlow ? 'Oops !' : 'Unlock Full Profile Access'}
          </Text>
          <Text style={styles.subtitle}>
            {singleUnlockLimitReached
              ? getSingleProfileUnlockLimitMessage(access)
              : isAcceptFlow
                ? `Access required to ${action === 'send' ? 'send a request to' : 'accept'} ${name || 'this profile'}.`
                : `View contact details and start communicating with ${name || 'this profile'} securely.`}
          </Text>
          {!isAcceptFlow && showSingleUnlockUsage ? (
            <View style={styles.remainingBox}>
              <Text style={styles.remainingText}>
                {getSingleProfileUnlockRemainingLabel(access)}
              </Text>
            </View>
          ) : null}

          {!isAcceptFlow ? (
            <View style={styles.benefitBox}>
              <Text style={styles.benefitHead}>You'll get access to:</Text>
              <View style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Image source={require('../assets/images/contact-icon.png')} style={styles.benefitIconImg} resizeMode="contain" />
                </View>
                <Text style={styles.benefitText}>Contact number</Text>
              </View>
              <View style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Image source={require('../assets/images/family-icon.png')} style={styles.benefitIconImg} resizeMode="contain" />
                </View>
                <Text style={styles.benefitText}>Family contact details</Text>
              </View>
              <View style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Image source={require('../assets/images/address-icon.png')} style={styles.benefitIconImg} resizeMode="contain" />
                </View>
                <Text style={styles.benefitText}>Full address</Text>
              </View>
            </View>
          ) : null}

          <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade} disabled={loading}>
            <Text style={styles.upgradeText}>{isAcceptFlow ? 'Upgrade Plan' : 'Upgrade to Premium'}</Text>
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
  warningIcon: { marginBottom: 18, marginTop: 6 },
  iconCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#D20236',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18, marginTop: 6,
  },
  title: { fontSize: 21, fontFamily: 'Outfit-Bold', color: '#000', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#777', textAlign: 'center', marginBottom: 20, lineHeight: 19 },
  remainingBox: {
    width: '100%',
    backgroundColor: '#fdf2f5',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  remainingText: { color: '#D20236', fontSize: 15, fontFamily: 'Outfit-ExtraBold', textAlign: 'center' },
  benefitBox: {
    width: '100%', borderRadius: 12, padding: 16, marginBottom: 20,
  },
  benefitHead: { fontSize: 15, fontFamily: 'Outfit-Bold', color: '#333', marginBottom: 12 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  benefitIcon: {
    width: 28, height: 28, borderRadius: 22, backgroundColor: '#fdf2f5',
    alignItems: 'center', justifyContent: 'center',
  },
  benefitIconImg: { width: 30, height: 30 },
  benefitText: { fontSize: 16, color: '#333' },
  upgradeBtn: {
    width: '100%', borderWidth: 1, borderColor: '#D20236',backgroundColor: '#D20236', borderRadius: 8,
    paddingVertical: 15, alignItems: 'center',
  },
upgradeText: {
  fontSize: 17,
  fontFamily: 'Outfit-SemiBold',
  color: '#fff',
},
});
