import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Search, BadgeCheck } from 'lucide-react-native';
import apiClient from '../../api/client';
import BottomNav from '../../components/BottomNav';
import RequestCard from '../../components/RequestCard';
import { resolveImageUrl } from '../../utils/imageUrl';

const TABS = ['Received', 'Sent', 'Accepted'] as const;
type Tab = typeof TABS[number];

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

const mapCard = (item: any, kind: Tab) => {
  const p = item.profile || {};
  const basic = p.basicInfo || {};
  const photo = p.photos?.find((x: any) => x.isProfilePhoto)?.url || p.photos?.[0]?.url || '';
  return {
    requestId: item._id,
    connectionId: item._id, // for accepted (connection id)
    profileId: p._id,
    name: [item.user?.firstName, item.user?.lastName].filter(Boolean).join(' ') || 'Profile',
    age: getAge(basic.dob),
    caste: basic.caste?.casteName || '',
    profession: p.employment?.designation || '',
    image: photo,
  };
};

// Card for Sent (Withdraw + View) and Accepted (View only)
function SimpleCard({
  profile,
  kind,
  onWithdraw,
  onView,
}: {
  profile: any;
  kind: Tab;
  onWithdraw?: () => void;
  onView?: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        {profile.image ? (
          <Image source={{ uri: resolveImageUrl(profile.image) }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholder]} />
        )}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.name}{profile.age ? `, ${profile.age}` : ''}</Text>
            <BadgeCheck color="#fff" size={18} fill="#D20236" />
          </View>
          <Text style={styles.detail}>
            {[profile.caste, profile.profession].filter(Boolean).join('  |  ') || 'Not specified'}
          </Text>
        </View>
      </View>

      {kind === 'Sent' && (
        <TouchableOpacity style={styles.withdrawBtn} onPress={onWithdraw}>
          <Text style={styles.withdrawText}>Withdraw</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={onView} style={styles.viewWrap}>
        <Text style={styles.viewText}>View Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RequestsScreen({ navigation }: any) {
  const [tab, setTab] = useState<Tab>('Received');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (which: Tab) => {
    setLoading(true);
    try {
      let res;
      if (which === 'Received') {
        res = await apiClient.get('/relationship/requests/received', { params: { status: 'PENDING', limit: 50 } });
        setItems((res.data?.data?.requests || []).map((r: any) => mapCard(r, which)));
      } else if (which === 'Sent') {
        res = await apiClient.get('/relationship/requests/sent', { params: { status: 'PENDING', limit: 50 } });
        setItems((res.data?.data?.requests || []).map((r: any) => mapCard(r, which)));
      } else {
        // Accepted → connections
        res = await apiClient.get('/relationship/connections/me', { params: { limit: 50 } });
        const conns = res.data?.data?.connections || res.data?.data?.items || [];
        setItems(conns.map((c: any) => mapCard(c, which)));
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(tab);
    }, [tab, load])
  );

  const accept = async (id: string) => {
    try {
      await apiClient.patch(`/relationship/requests/${id}/accept`);
      setItems((prev) => prev.filter((x) => x.requestId !== id));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not accept');
    }
  };
  const reject = async (id: string) => {
    try {
      await apiClient.patch(`/relationship/requests/${id}/reject`);
      setItems((prev) => prev.filter((x) => x.requestId !== id));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not reject');
    }
  };
  const withdraw = async (id: string) => {
    try {
      await apiClient.patch(`/relationship/requests/${id}/withdraw`);
      setItems((prev) => prev.filter((x) => x.requestId !== id));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not withdraw');
    }
  };

  const openProfile = (profileId: string) =>
    navigation.navigate('ProfileDetail', { profileId });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Requests</Text>
        <Search color="#000" size={22} />
      </View>

      {/* Chips */}
      <View style={styles.chipRow}>
        {TABS.map((t) => {
          const active = tab === t;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color="#D20236" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item, i) => item.requestId || item.profileId || String(i)}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) =>
              tab === 'Received' ? (
                <RequestCard
                  profile={item}
                  onAccept={() => accept(item.requestId)}
                  onReject={() => reject(item.requestId)}
                  onView={() => openProfile(item.profileId)}
                />
              ) : (
                <SimpleCard
                  profile={item}
                  kind={tab}
                  onWithdraw={() => withdraw(item.requestId)}
                  onView={() => openProfile(item.profileId)}
                />
              )
            }
            ListEmptyComponent={<Text style={styles.empty}>No {tab.toLowerCase()} requests</Text>}
          />
        )}
      </View>

      <BottomNav active="InterestsTab" />
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
  chipRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 30, paddingVertical: 7, paddingHorizontal: 18 },
  chipActive: { borderColor: '#D20236', backgroundColor: '#D20236' },
  chipText: { fontSize: 13, color: '#333' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 20, flexGrow: 1 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  // SimpleCard
  card: {
    borderWidth: 1, borderColor: '#f0f0f0', borderRadius: 14, padding: 14, marginBottom: 14,
    backgroundColor: '#fff', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 12 },
  placeholder: { backgroundColor: '#eee' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 16, fontWeight: '700', color: '#000' },
  detail: { fontSize: 13, color: '#888', marginTop: 3 },
  withdrawBtn: { backgroundColor: '#f0f0f0', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  withdrawText: { color: '#D20236', fontSize: 14, fontWeight: '700' },
  viewWrap: { alignItems: 'center', marginTop: 12 },
  viewText: { fontSize: 14, color: '#333', fontWeight: '600' },
  content: { flex: 1 },
});