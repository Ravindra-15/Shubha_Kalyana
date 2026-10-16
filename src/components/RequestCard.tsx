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
import { cardFrame, NameCardDetails, STACKED_PHOTO_SIZE } from './nameCard';

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

// Same name card / frame as ProfileCard (client spec), plus Accept/Reject.
// Tapping anywhere outside those two buttons opens the profile.
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
  const frame = width ? cardFrame(width) : null;
  const photoSize = frame ? { height: frame.photoHeight } : STACKED_PHOTO_SIZE;

  return (
    <TouchableOpacity
      style={[styles.card, width ? { width } : null, style]}
      onPress={onView}
      activeOpacity={0.9}
      disabled={busy}
    >
      <View style={styles.imageWrap}>
        {profile.image ? (
          <TopCroppedImage
            uri={resolveImageUrl(profile.image)}
            style={[styles.image, photoSize]}
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder, photoSize]} />
        )}
        {profile.verified && (
          <View style={styles.verifiedTag}>
            <BadgeCheck color="#fff" size={13} fill="#1a7f37" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
        {metaLabel ? (
          <View style={styles.metaBadge}>
            <Text style={styles.metaText}>{metaLabel}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.info}>
        <NameCardDetails profile={profile} />

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
      </View>
    </TouchableOpacity>
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
  image: { width: '100%', backgroundColor: '#eee' },
  imagePlaceholder: { backgroundColor: '#eee' },
  verifiedTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1a7f37',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedText: { color: '#fff', fontSize: 11, fontFamily: 'Outfit-Bold' },
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
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#1a7f37',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  disabledBtn: { opacity: 0.65 },
  acceptText: { color: '#fff', fontSize: 13, fontFamily: 'Outfit-Bold' },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  rejectText: { color: '#333', fontSize: 13, fontFamily: 'Outfit-Bold' },
});
