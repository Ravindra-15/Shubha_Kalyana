import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BadgeCheck, Camera, Fingerprint, X } from 'lucide-react-native';
import type { VerificationPromptStatus } from '../utils/verificationPrompt';

type Props = {
  visible: boolean;
  status: VerificationPromptStatus | null;
  onClose: () => void;
  onVerifyPhoto: () => void;
  onVerifyAadhaar: () => void;
};

const StatusPill = ({ verified }: { verified: boolean }) => (
  <View style={[styles.statusPill, verified ? styles.statusVerified : styles.statusPending]}>
    <Text style={[styles.statusText, verified ? styles.statusVerifiedText : styles.statusPendingText]}>
      {verified ? 'Verified' : 'Pending'}
    </Text>
  </View>
);

export default function VerificationPromptModal({
  visible,
  status,
  onClose,
  onVerifyPhoto,
  onVerifyAadhaar,
}: Props) {
  if (!status?.shouldShow) return null;

  const photoVerified = status.profilePhotoVerified;
  const aadhaarVerified = status.aadhaarNumberVerified;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.eyebrow}>Account Verification</Text>
              <Text style={styles.title}>Complete your verification</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X color="#666" size={18} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.statusRow}>
              <View style={styles.statusLeft}>
                <View style={[styles.iconBox, styles.photoIconBox]}>
                  {photoVerified ? (
                    <BadgeCheck color="#D20236" size={20} />
                  ) : (
                    <Camera color="#D20236" size={20} />
                  )}
                </View>
                <View>
                  <Text style={styles.itemTitle}>Profile photo</Text>
                  <Text style={styles.itemSub}>Live selfie match</Text>
                </View>
              </View>
              <StatusPill verified={photoVerified} />
            </View>

            <View style={styles.statusRow}>
              <View style={styles.statusLeft}>
                <View style={[styles.iconBox, styles.aadhaarIconBox]}>
                  {aadhaarVerified ? (
                    <BadgeCheck color="#2563eb" size={20} />
                  ) : (
                    <Fingerprint color="#2563eb" size={20} />
                  )}
                </View>
                <View>
                  <Text style={styles.itemTitle}>Aadhaar number</Text>
                  <Text style={styles.itemSub}>Identity check</Text>
                </View>
              </View>
              <StatusPill verified={aadhaarVerified} />
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryBtn, photoVerified && styles.disabledBtn]}
              onPress={onVerifyPhoto}
              disabled={photoVerified}
            >
              <Camera color="#fff" size={17} />
              <Text style={styles.primaryText}>{photoVerified ? 'Photo Verified' : 'Verify Photo'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, aadhaarVerified && styles.secondaryDisabledBtn]}
              onPress={onVerifyAadhaar}
              disabled={aadhaarVerified}
            >
              <Fingerprint color={aadhaarVerified ? '#aaa' : '#333'} size={17} />
              <Text style={[styles.secondaryText, aadhaarVerified && styles.secondaryDisabledText]}>
                {aadhaarVerified ? 'Aadhaar Verified' : 'Verify Aadhaar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.laterBtn} onPress={onClose}>
              <Text style={styles.laterText}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  headerTextWrap: { flex: 1 },
  eyebrow: {
    color: '#D20236',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    marginTop: 7,
    color: '#111',
    fontSize: 22,
    fontWeight: '900',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#f6f6f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  statusRow: {
    minHeight: 76,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIconBox: { backgroundColor: '#fdf2f5' },
  aadhaarIconBox: { backgroundColor: '#eff6ff' },
  itemTitle: { color: '#111', fontSize: 15, fontWeight: '800' },
  itemSub: { marginTop: 3, color: '#777', fontSize: 12, fontWeight: '500' },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusVerified: { backgroundColor: '#e9f8ee' },
  statusPending: { backgroundColor: '#fff7e6' },
  statusText: { fontSize: 11, fontWeight: '800' },
  statusVerifiedText: { color: '#1a7f37' },
  statusPendingText: { color: '#9a6700' },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 18,
    gap: 10,
  },
  primaryBtn: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#D20236',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  disabledBtn: { backgroundColor: '#d7d7d7' },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  secondaryBtn: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryDisabledBtn: { backgroundColor: '#f3f3f3' },
  secondaryText: { color: '#333', fontSize: 15, fontWeight: '800' },
  secondaryDisabledText: { color: '#aaa' },
  laterBtn: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterText: { color: '#666', fontSize: 14, fontWeight: '800' },
});
