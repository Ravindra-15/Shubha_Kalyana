import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import apiClient from '../../api/client';
import ProfileCard from '../../components/ProfileCard';

const GENDERS = [
  { label: 'All', value: '' },
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
];

export default function AllMatchesScreen({ navigation }: any) {
  const [gender, setGender] = useState('');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const load = useCallback(
    async (pageNum: number, genderVal: string, replace = false) => {
      if (loading) return;
      try {
        setLoading(true);
        const params: any = { page: pageNum, limit: 10 };
        if (genderVal) params.gender = genderVal;
        const res = await apiClient.get('/user/search', { params });
        const data = res.data?.data;
        const newProfiles = data?.profiles || [];
        setProfiles((prev) => (replace ? newProfiles : [...prev, ...newProfiles]));
        setHasNext(data?.pagination?.hasNextPage || false);
        setPage(pageNum);
      } catch {
        if (replace) setProfiles([]);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [loading]
  );

  useEffect(() => {
    setInitialLoading(true);
    load(1, gender, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender]);

  const loadMore = () => {
    if (!loading && hasNext) load(page + 1, gender, false);
  };

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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Matches</Text>
        <View style={{ width: 24 }} />
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
          ListEmptyComponent={
            <Text style={styles.empty}>No matches found</Text>
          }
          ListFooterComponent={
            loading && !initialLoading ? (
              <ActivityIndicator color="#D20236" style={{ marginVertical: 20 }} />
            ) : null
          }
        />
      )}
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
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});