import React from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { BadgeCheck } from 'lucide-react-native';
import { resolveImageUrl } from '../utils/imageUrl';
import TopCroppedImage from './TopCroppedImage';

const IMAGE_HEIGHT = 220;

type Props = {
  profile: any;
  onAccept?: () => void;
  onReject?: () => void;
  onView?: () => void;
  accepting?: boolean;
  rejecting?: boolean;
  metaLabel?: string;
  // Fixed width for horizontal-scroll usage (Home preview rows). Omit to
  // stretch to the full width of the parent (vertical list screens).
  width?: number;
  style?: StyleProp<ViewStyle>;
};

export default function RequestCard({
  profile,
  onAccept,
  onReject,
  onView,
  accepting = false,
  rejecting = false,
  metaLabel,
  width,
  style,
}: Props) {
  const busy = accepting || rejecting;

  return (
    <View style={[styles.card, width ? { width } : null, style]}>
      <View style={styles.imageWrap}>
        {profile.image ? (
          <TopCroppedImage
            uri={resolveImageUrl(profile.image)}
            style={styles.image}
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
        {metaLabel ? (
          <View style={styles.metaBadge}>
            <Text style={styles.metaText}>{metaLabel}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {profile.name}
            {profile.age ? `, ${profile.age}` : ''}
          </Text>
          <BadgeCheck color="#FFFFFF" size={16} fill="#D20236" />
        </View>
        <Text style={styles.detail} numberOfLines={1}>
          {[profile.caste, profile.profession].filter(Boolean).join('  |  ') ||
            'Not specified'}
        </Text>

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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: IMAGE_HEIGHT, backgroundColor: '#eee' },
  imagePlaceholder: { backgroundColor: '#eee' },
  metaBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: '#D20236',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  metaText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
  },
  info: { padding: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 16, fontFamily: 'Outfit-Bold', color: '#000', flexShrink: 1 },
  detail: { fontSize: 13, color: '#888', marginTop: 3 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#1a7f37',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  disabledBtn: { opacity: 0.65 },
  acceptText: { color: '#fff', fontSize: 13, fontFamily: 'Outfit-Bold' },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  rejectText: { color: '#333', fontSize: 13, fontFamily: 'Outfit-Bold' },
  viewWrap: { alignItems: 'center', marginTop: 10 },
  viewText: { fontSize: 14, color: '#333', fontFamily: 'Outfit-SemiBold' },
});
