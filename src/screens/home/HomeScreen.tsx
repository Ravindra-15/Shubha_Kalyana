import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../api/client';
import WelcomePopup from './WelcomePopup';
import { Crown, ArrowRight } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getActiveMembership } from '../../api/membership';
import { ActivityIndicator } from 'react-native';
import ProfileCard from '../../components/ProfileCard';
import { Filter } from 'lucide-react-native';
import FilterModal, { Filters } from '../../components/FilterModal';
import RequestCard from '../../components/RequestCard';
import { FlatList, Image, Dimensions } from 'react-native';
import { getPublicVendors } from '../../api/vendor';
import { resolveImageUrl } from '../../utils/imageUrl';
import { useFocusEffect } from '@react-navigation/native';
import RequestSentModal from '../../components/RequestSentModal';
import { getUnreadCount } from '../../api/notification';

const SCREEN_WIDTH = Dimensions.get('window').width;
const VENDOR_CARD_WIDTH = SCREEN_WIDTH * 0.7;
export default function HomeScreen({ navigation }: any) {
  const [firstName, setFirstName] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [planName, setPlanName] = useState('Free Plan');
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Filters | null>(null);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [interestedProfiles, setInterestedProfiles] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [sentModal, setSentModal] = useState<{ show: boolean; name?: string }>({
    show: false,
  });
const [unreadCount, setUnreadCount] = useState(0);


  useFocusEffect(
    useCallback(() => {
      loadUser();
      loadPlan();
      loadMatches();
      loadReceivedRequests();
      loadInterested();
      loadVendors();
      loadUnread();
    }, [])
  );

  const loadUnread = async () => {
    const count = await getUnreadCount();
    setUnreadCount(count);
  };
  const loadMatches = async (filters?: Filters | null) => {
    try {
      setLoadingMatches(true);
      const params: any = { limit: 5 };
      if (filters) {
        params.minAge = filters.minAge;
        params.maxAge = filters.maxAge;
        if (filters.caste) params.caste = filters.caste;
        if (filters.subCaste) params.subCaste = filters.subCaste;
        if (filters.education) params.education = filters.education;
        if (filters.profession) params.profession = filters.profession;
        if (filters.district) params.district = filters.district;
      }
      console.log('Search Params:', params);

      const res = await apiClient.get('/user/search', { params });

      console.log('Search Response:', res.data);

      setMatches(res.data?.data?.profiles || []);
    } catch (err) {
      setMatches([]);
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
      caste: basic.caste?.casteName || '',
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
    return {
      profileId: item.profileId,
      name:
        [item.user?.firstName, item.user?.lastName].filter(Boolean).join(' ') ||
        'Profile',
      age: getAgeFromDob(basic.dob),
      profession: item.profile?.employment?.designation || '',
      location:
        [addr.city || addr.district, addr.state].filter(Boolean).join(', ') ||
        'Location not added',
      image: photo,
      verified: item.profile?.documents?.verificationStatus === 'VERIFIED',
    };
  };

  const loadInterested = async () => {
    try {
      const [intRes, sentRes, connRes] = await Promise.all([
        apiClient.get('/relationship/interests/me', { params: { limit: 5 } }),
        apiClient.get('/relationship/requests/sent', { params: { limit: 50 } }),
        apiClient.get('/relationship/connections/me', { params: { limit: 50 } }),
      ]);
      const items = intRes.data?.data?.interests || [];
      const sent = sentRes.data?.data?.requests || [];
      const conns = connRes.data?.data?.connections || connRes.data?.data?.items || [];
      // profileId → status (connection wins as ACCEPTED)
      const statusMap = new Map();
      sent
        .filter((r: any) => r.status === 'PENDING' || r.status === 'ACCEPTED')
        .forEach((r: any) => statusMap.set(String(r.toProfileId || r.profile?._id), r.status));
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
  const loadVendors = async () => {
    const list = await getPublicVendors();
    // console.log('VENDORS:', JSON.stringify(list));
    setVendors(list);
  };

  const removeInterest = async (profileId: string) => {
    try {
      await apiClient.delete(`/relationship/interests/${profileId}`);
      setInterestedProfiles(prev =>
        prev.filter(p => p.profileId !== profileId),
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not remove');
    }
  };

  const sendRequestFromInterest = async (profileId: string) => {
    try {
      await apiClient.post(`/relationship/requests/${profileId}`, {});
      setInterestedProfiles(prev =>
        prev.map(p =>
          p.profileId === profileId ? { ...p, _requestSent: true } : p,
        ),
      );
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Could not send request',
      );
    }
  };

  const applyFilters = (filters: Filters | null) => {
    setActiveFilters(filters);
    loadMatches(filters);
  };

  const sendRequest = async (profileId: string) => {
    try {
      await apiClient.post(`/relationship/requests/${profileId}`, {});
      const prof = matches.find(p => p.profileId === profileId);
      setMatches(prev =>
        prev.map(p =>
          p.profileId === profileId ? { ...p, _requestSent: true } : p,
        ),
      );
      setSentModal({ show: true, name: prof?.name });
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Could not send request',
      );
    }
  };

  const toggleInterest = async (profileId: string, currentlyInterested: boolean) => {
    try {
      if (currentlyInterested) {
        await apiClient.delete(`/relationship/interests/${profileId}`);
        setMatches(prev =>
          prev.map(p =>
            p.profileId === profileId ? { ...p, _interested: false, isInterested: false } : p,
          ),
        );
        loadInterested();
      } else {
        await apiClient.post(`/relationship/interests/${profileId}`, {});
        setMatches(prev =>
          prev.map(p =>
            p.profileId === profileId ? { ...p, _interested: true, isInterested: true } : p,
          ),
        );
        loadInterested();
        Alert.alert('Added', 'Profile added to your interests');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not update interest');
    }
  };

  const loadPlan = async () => {
    const membership = await getActiveMembership();
    // active paid membership has a plan name; otherwise Free
    const name = membership?.plan?.name || membership?.planName;
    setPlanName(name || 'Free Plan');
  };

  const loadUser = async () => {
    try {
      const res = await apiClient.get('/user/me/profile');
      const user = res.data?.data?.user;
      const name = user?.firstName || '';
      setFirstName(name);

      // show welcome popup once per user
      const userId = user?._id;
      if (userId) {
        const seen = await AsyncStorage.getItem(`welcomeSeen_${userId}`);
        if (!seen) {
          setShowWelcome(true);
          await AsyncStorage.setItem(`welcomeSeen_${userId}`, 'true');
        }
      }
    } catch (err) {
      // ignore — header still renders
    }
  };

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
          navigation.navigate('SentRequests');
        }}
      />

      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={applyFilters}
        initial={activeFilters || undefined}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
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
          <TouchableOpacity style={styles.bellWrap} onPress={() => navigation.navigate('Notifications')}>
            <Bell color="#333" size={24} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Plan card */}
        <LinearGradient
          colors={['#D20236', '#8B0020']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planCard}
        >
          <View style={styles.planRow}>
            <Crown color="#fff" size={20} />
            <Text style={styles.planTitle}>{planName}</Text>
          </View>
          <Text style={styles.planSubtitle}>
            Unlock full profile access and premium features
          </Text>
          <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.85}>
            <Text style={styles.upgradeText}>Upgrade Now</Text>
            <ArrowRight color="#D20236" size={16} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Filter bar */}
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilter(true)}
          >
            <Filter color="#333" size={20} />
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* Recommended Matches */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Recommended Matches</Text>
            <Text style={styles.sectionSub}>
              Profiles matching your preferences
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('AllMatches')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {loadingMatches ? (
          <ActivityIndicator color="#D20236" style={{ marginVertical: 20 }} />
        ) : matches.length === 0 ? (
          <Text style={styles.empty}>No matches found yet</Text>
        ) : (
          matches.map(p => (
            <ProfileCard
              key={p.id}
              profile={p}
              actionLabel={
                p._requestSent || p.requestStatus === 'PENDING'
                  ? 'Request Sent'
                  : p.requestStatus === 'ACCEPTED'
                  ? 'Connected'
                  : 'Send Request'
              }
              actionDisabled={p._requestSent || !!p.requestStatus}
              onAction={() => sendRequest(p.profileId)}
              onView={() =>
                navigation.navigate('ProfileDetail', { profileId: p.profileId })
              }
              onInterested={() => toggleInterest(p.profileId, p._interested || p.isInterested)}
            />
          ))
        )}

        {/* Received Requests */}
        {receivedRequests.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Received Requests</Text>
                <Text style={styles.sectionSub}>
                  Profiles matching your preferences
                </Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>

            {receivedRequests.map(r => (
              <RequestCard
                key={r.requestId}
                profile={r}
                onAccept={() => acceptRequest(r.requestId)}
                onReject={() => rejectRequest(r.requestId)}
                onView={() =>
                  navigation.navigate('ProfileDetail', {
                    profileId: r.profileId,
                  })
                }
              />
            ))}
          </>
        )}

        {/* Interested Profiles */}
        {interestedProfiles.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Interested Profiles</Text>
                <Text style={styles.sectionSub}>
                  Profiles matching your preferences
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('AllInterested', { pushed: true })}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>

            {interestedProfiles.map((p) => (
              <ProfileCard
                key={p.profileId}
                profile={p}
                actionLabel={
                  p._requestSent || p.requestStatus === 'PENDING'
                    ? 'Request Sent'
                    : p.requestStatus === 'ACCEPTED'
                    ? 'Connected'
                    : 'Send Request'
                }
                actionDisabled={p._requestSent || !!p.requestStatus}
                onAction={() => sendRequestFromInterest(p.profileId)}
                onView={() =>
                  navigation.navigate('ProfileDetail', {
                    profileId: p.profileId,
                  })
                }
                showInterested={false}
                onRemove={() => removeInterest(p.profileId)}
                removeLabel="Remove from Interested"
              />
            ))}
          </>
        )}

        {/* Vendors */}
        {vendors.length > 0 && (
          <View style={styles.vendorSection}>
            <Text style={styles.sectionTitle}>Vendors</Text>
            <Text style={styles.sectionSub}>
              Explore trusted wedding vendors
            </Text>

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

        {/* Other sections will go here */}
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
  welcome: { fontSize: 24, fontWeight: '700', color: '#000' },
  name: { color: '#D20236' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  bellWrap: { padding: 4 },
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
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  planCard: { borderRadius: 16, padding: 18, marginBottom: 24 },
  planRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  planTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginLeft: 8 },
  planSubtitle: {
    color: '#ffe0e6',
    fontSize: 13,
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
    color: '#D20236',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  sectionSub: { fontSize: 13, color: '#666', marginTop: 2 },
  viewAll: { fontSize: 14, color: '#D20236', fontWeight: '600' },
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
  filterText: { fontSize: 14, color: '#333', fontWeight: '600' },
  vendorSection: { marginTop: 10, marginBottom: 20 },
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
  vendorName: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
