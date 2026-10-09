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

const IMAGE_HEIGHT = 220;

type Props = {
  profile: any;
  onView?: () => void;
  // Fixed width for horizontal-scroll usage (Home preview rows). Omit to
  // stretch to the full width of the parent (vertical list screens).
  width?: number;
  style?: StyleProp<ViewStyle>;
};

export default function ProfileCard({ profile, onView, width, style }: Props) {
  return (
    <View style={[styles.card, width ? { width } : null, style]}>
      <View style={styles.imageWrap}>
        {profile.image ? (
          <TopCroppedImage uri={profile.image} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
        {profile.matchPercentage != null && (
          <View style={styles.matchBadge}>
            <Text style={styles.matchText}>{profile.matchPercentage}% Match</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {profile.name}
            {profile.age ? `, ${profile.age}` : ''}
          </Text>
          {profile.verified && (
            <BadgeCheck color="#FFFFFF" size={16} fill="#D20236" />
          )}
        </View>
        <Text style={styles.detail} numberOfLines={1}>
          {profile.profession || 'Not specified'}
        </Text>
        <Text style={styles.detail} numberOfLines={1}>
          {profile.location}
        </Text>

        <TouchableOpacity
          style={styles.viewBtn}
          onPress={onView}
          activeOpacity={0.85}
        >
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
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 16, fontFamily: 'Outfit-Bold', color: '#000', flexShrink: 1 },
  detail: { fontSize: 13, color: '#666', marginTop: 2 },
  viewBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 10,
  },
  viewText: { color: '#fff', fontSize: 14, fontFamily: 'Outfit-Bold' },
});
