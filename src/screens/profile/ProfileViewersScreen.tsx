import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import ProfileCard from '../../components/ProfileCard';
import RequestSentModal from '../../components/RequestSentModal';
import apiClient from '../../api/client';
import { getProfileViewers, isProfileFullyVerified } from '../../api/profile';
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

const formatViewedAt = (date?: string) => {
  if (!date) return 'Viewed recently';
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return 'Viewed recently';

  return `Viewed ${parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })}`;
};

const mapProfileViewer = (item: any) => {
  const p = item.profile || {};
  const user = item.user || {};
  const basic = p.basicInfo || {};
  const photo = p.photos?.find((x: any) => x.isProfilePhoto)?.url || p.photos?.[0]?.url || '';
  const addr = p.address?.current || {};
  const matchPercentage =
    item.matchPercentage ??
    item.matchPercent ??
    p.matchPercentage ??
    p.matchPercent;

  return {
    profileId: String(item.profileId || p._id),
    name:
      [user.firstName || basic.firstName, user.lastName || basic.lastName]
        .filter(Boolean)
        .join(' ') || 'Profile',
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
    image: photo ? resolveImageUrl(photo) : '',
    matchPercentage,
    matchPercent: matchPercentage,
    verified: Boolean(p.verified || isProfileFullyVerified(p)),
    viewedAt: item.viewedAt,
    viewCount: Number(item.viewCount || 0),
  };
};

export default function ProfileViewersScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sentModal, setSentModal] = useState<{ show: boolean; name?: string }>({
    show: false,
  });

  const load = useCallback(async (pageNum: number, replace = false) => {
    if (loading) return;

    try {
      setLoading(true);
      const [viewerRes, sentRes, connRes] = await Promise.all([
        getProfileViewers({ page: pageNum, limit: 10 }),
        apiClient.get('/relationship/requests/sent', {
          params: { limit: 50 },
        }),
        apiClient.get('/relationship/connections/me', {
          params: { limit: 50 },
        }),
      ]);

      const viewers = viewerRes?.viewers || [];
      const sent = sentRes.data?.data?.requests || [];
      const conns = connRes.data?.data?.connections || connRes.data?.data?.items || [];
      const statusMap = new Map<string, string>();

      sent
        .filter((request: any) => request.status === 'PENDING' || request.status === 'ACCEPTED')
        .forEach((request: any) => {
          statusMap.set(String(request.toProfileId || request.profile?._id), request.status);
        });

      conns.forEach((connection: any) => {
        const connectedProfileId =
          connection.profile?._id || connection.profileId || connection.otherProfileId;
        if (connectedProfileId) statusMap.set(String(connectedProfileId), 'ACCEPTED');
      });

      const mapped = viewers.map((viewer: any) => {
        const card = mapProfileViewer(viewer);
        return {
          ...card,
          requestStatus: statusMap.get(String(card.profileId)) || null,
        };
      });

      setItems((prev) => (replace ? mapped : [...prev, ...mapped]));
      setHasNext(viewerRes?.pagination?.hasNextPage || false);
      setTotal(viewerRes?.profileViewersCount || viewerRes?.pagination?.total || 0);
      setPage(pageNum);
    } catch {
      if (replace) {
        setItems([]);
        setTotal(0);
      }
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
      const profile = items.find((item) => item.profileId === profileId);
      setItems((prev) =>
        prev.map((item) =>
          item.profileId === profileId ? { ...item, requestStatus: 'PENDING' } : item
        )
      );
      setSentModal({ show: true, name: profile?.name });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not send request');
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
          navigation.navigate('SentRequests', { initialTab: 'Sent' });
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Viewers</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {initialLoading ? (
          <ActivityIndicator color="#D20236" style={styles.initialLoader} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.profileId}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={
              <Text style={styles.countText}>
                {total} profile viewer{total === 1 ? '' : 's'}
              </Text>
            }
            renderItem={({ item }) => (
              <View>
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
                />
                <Text style={styles.viewerMeta}>
                  {formatViewedAt(item.viewedAt)}
                  {item.viewCount > 1 ? ` - ${item.viewCount} total visits` : ''}
                </Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No profile viewers yet</Text>}
            ListFooterComponent={
              loading && !initialLoading ? (
                <ActivityIndicator color="#D20236" style={styles.footerLoader} />
              ) : null
            }
          />
        )}
      </View>
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
  headerTitle: { fontSize: 18, fontFamily: 'Outfit-Bold', color: '#000' },
  headerSpacer: { width: 24 },
  content: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 20, flexGrow: 1 },
  countText: { color: '#999', fontSize: 13, fontFamily: 'Outfit-SemiBold', marginBottom: 12 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  initialLoader: { marginTop: 40 },
  footerLoader: { marginVertical: 20 },
  viewerMeta: {
    color: '#777',
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    marginTop: -8,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
});
