import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../api/client';
import WelcomePopup from './WelcomePopup';
import { Crown, ArrowRight, Pencil, User as UserIcon } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getActiveMembership } from '../../api/membership';
import { ActivityIndicator } from 'react-native';
import ProfileCard from '../../components/ProfileCard';
import { Filter } from 'lucide-react-native';
import FilterModal, { Filters } from '../../components/FilterModal';
import RequestCard from '../../components/RequestCard';
import SocialLinks from '../../components/SocialLinks';
import { FlatList, Image, Dimensions } from 'react-native';
import { getPublicVendors } from '../../api/vendor';
import { resolveImageUrl } from '../../utils/imageUrl';
import { useFocusEffect } from '@react-navigation/native';
import { useInterestBadge } from '../../context/InterestBadgeContext';
import RequestSentModal from '../../components/RequestSentModal';
import UnlockAccessModal from '../../components/UnlockAccessModal';
import { getProfileAccess } from '../../api/membershipPayment';
import { getUnreadCount } from '../../api/notification';
import { isProfileFullyVerified, getProfileViewers } from '../../api/profile';
import { mapProfileViewer } from '../profile/ProfileViewersScreen';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

const SCREEN_WIDTH = Dimensions.get('window').width;
const VENDOR_CARD_WIDTH = SCREEN_WIDTH * 0.7;
const PROFILE_CARD_WIDTH = SCREEN_WIDTH * 0.62;
const REQUEST_CARD_WIDTH = SCREEN_WIDTH * 0.72;
export default function HomeScreen({ navigation }: any) {
  const { bumpInterestCount } = useInterestBadge();
  const [firstName, setFirstName] = useState('');
  const [gender, setGender] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [profileCode, setProfileCode] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [planName, setPlanName] = useState('Free Plan');
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [unlocksRemaining, setUnlocksRemaining] = useState(0);
  // "Premium Matches" = strict age+caste+never-married match AND the
  // candidate currently has an active plan; "New Matches" = the exact same
  // age+caste+never-married criteria but WITHOUT an active plan -- the two
  // are mutually exclusive (server enforces this via premiumOnly=true/false
  // on the same strictMatch query), matching Shaadi.com's split sections.
  const [premiumMatches, setPremiumMatches] = useState<any[]>([]);
  const [premiumTotal, setPremiumTotal] = useState(0);
  const [newMatches, setNewMatches] = useState<any[]>([]);
  const [newTotal, setNewTotal] = useState(0);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Filters | null>(null);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [interestedProfiles, setInterestedProfiles] = useState<any[]>([]);
  const [profileViewers, setProfileViewers] = useState<any[]>([]);
  const [profileViewersTotal, setProfileViewersTotal] = useState(0);
  const [vendors, setVendors] = useState<any[]>([]);
  const [sentModal, setSentModal] = useState<{ show: boolean; name?: string }>({
    show: false,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [accessPrompt, setAccessPrompt] = useState<{
    profileId: string;
    name?: string;
    access: any;
    action: 'send' | 'accept';
  } | null>(null);

  const showAccessRequired = async (
    profileId: string,
    name: string | undefined,
    action: 'send' | 'accept',
  ) => {
    const access = await getProfileAccess(profileId);
    setAccessPrompt({ profileId, name, action, access });
  };

  useFocusEffect(
    useCallback(() => {
      loadUser();
      loadPlan();
      loadMatches(activeFilters);
      loadReceivedRequests();
      loadInterested();
      loadProfileViewers();
      loadVendors();
      loadUnread();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFilters]),
  );

  const loadUnread = async () => {
    const count = await getUnreadCount();
    setUnreadCount(count);
  };
  // Home's Premium/New Matches rows only ever show profiles that match the
  // viewer's own age window + caste + never-married status -- not a ranking
  // preference, an actual filter (see buildProfileFilter's strictMatch
  // block server-side). Search/View All don't send strictMatch at all, so
  // they're unaffected. premiumOnly further splits that same strict set by
  // whether the candidate currently has an active plan.
  const fetchHomeMatches = async (premiumOnly: boolean, filters?: Filters | null) => {
    const params: any = { limit: 5, strictMatch: true, premiumOnly };
    if (filters) {
      params.minAge = filters.minAge;
      params.maxAge = filters.maxAge;
      if (filters.religion) params.religion = filters.religion;
      if (filters.caste?.length) params.caste = filters.caste;
      if (filters.subCaste?.length) params.subCaste = filters.subCaste;
      if (filters.maritalStatus) params.maritalStatus = filters.maritalStatus;
      if (filters.education?.length) params.education = filters.education;
      if (filters.profession?.length) params.profession = filters.profession;
      if (filters.preferredLocation?.length)
        params.preferredLocation = filters.preferredLocation;
      if (filters.district?.length) params.district = filters.district;
    }
    const res = await apiClient.get('/user/search', { params });
    return {
      profiles: res.data?.data?.profiles || [],
      total: res.data?.data?.pagination?.total || 0,
    };
  };

  const loadMatches = async (filters?: Filters | null) => {
    try {
      setLoadingMatches(true);
      const [premium, fresh] = await Promise.all([
        fetchHomeMatches(true, filters),
        fetchHomeMatches(false, filters),
      ]);
      setPremiumMatches(premium.profiles);
      setPremiumTotal(premium.total);
      setNewMatches(fresh.profiles);
      setNewTotal(fresh.total);
    } catch {
      setPremiumMatches([]);
      setPremiumTotal(0);
      setNewMatches([]);
      setNewTotal(0);
    } finally {
      setLoadingMatches(false);
    }
  };
  const getAgeFromDob = (dob?: string) => {
    if (!dob) return null;
    const b = new Date(dob);
    if (isNaN(b.getTime())) return null;
    const t = new Date();
    let a = t.getFullYear() - b.getFullYear();
    const m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
    return a;
  };

  const mapRequestToCard = (req: any) => {
    const basic = req.profile?.basicInfo || {};
    const photo =
      req.profile?.photos?.find((p: any) => p.isProfilePhoto)?.url ||
      req.profile?.photos?.[0]?.url ||
      '';
    return {
      requestId: req._id,
      profileId: req.profile?._id,
      name:
        [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ') ||
        'Profile',
      age: getAgeFromDob(basic.dob),
      caste: basic.customCasteName || basic.caste?.casteName || '',
      profession: req.profile?.employment?.designation || '',
      image: photo,
    };
  };

  const loadReceivedRequests = async () => {
    try {
      const res = await apiClient.get('/relationship/requests/received', {
        params: { status: 'PENDING', limit: 5 },
      });
      const items = res.data?.data?.requests || [];
      setReceivedRequests(items.map(mapRequestToCard));
    } catch {
      setReceivedRequests([]);
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      await apiClient.patch(`/relationship/requests/${requestId}/accept`);
      setReceivedRequests(prev => prev.filter(r => r.requestId !== requestId));
    } catch (err: any) {
      if (err?.response?.status === 402) {
        const req = receivedRequests.find(r => r.requestId === requestId);
        await showAccessRequired(req?.profileId, req?.name, 'accept');
        return;
      }
      Alert.alert('Error', err?.response?.data?.message || 'Could not accept');
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      await apiClient.patch(`/relationship/requests/${requestId}/reject`);
      setReceivedRequests(prev => prev.filter(r => r.requestId !== requestId));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not reject');
    }
  };

  const mapInterestToCard = (item: any) => {
    const basic = item.profile?.basicInfo || {};
    const photo =
      item.profile?.photos?.find((p: any) => p.isProfilePhoto)?.url ||
      item.profile?.photos?.[0]?.url ||
      '';
    const addr = item.profile?.address?.current || {};
    const matchPercentage =
      item.matchPercentage ??
      item.matchPercent ??
      item.profile?.matchPercentage ??
      item.profile?.matchPercent;
    return {
      profileId: item.profileId,
      userId: item.userId || item.user?._id,
      name:
        [item.user?.firstName, item.user?.lastName].filter(Boolean).join(' ') ||
        'Profile',
      age: getAgeFromDob(basic.dob),
      profession: item.profile?.employment?.designation || '',
      location:
        [
          addr.district,
          addr.state || addr.stateOrProvince,
          addr.country && addr.country !== 'India' ? addr.country : '',
        ]
          .filter(Boolean)
          .join(', ') || 'Location not added',
      image: photo,
      matchPercentage,
      matchPercent: matchPercentage,
      verified: Boolean(
        item.profile?.verified || isProfileFullyVerified(item.profile),
      ),
      bothHaveActivePlans: Boolean(item.bothHaveActivePlans),
    };
  };

  const loadInterested = async () => {
    try {
      const [intRes, sentRes, connRes] = await Promise.all([
        apiClient.get('/relationship/interests/me', { params: { limit: 5 } }),
        apiClient.get('/relationship/requests/sent', { params: { limit: 50 } }),
        apiClient.get('/relationship/connections/me', {
          params: { limit: 50 },
        }),
      ]);
      const items = intRes.data?.data?.interests || [];
      const sent = sentRes.data?.data?.requests || [];
      const conns =
        connRes.data?.data?.connections || connRes.data?.data?.items || [];
      // profileId → status (connection wins as ACCEPTED)
      const statusMap = new Map();
      sent
        .filter((r: any) => r.status === 'PENDING' || r.status === 'ACCEPTED')
        .forEach((r: any) =>
          statusMap.set(String(r.toProfileId || r.profile?._id), r.status),
        );
      conns.forEach((c: any) => {
        const pid = c.profile?._id || c.profileId;
        if (pid) statusMap.set(String(pid), 'ACCEPTED');
      });
      const mapped = items.map((item: any) => {
        const card = mapInterestToCard(item);
        return {
          ...card,
          requestStatus: statusMap.get(String(card.profileId)) || null,
        };
      });
      setInterestedProfiles(mapped);
    } catch {
      setInterestedProfiles([]);
    }
  };
  const loadProfileViewers = async () => {
    try {
      const res = await getProfileViewers({ limit: 5 });
      const viewers = res?.viewers || [];
      setProfileViewers(viewers.map(mapProfileViewer));
      setProfileViewersTotal(
        res?.profileViewersCount || res?.pagination?.total || 0,
      );
    } catch {
      setProfileViewers([]);
      setProfileViewersTotal(0);
    }
  };
  const loadVendors = async () => {
    const list = await getPublicVendors();
    // console.log('VENDORS:', JSON.stringify(list));
    setVendors(list);
  };

  const applyFilters = (filters: Filters | null) => {
    if (filters) {
      // Home only ever shows a handful of matches (limit: 5 above), so any
      // filter applied here now opens the full search screen with the same
      // filters instead of re-running the short Home list.
      navigation.navigate('AllMatches', { pushed: true, initialFilters: filters });
      return;
    }

    // Clearing filters (onApply(null)) keeps the existing Home behaviour.
    setActiveFilters(filters);
    loadMatches(filters);
  };

  const loadPlan = async () => {
    const membership = await getActiveMembership();
    // active paid membership has a plan name; otherwise Free
    const name =
      membership?.planSnapshot?.planName ||
      membership?.plan?.planName ||
      membership?.plan?.name ||
      membership?.planName;
    setPlanName(name || 'Free Plan');
    setHasActivePlan(Boolean(membership));

    const accessLimit = Number(membership?.planSnapshot?.accessLimit || 0);
    const unlocksUsed = Number(membership?.usage?.profileUnlocksUsed || 0);
    setUnlocksRemaining(Math.max(accessLimit - unlocksUsed, 0));
  };

  const loadUser = async () => {
    try {
      const res = await apiClient.get('/user/me/profile');
      const user = res.data?.data?.user;
      const profile = res.data?.data?.profile;
      const name = user?.firstName || '';
      setFirstName(name);
      setGender(profile?.basicInfo?.gender || '');
      const photo = profile?.photos?.find((p: any) => p.isProfilePhoto)?.url || '';
      setProfilePhoto(photo);
      setProfileCode(user?.profileCode || '');

      // show welcome popup once per user
      const userId = user?._id;
      if (userId) {
        const seen = await AsyncStorage.getItem(`welcomeSeen_${userId}`);
        if (!seen) {
          setShowWelcome(true);
          await AsyncStorage.setItem(`welcomeSeen_${userId}`, 'true');
        }
      }
    } catch {
      // ignore — header still renders
    }
  };

  const { refreshing, onRefresh } = usePullToRefresh(() =>
    Promise.all([
      loadUser(),
      loadPlan(),
      loadMatches(activeFilters),
      loadReceivedRequests(),
      loadInterested(),
      loadProfileViewers(),
      loadVendors(),
      loadUnread(),
    ]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <WelcomePopup
        visible={showWelcome}
        onClose={() => setShowWelcome(false)}
        userName={firstName}
      />
      <RequestSentModal
        visible={sentModal.show}
        name={sentModal.name}
        onClose={() => setSentModal({ show: false })}
        onContinueBrowsing={() => setSentModal({ show: false })}
        onViewSentRequests={() => {
          setSentModal({ show: false });
          navigation.navigate('SentRequests', { initialTab: 'Sent' });
        }}
      />

      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={applyFilters}
        initial={activeFilters || undefined}
        gender={gender}
      />

      <UnlockAccessModal
        visible={Boolean(accessPrompt)}
        variant="accept"
        action={accessPrompt?.action}
        name={accessPrompt?.name}
        access={accessPrompt?.access}
        onClose={() => setAccessPrompt(null)}
        onUpgrade={() => {
          const profileId = accessPrompt?.profileId;
          const profileName = accessPrompt?.name;
          setAccessPrompt(null);
          navigation.navigate(
            'Plans',
            profileId ? { profileId, profileName } : undefined,
          );
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#D20236']}
            tintColor="#D20236"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcome}>
              Welcome <Text style={styles.name}>{firstName || 'there'} !</Text>
            </Text>
            <Text style={styles.subtitle}>
              New verified matches are waiting for you
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bellWrap}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell color="#333" size={24} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Profile summary */}
        <View style={styles.profileSummary}>
          <View style={styles.profileAvatarWrap}>
            {profilePhoto ? (
              <Image
                source={{ uri: resolveImageUrl(profilePhoto) }}
                style={styles.profileAvatar}
              />
            ) : (
              <View style={[styles.profileAvatar, styles.profileAvatarPlaceholder]}>
                <UserIcon color="#D20236" size={34} />
              </View>
            )}
          </View>

          <View style={styles.profileSummaryInfo}>
            <Text style={styles.profileSummaryName} numberOfLines={1}>
              {firstName || 'there'}
            </Text>
            {!!profileCode && (
              <Text style={styles.profileSummaryCode} numberOfLines={1}>
                {profileCode}
              </Text>
            )}
            <View style={styles.profileSummaryPlanRow}>
              <Crown color="#D20236" size={13} />
              <Text style={styles.profileSummaryPlanText}>{planName}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.85}
          >
            <Pencil color="#D20236" size={14} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Plan card */}
        <LinearGradient
          colors={['#FF0004', '#E7000B', '#E60076']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planCard}
        >
          <View style={styles.planRow}>
            <Crown color="#fff" size={20} />
            <Text style={styles.planTitle}>{planName}</Text>
          </View>
          <Text style={styles.planSubtitle}>
            {hasActivePlan
              ? `Explore matches! You have ${unlocksRemaining} unlock${
                  unlocksRemaining === 1 ? '' : 's'
                } remaining`
              : 'Unlock full profile access and premium features'}
          </Text>
          <TouchableOpacity
            style={styles.upgradeBtn}
            activeOpacity={0.85}
            onPress={() =>
              hasActivePlan
                ? navigation.navigate('AllMatches', { pushed: true })
                : navigation.navigate('Plans')
            }
          >
            <Text style={styles.upgradeText}>
              {hasActivePlan ? 'Explore Now' : 'Upgrade Now'}
            </Text>
            <ArrowRight color="#E60076" size={18} />
          </TouchableOpacity>
        </LinearGradient>
        {/* Filter bar - hidden on Home screen */}
        <View style={[styles.filterBar, { display: 'none' }]}>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => {
              apiClient
                .get('/user/me/profile')
                .then(res =>
                  setGender(res.data?.data?.profile?.basicInfo?.gender || ''),
                )
                .catch(() => {});

              setShowFilter(true);
            }}
          >
            <Filter color="#333" size={20} />
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* Premium Matches -- strict age+caste+never-married match AND the
            candidate has an active plan. Hidden entirely when there's
            nothing in this bucket (no fallback to unmatched profiles). */}
        {loadingMatches || premiumMatches.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Premium Matches{premiumTotal > 0 ? ` (${premiumTotal})` : ''}
                </Text>
                <Text style={styles.sectionSub}>
                  Profiles matching your preferences
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('AllMatches', {
                    pushed: true,
                    strictMatch: true,
                    premiumOnly: true,
                    title: 'Premium Matches',
                  })
                }
              >
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>

            {loadingMatches ? (
              <ActivityIndicator color="#D20236" style={{ marginVertical: 20 }} />
            ) : (
              <FlatList
                data={premiumMatches}
                keyExtractor={p => p.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={PROFILE_CARD_WIDTH + 12}
                decelerationRate="fast"
                contentContainerStyle={{ paddingRight: 8, paddingTop: 4 }}
                renderItem={({ item: p }) => (
                  <ProfileCard
                    profile={p}
                    width={PROFILE_CARD_WIDTH}
                    style={{ marginRight: 12 }}
                    onView={() =>
                      navigation.navigate('ProfileDetail', { profileId: p.profileId })
                    }
                  />
                )}
              />
            )}
          </>
        ) : null}

        {/* New Matches -- same strict age+caste+never-married criteria as
            Premium Matches, but for candidates WITHOUT an active plan
            (mutually exclusive with Premium Matches above). */}
        {loadingMatches || newMatches.length > 0 ? (
          <>
            <View style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
              <View>
                <Text style={styles.sectionTitle}>
                  New Matches{newTotal > 0 ? ` (${newTotal})` : ''}
                </Text>
                <Text style={styles.sectionSub}>
                  Profiles matching your preferences
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('AllMatches', {
                    pushed: true,
                    strictMatch: true,
                    premiumOnly: false,
                    title: 'New Matches',
                  })
                }
              >
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>

            {loadingMatches ? (
              <ActivityIndicator color="#D20236" style={{ marginVertical: 20 }} />
            ) : (
              <FlatList
                data={newMatches}
                keyExtractor={p => p.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={PROFILE_CARD_WIDTH + 12}
                decelerationRate="fast"
                contentContainerStyle={{ paddingRight: 8, paddingTop: 4 }}
                renderItem={({ item: p }) => (
                  <ProfileCard
                    profile={p}
                    width={PROFILE_CARD_WIDTH}
                    style={{ marginRight: 12 }}
                    onView={() =>
                      navigation.navigate('ProfileDetail', { profileId: p.profileId })
                    }
                  />
                )}
              />
            )}
          </>
        ) : null}

        {/* Received Requests */}
        {receivedRequests.length > 0 && (
          <>
            <View style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
              <View>
                <Text style={styles.sectionTitle}>Received Requests</Text>
                <Text style={styles.sectionSub}>
                  Profiles matching your preferences
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Requests', { initialTab: 'Received' })
                }
              >
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={receivedRequests}
              keyExtractor={r => r.requestId}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={REQUEST_CARD_WIDTH + 12}
              decelerationRate="fast"
              contentContainerStyle={{ paddingRight: 8, paddingTop: 4 }}
              renderItem={({ item: r }) => (
                <RequestCard
                  profile={r}
                  width={REQUEST_CARD_WIDTH}
                  style={{ marginRight: 12 }}
                  onAccept={() => acceptRequest(r.requestId)}
                  onReject={() => rejectRequest(r.requestId)}
                  onView={() =>
                    navigation.navigate('ProfileDetail', {
                      profileId: r.profileId,
                    })
                  }
                />
              )}
            />
          </>
        )}

        {/* Interested Profiles */}
        {interestedProfiles.length > 0 && (
          <>
            <View style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
              <View>
                <Text style={styles.sectionTitle}>Interested Profiles</Text>
                <Text style={styles.sectionSub}>
                  Profiles matching your preferences
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('AllInterested', { pushed: true })
                }
              >
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={interestedProfiles}
              keyExtractor={p => p.profileId}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={PROFILE_CARD_WIDTH + 12}
              decelerationRate="fast"
              contentContainerStyle={{ paddingRight: 8, paddingTop: 4 }}
              renderItem={({ item: p }) => (
                <ProfileCard
                  profile={p}
                  width={PROFILE_CARD_WIDTH}
                  style={{ marginRight: 12 }}
                  onView={() =>
                    navigation.navigate('ProfileDetail', {
                      profileId: p.profileId,
                    })
                  }
                />
              )}
            />
          </>
        )}

        {/* Profile Viewers */}
        {profileViewers.length > 0 && (
          <>
            <View style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
              <View>
                <Text style={styles.sectionTitle}>
                  Profile Viewers
                  {profileViewersTotal > 0 ? ` (${profileViewersTotal})` : ''}
                </Text>
                <Text style={styles.sectionSub}>
                  People who viewed your profile
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('ProfileViewers')}
              >
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={profileViewers}
              keyExtractor={p => p.profileId}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={PROFILE_CARD_WIDTH + 12}
              decelerationRate="fast"
              contentContainerStyle={{ paddingRight: 8, paddingTop: 4 }}
              renderItem={({ item: p }) => (
                <ProfileCard
                  profile={p}
                  width={PROFILE_CARD_WIDTH}
                  style={{ marginRight: 12 }}
                  onView={() =>
                    navigation.navigate('ProfileDetail', { profileId: p.profileId })
                  }
                />
              )}
            />
          </>
        )}

        {/* Vendors */}
        {vendors.length > 0 && (
          <View style={styles.vendorSection}>
            <View style={styles.vendorHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Vendors</Text>
                <Text style={styles.sectionSub}>
                  Explore trusted wedding vendors
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('VendorList')}
              >
                <ArrowRight color="#D20236" size={22} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={vendors}
              keyExtractor={item => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={VENDOR_CARD_WIDTH + 14}
              decelerationRate="fast"
              contentContainerStyle={{ paddingRight: 20, paddingTop: 14 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.vendorCard} activeOpacity={0.9}>
                  {item.image?.url ? (
                    <Image
                      source={{ uri: resolveImageUrl(item.image.url) }}
                      style={styles.vendorImg}
                      onError={e =>
                        console.log(
                          'IMG ERR:',
                          resolveImageUrl(item.image.url),
                          e.nativeEvent,
                        )
                      }
                      onLoad={() => console.log('IMG OK:', item.image.url)}
                    />
                  ) : (
                    <View
                      style={[styles.vendorImg, styles.vendorPlaceholder]}
                    />
                  )}
                  <View style={styles.vendorOverlay}>
                    <Text style={styles.vendorName}>
                      {item.serviceCategory || item.vendorName}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        <SocialLinks />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { paddingHorizontal: 20, paddingBottom: 30 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    marginBottom: 20,
  },
  welcome: { fontSize: 24, fontFamily: 'Outfit-Bold', color: '#000' },
  name: { color: '#D20236' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  bellWrap: { padding: 4 },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 18,
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  profileAvatarWrap: { marginRight: 14 },
  profileAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2.5,
    borderColor: '#D20236',
  },
  profileAvatarPlaceholder: {
    backgroundColor: '#fce4ec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSummaryInfo: { flex: 1, minWidth: 0 },
  profileSummaryName: { fontSize: 18, fontFamily: 'Outfit-Bold', color: '#000' },
  profileSummaryCode: { fontSize: 12, color: '#888', marginTop: 3, fontFamily: 'Outfit-Medium' },
  profileSummaryPlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  profileSummaryPlanText: { fontSize: 12, color: '#666', fontFamily: 'Outfit-Medium' },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#D20236',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  editProfileText: { color: '#D20236', fontSize: 13, fontFamily: 'Outfit-Bold' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#D20236',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: 'Outfit-Bold' },
  planCard: { borderRadius: 16, padding: 18, marginBottom: 24 },
  planRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  planTitle: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Outfit-Bold',
    marginLeft: 8,
  },
  planSubtitle: {
    color: '#ffe0e6',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 18,
  },
  upgradeBtn: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  upgradeText: {
    color: '#E60076',
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
    marginRight: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  // Extra breathing room above a section that follows another card row
  // directly (no banner/spacer between them) -- without this, "Received
  // Requests" and "Interested Profiles" sat flush against the row above.
  sectionHeaderSpaced: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontFamily: 'Outfit-Bold', color: '#000' },
  sectionSub: { fontSize: 13, color: '#666', marginTop: 2 },
  viewAll: { fontSize: 14, color: '#D20236', fontFamily: 'Outfit-SemiBold' },
  empty: { textAlign: 'center', color: '#999', marginVertical: 20 },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterText: { fontSize: 14, color: '#333', fontFamily: 'Outfit-SemiBold' },
  vendorSection: { marginTop: 10, marginBottom: 20 },
  vendorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vendorCard: {
    width: VENDOR_CARD_WIDTH,
    height: 150,
    borderRadius: 14,
    marginRight: 14,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  vendorImg: { width: '100%', height: '100%' },
  vendorPlaceholder: { backgroundColor: '#ddd' },
  vendorOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  vendorName: { color: '#fff', fontSize: 18, fontFamily: 'Outfit-Bold' },
});
