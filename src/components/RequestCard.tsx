import React from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { BadgeCheck } from 'lucide-react-native';
import { resolveImageUrl } from '../utils/imageUrl';

type Props = {
  profile: any;
  onAccept?: () => void;
  onReject?: () => void;
  onView?: () => void;
  accepting?: boolean;
  rejecting?: boolean;
  metaLabel?: string;
};

export default function RequestCard({
  profile,
  onAccept,
  onReject,
  onView,
  accepting = false,
  rejecting = false,
  metaLabel,
}: Props) {
  const busy = accepting || rejecting;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        {profile.image ? (
          <Image source={{ uri: resolveImageUrl(profile.image) }} style={styles.avatar} />
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
          {metaLabel ? <Text style={styles.meta}>{metaLabel}</Text> : null}
        </View>
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.acceptBtn, busy && styles.disabledBtn]}
          onPress={onAccept}
          activeOpacity={0.85}
          disabled={busy}
        >
          {accepting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.acceptText}>Accept</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rejectBtn, busy && styles.disabledBtn]}
          onPress={onReject}
          activeOpacity={0.85}
          disabled={busy}
        >
          {rejecting ? (
            <ActivityIndicator color="#333" size="small" />
          ) : (
            <Text style={styles.rejectText}>Reject</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onView} style={styles.viewWrap} disabled={busy}>
        <Text style={styles.viewText}>View Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 8,
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
  name: { fontSize: 16, fontFamily: 'Outfit-Bold', color: '#000' },
  detail: { fontSize: 13, color: '#888', marginTop: 3 },
  meta: {
    fontSize: 11,
    color: '#D20236',
    fontFamily: 'Outfit-Bold',
    marginTop: 5,
    textTransform: 'uppercase',
  },
  btnRow: { flexDirection: 'row', gap: 12 },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#1a7f37',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabledBtn: { opacity: 0.65 },
  acceptText: { color: '#fff', fontSize: 14, fontFamily: 'Outfit-Bold' },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rejectText: { color: '#333', fontSize: 14, fontFamily: 'Outfit-Bold' },
  viewWrap: { alignItems: 'center', marginTop: 12 },
  viewText: { fontSize: 14, color: '#333', fontFamily: 'Outfit-SemiBold' },
});
