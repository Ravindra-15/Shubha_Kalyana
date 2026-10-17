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
import { BadgeCheck, Trash2 } from 'lucide-react-native';
import TopCroppedImage from './TopCroppedImage';
import { cardFrame, NameCardDetails, STACKED_PHOTO_SIZE } from './nameCard';

type Props = {
  profile: any;
  onView?: () => void;
  // Fixed width for horizontal-scroll usage (Home preview rows). Omit to
  // stretch to the full width of the parent (vertical list screens).
  width?: number;
  style?: StyleProp<ViewStyle>;
  // Interested screen only: shows a trash button next to View Profile
  // (same as the web app's interested cards).
  onRemove?: () => void;
  removing?: boolean;
  // One-card-per-swipe lists: the card fills its row's height and the photo
  // takes the extra space (details/button keep their size).
  fill?: boolean;
};

// Client name-card spec: whole card opens the profile; photo on top, then
// Name / "age yrs, profession" / caste / location. With a fixed width the
// photo follows the doc's 3.6cm x 3.8cm proportions, so every Home row
// card's photo frame is the same size.
export default function ProfileCard({
  profile,
  onView,
  width,
  style,
  onRemove,
  removing = false,
  fill = false,
}: Props) {
  const frame = width ? cardFrame(width) : null;
  const photoSize = fill
    ? styles.fillPhoto
    : frame
      ? { height: frame.photoHeight }
      : STACKED_PHOTO_SIZE;
  return (
    <TouchableOpacity
      style={[styles.card, width ? { width } : null, fill && styles.fillCard, style]}
      onPress={onView}
      activeOpacity={0.9}
    >
      <View style={[styles.imageWrap, fill && styles.fillImageWrap]}>
        {profile.image ? (
          <TopCroppedImage
            uri={profile.image}
            style={[styles.image, photoSize]}
          />
        ) : (
          <View
            style={[
              styles.image,
              styles.imagePlaceholder,
              photoSize,
            ]}
          />
        )}
        {profile.verified && (
          <View style={styles.verifiedTag}>
            <BadgeCheck color="#fff" size={20} fill="#1a7f37" />
          </View>
        )}
        {profile.matchPercentage != null && (
          <View style={styles.matchBadge}>
            <Text style={styles.matchText}>{profile.matchPercentage}% Match</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <NameCardDetails profile={profile} />

        {/* Row layout only with the trash button -- otherwise View Profile
            stays a plain full-width button exactly as before. */}
        <View style={onRemove ? styles.actionRow : undefined}>
          <View style={[styles.viewBtn, onRemove && styles.viewBtnWithRemove]}>
            <Text style={styles.viewText}>View Profile</Text>
          </View>
          {onRemove && (
            <TouchableOpacity
              style={[styles.removeBtn, removing && styles.removeBtnDisabled]}
              onPress={onRemove}
              disabled={removing}
              activeOpacity={0.7}
              accessibilityLabel={`Remove ${profile.name || 'profile'} from interested`}
            >
              {removing ? (
                <ActivityIndicator size="small" color="#dc2626" />
              ) : (
                <Trash2 color="#dc2626" size={18} />
              )}
            </TouchableOpacity>
          )}
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
  fillCard: { flex: 1 },
  fillImageWrap: { flex: 1, minHeight: 240 },
  fillPhoto: { flex: 1 },
  image: { width: '100%', backgroundColor: '#eee' },
  imagePlaceholder: { backgroundColor: '#eee' },
  // Tick only on cards; the full "Verified Profile" label is on the details screen.
  verifiedTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 1,
  },
  matchBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: '#1a7f37',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  matchText: { color: '#fff', fontSize: 12, fontFamily: 'Outfit-Bold' },
  info: { padding: 12 },
  viewBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    marginTop: 8,
  },
  viewText: { color: '#fff', fontSize: 14, fontFamily: 'Outfit-Bold' },
  actionRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  viewBtnWithRemove: { flex: 1 },
  removeBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fee2e2',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnDisabled: { opacity: 0.5 },
});
