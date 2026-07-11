import React, { useState, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft, Settings, BadgeCheck, Edit3, Bookmark, CreditCard, Download, Heart, Shield, ChevronRight, Crown,
} from 'lucide-react-native';
import apiClient from '../../api/client';
import { getActiveMembership } from '../../api/membership';
import { resolveImageUrl } from '../../utils/imageUrl';


const getAge = (dob?: string) => {
  if (!dob) return null;
  const b = new Date(dob);
  if (isNaN(b.getTime())) return null;
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return a;
};

export default function ProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const [profileRes, membershipRes] = await Promise.all([
        apiClient.get('/user/me/profile'),
        getActiveMembership(),
      ]);
      setUser(profileRes.data?.data?.user);
      setProfile(profileRes.data?.data?.profile);
      setMembership(membershipRes);
    } catch {
      // keep screen usable even if one call fails
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#D20236" style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  const basic = profile?.basicInfo || {};
  const name = [basic.firstName || user?.firstName, basic.lastName || user?.lastName]
    .filter(Boolean).join(' ');
  const age = getAge(basic.dob);
  const photo = profile?.photos?.find((p: any) => p.isProfilePhoto)?.url || profile?.photos?.[0]?.url || '';
  const verified = profile?.documents?.verificationStatus === 'VERIFIED';
  const location = [profile?.address?.current?.city, profile?.address?.current?.state]
    .filter(Boolean).join(', ');
  const completion = profile?.completionPercentage || 0;

  const hasActivePlan = Boolean(membership?.planSnapshot?.planName);
  const planName = membership?.planSnapshot?.planName || 'Free Plan';
  const accessLimit = membership?.planSnapshot?.accessLimit || 0;
  const used = membership?.usage?.profileUnlocksUsed || 0;
  const remaining = Math.max(accessLimit - used, 0);

  const quickActions = [
    { label: 'Edit Profile', Icon: Edit3, onPress: () => navigation.navigate('EditProfile') },
    { label: 'Saved Profiles', Icon: Bookmark, onPress: () => navigation.navigate('SavedProfiles') },
    { label: 'Payment History', Icon: CreditCard, onPress: () => navigation.navigate('PaymentHistory') },
    { label: 'Download Receipts', Icon: Download, onPress: () => navigation.navigate('PaymentHistory') },
    { label: 'Interests', Icon: Heart, onPress: () => navigation.navigate('AllInterested', { pushed: true }) },
    { label: 'Privacy Settings', Icon: Shield, onPress: () => navigation.navigate('PrivacySettings') },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Settings color="#000" size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <View style={styles.content}>
          <View style={styles.identityRow}>
            <View style={styles.avatarRing}>
              {photo ? (
                <Image source={{ uri: resolveImageUrl(photo) }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]} />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{name}{age ? `, ${age}` : ''}</Text>
                {verified && <BadgeCheck color="#ffffff" size={16} fill="#D20236" style={{ marginLeft: 4 }} />}
              </View>
              <Text style={styles.meta}>{profile?.employment?.designation || 'Profession not added'}</Text>
              {!!location && <Text style={styles.meta}>{location}</Text>}
              {!!user?.mobile && <Text style={styles.meta}>+91 {user.mobile}</Text>}
            </View>
          </View>

          {completion < 100 ? (
            <View style={styles.completionBox}>
              <View style={styles.completionRow}>
                <Text style={styles.completionLabel}>Profile Completion</Text>
                <Text style={styles.completionPercent}>{completion}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${completion}%` }]} />
              </View>
              <Text style={styles.completionHint}>Complete your profile to improve match visibility</Text>
              <TouchableOpacity style={styles.completeBtn} onPress={() => navigation.navigate('EditProfile')}>
                <Text style={styles.completeBtnText}>Complete Now</Text>
                <ChevronRight color="#D20236" size={16} />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.planBox}>
            <View style={styles.planRow}>
              <Crown color="#D20236" size={18} />
              <Text style={styles.planName}>{planName}</Text>
            </View>
            {hasActivePlan ? (
              <>
                {membership?.endDate && (
                  <Text style={styles.planHint}>
                    Valid until {new Date(membership.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                )}
                {accessLimit > 0 && (
                  <>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${Math.min((used / accessLimit) * 100, 100)}%` }]} />
                    </View>
                    <Text style={styles.planHint}>{remaining} profiles Remaining</Text>
                  </>
                )}
              </>
            ) : (
              <>
                <Text style={styles.planHint}>Upgrade to unlock premium access</Text>
                <TouchableOpacity style={styles.upgradeBtn} onPress={() => navigation.navigate('Plans')}>
                  <Text style={styles.upgradeBtnText}>Upgrade Now</Text>
                  <ChevronRight color="#fff" size={16} />
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.quickTitle}>Quick Actions</Text>
          <View style={styles.actionsBox}>
            {quickActions.map(({ label, Icon, onPress }, i) => (
              <TouchableOpacity
                key={label}
                style={[styles.actionRow, i === quickActions.length - 1 && { borderBottomWidth: 0 }]}
                onPress={onPress}
              >
                <Icon color="#333" size={18} />
                <Text style={styles.actionLabel}>{label}</Text>
                <ChevronRight color="#ccc" size={18} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  content: { flex: 1, paddingHorizontal: 16 },
  identityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 18 },
  avatarRing: {
    width: 70, height: 70, borderRadius: 35,
    borderWidth: 2, borderColor: '#D20236',
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: { width: 62, height: 62, borderRadius: 31 },
  avatarPlaceholder: { backgroundColor: '#eee' },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 17, fontWeight: '700', color: '#000' },
  meta: { fontSize: 13, color: '#777', marginTop: 2 },
  completionBox: { backgroundColor: '#fdf2f5', borderRadius: 16, padding: 18, marginBottom: 16 },
  completionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  completionLabel: { fontSize: 14, fontWeight: '700', color: '#000' },
  completionPercent: { fontSize: 14, fontWeight: '700', color: '#D20236' },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: '#f0d0d8', marginBottom: 10 },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: '#D20236' },
  completionHint: { fontSize: 12, color: '#888', marginBottom: 12 },
  completeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  completeBtnText: { fontSize: 14, fontWeight: '700', color: '#D20236' },
  planBox: { backgroundColor: '#f7f7f7', borderRadius: 16, padding: 18, marginBottom: 22 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  planName: { fontSize: 15, fontWeight: '700', color: '#000' },
  planHint: { fontSize: 12, color: '#888', marginBottom: 10 },
  upgradeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#D20236', borderRadius: 8, paddingVertical: 12,
  },
  upgradeBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  quickTitle: { fontSize: 14, color: '#888', fontWeight: '700', marginBottom: 10, marginTop: 4 },
  actionsBox: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f0f0f0', marginBottom: 24 },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  actionLabel: { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
});