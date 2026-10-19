import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowLeftRight, Check } from 'lucide-react-native';
import { resolveImageUrl } from '../utils/imageUrl';

type MatchField = {
  key: string;
  label: string;
  // null = viewer never set a preference for this field.
  matched: boolean | null;
  hasPreference: boolean;
  value: string;
};

type Props = {
  myPhoto?: string;
  theirPhoto?: string;
  theirName?: string;
  fields: MatchField[];
  matchedCount: number;
  totalCount: number;
};

// Mirrors the idea behind Shaadi.com's "You and Her" matching card on their
// View Profile screen (two avatars + a swap arrow, then a per-field
// matched/unmatched breakdown) -- same concept, themed to this app's red
// brand palette instead of copying their purple styling.
export default function MatchBreakdownSection({
  myPhoto,
  theirPhoto,
  theirName,
  fields,
  matchedCount,
  totalCount,
}: Props) {
  const hasAnyPreference = fields.some((field) => field.hasPreference);
  if (!hasAnyPreference) return null;
  const matchedFields = fields.filter((field) => field.matched === true);

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#FF0004', '#E7000B', '#E60076']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle} numberOfLines={1}>
          You &amp; {theirName || 'Them'}
        </Text>
        <View style={styles.avatarRow}>
          <View style={styles.avatarWrap}>
            {myPhoto ? (
              <Image source={{ uri: resolveImageUrl(myPhoto) }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
          </View>
          <View style={styles.arrowCircle}>
            <ArrowLeftRight color="#D20236" size={18} />
          </View>
          <View style={styles.avatarWrap}>
            {theirPhoto ? (
              <Image source={{ uri: resolveImageUrl(theirPhoto) }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.matchCountText}>
          You match {matchedCount}/{totalCount}
        </Text>

        {/* Client decision: list only the points that match. Unmatched and
            not-set fields still count toward the total above. */}
        {matchedFields.length === 0 ? (
          <Text style={styles.emptyText}>No matching preferences yet.</Text>
        ) : (
          matchedFields.map((field, idx) => (
            <View
              key={field.key}
              style={[
                styles.fieldRow,
                idx === matchedFields.length - 1 && styles.fieldRowLast,
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <Text style={styles.fieldValue} numberOfLines={1}>
                  {field.value}
                </Text>
              </View>
              <View style={[styles.statusCircle, styles.statusMatched]}>
                <Check color="#1a7f37" size={16} strokeWidth={3} />
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  header: { paddingVertical: 24, paddingHorizontal: 16, alignItems: 'center' },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Outfit-Bold',
    marginBottom: 16,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2.5,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: { backgroundColor: 'rgba(255,255,255,0.3)' },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 18 },
  matchCountText: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: '#000',
    marginBottom: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  fieldRowLast: { borderBottomWidth: 0 },
  fieldLabel: { fontSize: 12, color: '#888', fontFamily: 'Outfit-Medium' },
  fieldValue: { fontSize: 15, color: '#000', fontFamily: 'Outfit-SemiBold', marginTop: 2 },
  statusCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  statusMatched: { backgroundColor: '#e8f6ec' },
  emptyText: { fontSize: 14, color: '#888', fontFamily: 'Outfit-Medium', paddingVertical: 6 },
});
