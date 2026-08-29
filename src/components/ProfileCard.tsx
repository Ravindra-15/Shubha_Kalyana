import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { BadgeCheck, Eye, Heart } from 'lucide-react-native';

type Props = {
  profile: any;
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
  onView?: () => void;
  onInterested?: () => void;
  showInterested?: boolean;
  onRemove?: () => void;        // "Remove from Interested"
  removeLabel?: string;
};
export default function ProfileCard({
  profile,
  actionLabel = 'Send Request',
  actionDisabled = false,
  onAction,
  onView,
  onInterested,
  showInterested = true,
  onRemove,
  removeLabel,
}: Props) {
  const profileIsInterested = Boolean(profile._interested || profile.isInterested);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatarWrap}>
          {profile.image ? (
            <Image source={{ uri: profile.image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]} />
          )}
          {profile.matchPercentage != null && (
            <View style={styles.matchBadge}>
              <Text style={styles.matchText}>{profile.matchPercentage}% Match</Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {profile.name}{profile.age ? `, ${profile.age}` : ''}
            </Text>
            {profile.verified && <BadgeCheck color="#FFFFFF" size={16} fill="#D20236" />}
          </View>
          <Text style={styles.detail}>{profile.profession || 'Not specified'}</Text>
          <Text style={styles.detail}>{profile.location}</Text>

          <TouchableOpacity
            style={[styles.actionBtn, actionDisabled && styles.actionBtnDisabled]}
            onPress={onAction}
            disabled={actionDisabled}
            activeOpacity={0.85}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>

<View style={styles.bottomRow}>
  {showInterested && (
    <TouchableOpacity style={styles.linkBtn} onPress={onInterested}>
      <Heart
        color={profileIsInterested ? '#D20236' : '#666'}
        fill={profileIsInterested ? '#D20236' : 'transparent'}
        size={15}
      />
      <Text
        style={[
          styles.linkText,
          profileIsInterested && { color: '#D20236' },
        ]}
      >
        {profileIsInterested ? 'Interested' : 'Interest'}
      </Text>
    </TouchableOpacity>
  )}

  <TouchableOpacity style={styles.linkBtn} onPress={onView}>
    <Eye color="#666" size={15} />
    <Text style={styles.linkText}>View</Text>
  </TouchableOpacity>

  {onRemove && (
<TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
      <Text style={styles.removeText}>
        {removeLabel || 'Remove from Interested'}
      </Text>
    </TouchableOpacity>
  )}
</View>
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
  topRow: { flexDirection: 'row' },
  avatarWrap: { alignItems: 'center', marginRight: 14 },
  avatar: { width: 86, height: 86, borderRadius: 43 },
  avatarPlaceholder: { backgroundColor: '#eee' },
  matchBadge: {
    backgroundColor: '#1a7f37',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginTop: -10,
  },
  matchText: { color: '#fff', fontSize: 13, fontFamily: 'Outfit' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 16, fontFamily: 'Outfit-Bold', color: '#000' },
  detail: { fontSize: 15, color: '#666', marginTop: 2 },
  actionBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 10,
  },
  actionBtnDisabled: { backgroundColor: '#e69aab' },
  actionText: { color: '#fff', fontSize: 14, fontFamily: 'Outfit-Bold' },
bottomRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 8,
  marginLeft: 100,
},
linkBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 5,
  marginRight: 20,
},
removeBtn: {
  marginLeft: 'auto',
  flexShrink: 1,
},
  linkText: { fontSize: 14, color: '#666' },
  removeText: { fontSize: 12, color: '#D20236', fontFamily: 'Outfit-SemiBold' },
});
