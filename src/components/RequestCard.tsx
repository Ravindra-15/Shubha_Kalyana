import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { BadgeCheck } from 'lucide-react-native';

type Props = {
  profile: any;
  onAccept?: () => void;
  onReject?: () => void;
  onView?: () => void;
};

export default function RequestCard({ profile, onAccept, onReject, onView }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        {profile.image ? (
          <Image source={{ uri: profile.image }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholder]} />
        )}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {profile.name}{profile.age ? `, ${profile.age}` : ''}
            </Text>
            <BadgeCheck color="#FFFFFF" size={16} fill="#D20236" />
          </View>
          <Text style={styles.detail}>
            {[profile.caste, profile.profession].filter(Boolean).join('  |  ') || 'Not specified'}
          </Text>
        </View>
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.85}>
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectBtn} onPress={onReject} activeOpacity={0.85}>
          <Text style={styles.rejectText}>Reject</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onView} style={styles.viewWrap}>
        <Text style={styles.viewText}>View Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 12 },
  placeholder: { backgroundColor: '#eee' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 16, fontWeight: '700', color: '#000' },
  detail: { fontSize: 13, color: '#888', marginTop: 3 },
  btnRow: { flexDirection: 'row', gap: 12 },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#1a7f37',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rejectText: { color: '#333', fontSize: 14, fontWeight: '700' },
  viewWrap: { alignItems: 'center', marginTop: 12 },
  viewText: { fontSize: 14, color: '#333', fontWeight: '600' },
});