import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Search, Filter } from 'lucide-react-native';
import apiClient from '../../api/client';
import ProfileCard from '../../components/ProfileCard';
import FilterModal, { Filters } from '../../components/FilterModal';
import BottomNav from '../../components/BottomNav';
import UnlockAccessModal from '../../components/UnlockAccessModal';
import { getProfileAccess, unlockProfileWithMembership } from '../../api/membershipPayment';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

export default function AllMatchesScreen({ navigation, route }: any) {
  const pushed = route?.params?.pushed === true;

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [gender, setGender] = useState('');

  useEffect(() => {
    apiClient
      .get('/user/me/profile')
      .then((res) => setGender(res.data?.data?.profile?.basicInfo?.gender || ''))
      .catch(() => {});
  }, []);

  const [profiles, setProfiles] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [accessPrompt, setAccessPrompt] = useState<{ profileId: string; name?: string; access: any } | null>(null);

  const buildParams = useCallback(
    (pageNum: number) => {
      const params: any = { page: pageNum, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (filters) {
        params.minAge = filters.minAge;
        params.maxAge = filters.maxAge;
        if (filters.religion) params.religion = filters.religion;
        if (filters.caste?.length) params.caste = filters.caste;
        if (filters.subCaste?.length) params.subCaste = filters.subCaste;
        if (filters.maritalStatus) params.maritalStatus = filters.maritalStatus;
        if (filters.education?.length) params.education = filters.education;
        if (filters.profession?.length) params.profession = filters.profession;
        if (filters.preferredLocation?.length) params.preferredLocation = filters.preferredLocation;
        if (filters.district?.length) params.district = filters.district;
      }
      return params;
    },
    [search, filters]
  );

  const load = useCallback(
    async (pageNum: number, replace = false) => {
      if (loading) return;
      try {
        setLoading(true);
        const params = buildParams(pageNum);
        const res = await apiClient.get('/user/search', { params });
        const data = res.data?.data;
        // Server already orders these by the viewer's partner preferences
        // (age, profession, caste, education) then match percentage -- trust
        // that order instead of re-sorting by match percentage alone here.
        const newProfiles = data?.profiles || [];
        setProfiles((prev) => (replace ? newProfiles : [...prev, ...newProfiles]));
        setTotal(data?.pagination?.total || 0);
        setHasNext(data?.pagination?.hasNextPage || false);
        setPage(pageNum);
      } catch {
        if (replace) {
          setProfiles([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [loading, buildParams]
  );

  useFocusEffect(
    useCallback(() => {
      setInitialLoading(true);
      load(1, true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters])
  );

  // debounce free-text search so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      setInitialLoading(true);
      load(1, true);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const loadMore = () => {
    if (!loading && hasNext) load(page + 1, false);
  };

  const { refreshing, onRefresh } = usePullToRefresh(() => load(1, true));

  const applyFilters = (next: Filters | null) => {
    setFilters(next);
  };

  const activeFilterCount = filters
    ? Object.entries(filters).filter(([key, val]) => {
        if (key === 'minAge' || key === 'maxAge') return false; // age range always has a value, don't count as "active"
        return Array.isArray(val) ? val.length > 0 : !!val;
      }).length
    : 0;

  const sendRequest = async (profileId: string) => {
    try {
      await apiClient.post(`/relationship/requests/${profileId}`, {});
      setProfiles((prev) =>
        prev.map((p) => (p.profileId === profileId ? { ...p, requestStatus: 'PENDING' } : p))
      );
    } catch (err: any) {
      if (err?.response?.status === 402) {
        const name = profiles.find((p) => p.profileId === profileId)?.name;
        const access = await getProfileAccess(profileId);
        setAccessPrompt({ profileId, name, access });
        return;
      }
      Alert.alert('Error', err?.response?.data?.message || 'Could not send request');
    }
  };

  const viewContact = async (profileId: string) => {
    try {
      await unlockProfileWithMembership(profileId);
      navigation.navigate('ProfileDetail', { profileId });
    } catch (err: any) {
      if (err?.response?.status === 402) {
        const name = profiles.find((p) => p.profileId === profileId)?.name;
        const access = await getProfileAccess(profileId);
        setAccessPrompt({ profileId, name, access });
        return;
      }
      Alert.alert('Error', err?.response?.data?.message || 'Could not view contact');
    }
  };

  const getCardActionProps = (p: any) => {
    if (p.bothHaveActivePlans && !p.requestStatus) {
      return {
        actionLabel: 'View Contact',
        actionDisabled: false,
        onAction: () => viewContact(p.profileId),
      };
    }
    return {
      actionLabel:
        p.requestStatus === 'PENDING'
          ? 'Request Sent'
          : p.requestStatus === 'ACCEPTED'
          ? 'Connected'
          : 'Send Request',
      actionDisabled: !!p.requestStatus,
      onAction: () => sendRequest(p.profileId),
    };
  };

  const toggleInterest = async (profileId: string, currentlyInterested: boolean) => {
    try {
      if (currentlyInterested) {
        await apiClient.delete(`/relationship/interests/${profileId}`);
        setProfiles((prev) =>
          prev.map((p) => (p.profileId === profileId ? { ...p, isInterested: false } : p))
        );
      } else {
        await apiClient.post(`/relationship/interests/${profileId}`, {});
        setProfiles((prev) =>
          prev.map((p) => (p.profileId === profileId ? { ...p, isInterested: true } : p))
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not update interest');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={applyFilters}
        initial={filters || undefined}
        gender={gender}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            pushed
              ? navigation.goBack()
              : navigation.navigate('MainTabs', { screen: 'HomeTab' })
          }
          style={styles.backBtn}
        >
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Matches</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search + filter row */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search color="#999" size={16} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Matches..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilter(true)}>
          <Filter color="#333" size={18} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {!initialLoading && (
        <Text style={styles.countText}>{total} profile{total !== 1 ? 's' : ''} found</Text>
      )}

      {initialLoading ? (
        <View style={{ flex: 1 }}>
          <ActivityIndicator color="#D20236" style={{ marginTop: 40 }} />
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({ item }) => (
            <ProfileCard
              profile={item}
              {...getCardActionProps(item)}
              onView={() => navigation.navigate('ProfileDetail', { profileId: item.profileId })}
              onInterested={() => toggleInterest(item.profileId, item.isInterested)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Image
                source={require('../../assets/images/noMatches.png')}
                style={styles.emptyImage}
                resizeMode="contain"
              />
              <Text style={styles.emptyTitle}>Sorry !</Text>
              <Text style={styles.emptyText}>
                No matches found in <Text style={styles.emptyTextBold}>Selected Filters</Text>
              </Text>
            </View>
          }
          ListFooterComponent={
            loading && !initialLoading ? (
              <ActivityIndicator color="#D20236" style={{ marginVertical: 20 }} />
            ) : null
          }
        />
      )}

      {pushed && <BottomNav active="SearchTab" />}

      <UnlockAccessModal
        visible={Boolean(accessPrompt)}
        variant="accept"
        action="send"
        name={accessPrompt?.name}
        access={accessPrompt?.access}
        onClose={() => setAccessPrompt(null)}
        onUpgrade={() => {
          const profileId = accessPrompt?.profileId;
          const profileName = accessPrompt?.name;
          setAccessPrompt(null);
          navigation.navigate('Plans', profileId ? { profileId, profileName } : undefined);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'Outfit-Bold', color: '#000' },
  searchRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 10, height: 44 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#000' },
  filterBtn: {
    width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0',
    alignItems: 'center', justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute', top: -4, right: -4, backgroundColor: '#D20236',
    borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Outfit-Bold' },
  countText: { fontSize: 12, color: '#999', paddingHorizontal: 16, marginBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 40, paddingHorizontal: 24 },
  emptyImage: { width: 220, height: 220, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontFamily: 'Outfit-Bold', color: '#D20236', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#333', textAlign: 'center' },
  emptyTextBold: { fontFamily: 'Outfit-Bold', color: '#000' },
});
