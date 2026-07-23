import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import apiClient from '../../api/client';
import ProfileCard from '../../components/ProfileCard';
import BottomNav from '../../components/BottomNav';
import RequestSentModal from '../../components/RequestSentModal';

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

const mapInterest = (item: any) => {
  const p = item.profile || {};
  const basic = p.basicInfo || {};
  const photo = p.photos?.find((x: any) => x.isProfilePhoto)?.url || p.photos?.[0]?.url || '';
  const addr = p.address?.current || {};
  const matchPercentage = item.matchPercentage ?? item.matchPercent ?? p.matchPercentage ?? p.matchPercent;
  return {
    profileId: item.profileId || p._id,
    name: [item.user?.firstName, item.user?.lastName].filter(Boolean).join(' ') || 'Profile',
    age: getAge(basic.dob),
    profession: p.employment?.designation || '',
    location:
      [
        addr.city || addr.district || addr.taluka,
        addr.state || addr.stateOrProvince,
        addr.country && addr.country !== 'India' ? addr.country : '',
      ]
        .filter(Boolean)
        .join(', ') || 'Location not added',
    image: photo,
    matchPercentage,
    matchPercent: matchPercentage,
    verified: p.documents?.verificationStatus === 'VERIFIED',
  };
};

export default function AllInterestedScreen({ navigation, route }: any) {
  const pushed = route?.params?.pushed === true;
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sentModal, setSentModal] = useState<{ show: boolean; name?: string }>({ show: false });

  const load = useCallback(async (pageNum: number, replace = false) => {
    if (loading) return;
    try {
      setLoading(true);
      const [intRes, sentRes] = await Promise.all([
        apiClient.get('/relationship/interests/me', { params: { page: pageNum, limit: 10 } }),
        apiClient.get('/relationship/requests/sent', { params: { limit: 50 } }),
      ]);
      const raw = intRes.data?.data?.interests || [];
      const sent = sentRes.data?.data?.requests || [];
      const statusMap = new Map(
        sent
          .filter((r: any) => r.status === 'PENDING' || r.status === 'ACCEPTED')
          .map((r: any) => [String(r.toProfileId || r.profile?._id), r.status])
      );
      const mapped = raw.map((it: any) => {
        const card = mapInterest(it);
        return { ...card, requestStatus: statusMap.get(String(card.profileId)) || null };
      });
      setItems((prev) => (replace ? mapped : [...prev, ...mapped]));
      setHasNext(intRes.data?.data?.pagination?.hasNextPage || false);
      setPage(pageNum);
    } catch {
      if (replace) setItems([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [loading]);

  useFocusEffect(
    useCallback(() => {
      setInitialLoading(true);
      load(1, true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const loadMore = () => {
    if (!loading && hasNext) load(page + 1, false);
  };

  const sendRequest = async (profileId: string) => {
    try {
      await apiClient.post(`/relationship/requests/${profileId}`, {});
      const prof = items.find((p) => p.profileId === profileId);
      setItems((prev) =>
        prev.map((p) => (p.profileId === profileId ? { ...p, requestStatus: 'PENDING' } : p))
      );
      setSentModal({ show: true, name: prof?.name });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not send request');
    }
  };

  const removeInterest = async (profileId: string) => {
    try {
      await apiClient.delete(`/relationship/interests/${profileId}`);
      setItems((prev) => prev.filter((p) => p.profileId !== profileId));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not remove');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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

      <View style={styles.header}>
        {pushed ? (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft color="#000" size={24} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <Text style={styles.headerTitle}>Interested Profiles</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {initialLoading ? (
          <ActivityIndicator color="#D20236" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.profileId}
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
                showInterested={false}
                onRemove={() => removeInterest(item.profileId)}
                removeLabel="Remove from Interested"
              />
            )}
            ListEmptyComponent={<Text style={styles.empty}>No interested profiles yet</Text>}
            ListFooterComponent={
              loading && !initialLoading ? (
                <ActivityIndicator color="#D20236" style={{ marginVertical: 20 }} />
              ) : null
            }
          />
        )}
      </View>

      {pushed && <BottomNav active="InterestsTab" />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  content: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 20, flexGrow: 1 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});
