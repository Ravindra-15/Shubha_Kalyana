import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { BadgeCheck } from 'lucide-react-native';
import TopCroppedImage from './TopCroppedImage';
import { cardFrame, NameCardDetails } from './nameCard';

const IMAGE_HEIGHT = 220;

type Props = {
  profile: any;
  onView?: () => void;
  // Fixed width for horizontal-scroll usage (Home preview rows). Omit to
  // stretch to the full width of the parent (vertical list screens).
  width?: number;
  style?: StyleProp<ViewStyle>;
};

// Client name-card spec: whole card opens the profile; photo on top, then
// Name / "age yrs, profession" / caste / location. With a fixed width the
// photo follows the doc's 3.6cm x 3.8cm proportions, so every Home row
// card's photo frame is the same size.
export default function ProfileCard({ profile, onView, width, style }: Props) {
  const frame = width ? cardFrame(width) : null;
  return (
    <TouchableOpacity
      style={[styles.card, width ? { width } : null, style]}
      onPress={onView}
      activeOpacity={0.9}
    >
      <View style={styles.imageWrap}>
        {profile.image ? (
          <TopCroppedImage
            uri={profile.image}
            style={[styles.image, { height: frame ? frame.photoHeight : IMAGE_HEIGHT }]}
          />
        ) : (
          <View
            style={[
              styles.image,
              styles.imagePlaceholder,
              { height: frame ? frame.photoHeight : IMAGE_HEIGHT },
            ]}
          />
        )}
        {profile.verified && (
          <View style={styles.verifiedTag}>
            <BadgeCheck color="#fff" size={13} fill="#1a7f37" />
            <Text style={styles.verifiedText}>Verified</Text>
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

        <View style={styles.viewBtn}>
          <Text style={styles.viewText}>View Profile</Text>
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
});
