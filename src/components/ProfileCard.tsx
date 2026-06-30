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
        <TouchableOpacity style={styles.linkBtn} onPress={onView}>
          <Eye color="#666" size={15} />
          <Text style={styles.linkText}>View</Text>
        </TouchableOpacity>
        {showInterested && (
          <TouchableOpacity style={styles.linkBtn} onPress={onInterested}>
            <Heart
              color={profile._interested || profile.isInterested ? '#D20236' : '#666'}
              fill={profile._interested || profile.isInterested ? '#D20236' : 'transparent'}
              size={15}
            />
            <Text style={[styles.linkText, (profile._interested || profile.isInterested) && { color: '#D20236' }]}>
              Interested
            </Text>
          </TouchableOpacity>
        )}
        {onRemove && (
          <TouchableOpacity style={styles.linkBtn} onPress={onRemove}>
            <Text style={styles.removeText}>{removeLabel || 'Remove from Interested'}</Text>
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
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: { backgroundColor: '#eee' },
  matchBadge: {
    backgroundColor: '#1a7f37',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: -10,
  },
  matchText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 16, fontWeight: '700', color: '#000' },
  detail: { fontSize: 13, color: '#666', marginTop: 2 },
  actionBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 10,
  },
  actionBtnDisabled: { backgroundColor: '#e69aab' },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  linkText: { fontSize: 13, color: '#666' },
  removeText: { fontSize: 13, color: '#D20236', fontWeight: '600' },
});