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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Search, Filter } from 'lucide-react-native';
import apiClient from '../../api/client';
import ProfileCard from '../../components/ProfileCard';
import FilterModal, { Filters } from '../../components/FilterModal';
import BottomNav from '../../components/BottomNav';

const GENDERS = [
  { label: 'All', value: '' },
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
];

export default function AllMatchesScreen({ navigation, route }: any) {
  const pushed = route?.params?.pushed === true;

  const [gender, setGender] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  const [profiles, setProfiles] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const buildParams = useCallback(
    (pageNum: number) => {
      const params: any = { page: pageNum, limit: 10 };
      if (gender) params.gender = gender;
      if (search.trim()) params.search = search.trim();
      if (filters) {
        params.minAge = filters.minAge;
        params.maxAge = filters.maxAge;
        if (filters.religion) params.religion = filters.religion;
        if (filters.caste) params.caste = filters.caste;
        if (filters.subCaste) params.subCaste = filters.subCaste;
        if (filters.education) params.education = filters.education;
        if (filters.profession) params.profession = filters.profession;
        if (filters.district) params.location = filters.district;
      }
      return params;
    },
    [gender, search, filters]
  );

  const load = useCallback(
    async (pageNum: number, replace = false) => {
      if (loading) return;
      try {
        setLoading(true);
        const params = buildParams(pageNum);
        const res = await apiClient.get('/user/search', { params });
        const data = res.data?.data;
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
    }, [gender, filters])
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

  const applyFilters = (next: Filters | null) => {
    setFilters(next);
  };

  const activeFilterCount = filters
    ? Object.entries(filters).filter(([key, val]) => {
        if (key === 'minAge' || key === 'maxAge') return false; // age range always has a value, don't count as "active"
        return !!val;
      }).length
    : 0;

  const sendRequest = async (profileId: string) => {
    try {
      await apiClient.post(`/relationship/requests/${profileId}`, {});
      setProfiles((prev) =>
        prev.map((p) => (p.profileId === profileId ? { ...p, requestStatus: 'PENDING' } : p))
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not send request');
    }
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
      />

      {/* Header */}
      <View style={styles.header}>
        {pushed ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft color="#000" size={24} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
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

      {/* Gender chips */}
      <View style={styles.chipRow}>
        {GENDERS.map((g) => {
          const active = gender === g.value;
          return (
            <TouchableOpacity
              key={g.label}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setGender(g.value)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{g.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!initialLoading && (
        <Text style={styles.countText}>{total} profile{total !== 1 ? 's' : ''} found</Text>
      )}

      {initialLoading ? (
        <ActivityIndicator color="#D20236" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => (
            <ProfileCard
              profile={item}
              actionLabel={
                item.requestStatus === 'PENDING'
                  ? 'Request Sent'
                  : item.requestStatus === 'ACCEPTED'
                  ? 'Connected'
                  : 'Send Request'
              }
              actionDisabled={!!item.requestStatus}
              onAction={() => sendRequest(item.profileId)}
              onView={() => navigation.navigate('ProfileDetail', { profileId: item.profileId })}
              onInterested={() => toggleInterest(item.profileId, item.isInterested)}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No matches found</Text>}
          ListFooterComponent={
            loading && !initialLoading ? (
              <ActivityIndicator color="#D20236" style={{ marginVertical: 20 }} />
            ) : null
          }
        />
      )}

      {pushed && <BottomNav active="SearchTab" />}
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
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
  filterBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  chipRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 10 },
  chip: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 22,
  },
  chipActive: { borderColor: '#D20236', backgroundColor: '#fdf2f5' },
  chipText: { fontSize: 14, color: '#333' },
  chipTextActive: { color: '#D20236', fontWeight: '600' },
  countText: { fontSize: 12, color: '#999', paddingHorizontal: 16, marginBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});