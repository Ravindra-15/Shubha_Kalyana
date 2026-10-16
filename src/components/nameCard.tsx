import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Client spec (in cm): card frame 6.5 tall x 3.8 wide, photo 3.6 tall x 3.8
// wide, the rest for the name card details.
const CARD_RATIO = 6.5 / 3.8;
const PHOTO_RATIO = 3.6 / 3.8;

export const cardFrame = (width: number) => ({
  cardHeight: Math.round(width * CARD_RATIO),
  photoHeight: Math.round(width * PHOTO_RATIO),
});

const hasText = (v: any) => typeof v === 'string' && v.trim() && v !== 'blur';

// Name / "32 yrs, Software Engineer" / caste / location -- in that order.
export function NameCardDetails({ profile }: { profile: any }) {
  const ageLine = [
    profile.age ? `${profile.age} yrs` : '',
    hasText(profile.profession) ? profile.profession : '',
  ]
    .filter(Boolean)
    .join(', ');
  const location =
    hasText(profile.location) && profile.location !== 'Location not added'
      ? profile.location
      : '';

  return (
    <View>
      <Text style={styles.name} numberOfLines={1}>
        {profile.name}
      </Text>
      {!!ageLine && (
        <Text style={styles.detail} numberOfLines={1}>
          {ageLine}
        </Text>
      )}
      {hasText(profile.caste) && (
        <Text style={styles.detail} numberOfLines={1}>
          {profile.caste}
        </Text>
      )}
      {!!location && (
        <Text style={styles.detail} numberOfLines={1}>
          {location}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 16, fontFamily: 'Outfit-Bold', color: '#000' },
  detail: { fontSize: 13, color: '#555', marginTop: 2, fontFamily: 'Outfit-Medium' },
});
