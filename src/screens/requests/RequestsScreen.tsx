import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, BadgeCheck } from 'lucide-react-native';
import apiClient from '../../api/client';
import BottomNav from '../../components/BottomNav';
import RequestCard from '../../components/RequestCard';
import { resolveImageUrl } from '../../utils/imageUrl';
import UnlockAccessModal from '../../components/UnlockAccessModal';
import PaymentBreakupModal from '../../components/PaymentBreakupModal';
import {
  createProfileUnlockOrder,
  getProfileAccess,
  getUnlockPrice,
} from '../../api/membershipPayment';
import { openRazorpayOrder } from '../../utils/razorpayCheckout';
import type { PaymentOrderResult } from '../../utils/paymentBreakup';
import { getSingleProfileUnlockLimitMessage } from '../../utils/singleProfileUnlockAccess';

const TABS = ['Received', 'Sent', 'Accepted', 'Pending'] as const;
type Tab = (typeof TABS)[number];
type RequestDirection = 'received' | 'sent' | 'accepted';

type PendingPayment = {
  orderResult: PaymentOrderResult;
  title: string;
  description: string;
  itemLabel: string;
  requestId: string;
  profile: any;
};

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

const isTab = (value: unknown): value is Tab =>
  typeof value === 'string' && (TABS as readonly string[]).includes(value);

const getInitialTab = (route?: any): Tab => {
  if (isTab(route?.params?.initialTab)) return route.params.initialTab;
  if (route?.name === 'SentRequests') return 'Sent';
  return 'Received';
};

const getProfileIdFallback = (item: any, direction?: RequestDirection) => {
  if (direction === 'sent') return item.toProfileId;
  if (direction === 'received') return item.fromProfileId;
  if (direction === 'accepted') return item.otherProfileId || item.profileId;
  return item.profileId || item.otherProfileId || item.fromProfileId || item.toProfileId;
};

const mapCard = (item: any, fallbackDirection?: RequestDirection) => {
  const p = item.profile || {};
  const basic = p.basicInfo || {};
  const photo = p.photos?.find((x: any) => x.isProfilePhoto)?.url || p.photos?.[0]?.url || '';
  const direction = (item.direction || fallbackDirection) as RequestDirection | undefined;
  return {
    requestId: item._id,
    connectionId: item._id, // for accepted (connection id)
    profileId: p._id || getProfileIdFallback(item, direction),
    direction,
    name:
      [
        basic.firstName || item.user?.firstName,
        basic.lastName || item.user?.lastName,
      ]
        .filter(Boolean)
        .join(' ') ||
      item.user?.profileCode ||
      'Profile',
    age: getAge(basic.dob),
    caste: basic.caste?.casteName || '',
    profession: p.employment?.designation || '',
    image: photo,
  };
};

// Card for Sent and Accepted request lists.
function SimpleCard({
  profile,
  kind,
  onWithdraw,
  onRemove,
  onView,
  busy,
  metaLabel,
}: {
  profile: any;
  kind: 'Sent' | 'Accepted';
  onWithdraw?: () => void;
  onRemove?: () => void;
  onView?: () => void;
  busy?: boolean;
  metaLabel?: string;
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
          {metaLabel ? <Text style={styles.directionText}>{metaLabel}</Text> : null}
        </View>
      </View>

      {kind === 'Sent' && (
        <TouchableOpacity
          style={[styles.withdrawBtn, busy && styles.disabledBtn]}
          onPress={onWithdraw}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#D20236" size="small" />
          ) : (
            <Text style={styles.withdrawText}>Withdraw</Text>
          )}
        </TouchableOpacity>
      )}

      {kind === 'Accepted' ? (
        <View style={styles.acceptedActions}>
          <TouchableOpacity onPress={onView} style={styles.profileBtn} activeOpacity={0.85}>
            <Text style={styles.profileBtnText}>View Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onRemove}
            style={[styles.removeBtn, busy && styles.disabledBtn]}
            disabled={busy}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator color="#D20236" size="small" />
            ) : (
              <Text style={styles.removeText}>Remove</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={onView} style={styles.viewWrap}>
          <Text style={styles.viewText}>View Profile</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function RequestsScreen({ navigation, route }: any) {
  const [tab, setTab] = useState<Tab>(() => getInitialTab(route));
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState('');
  const [actingAction, setActingAction] = useState('');
  const [accessPrompt, setAccessPrompt] = useState<any | null>(null);
  const [unlockPrice, setUnlockPrice] = useState(99);
  const [unlockingRequestId, setUnlockingRequestId] = useState('');
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  useEffect(() => {
    setTab(getInitialTab(route));
  }, [route]);

  const load = useCallback(async (which: Tab) => {
    setLoading(true);
    try {
      let res;
      if (which === 'Received') {
        res = await apiClient.get('/relationship/requests/received', { params: { status: 'PENDING', limit: 50 } });
        setItems((res.data?.data?.requests || []).map((r: any) => mapCard(r, 'received')));
      } else if (which === 'Sent') {
        res = await apiClient.get('/relationship/requests/sent', { params: { status: 'PENDING', limit: 50 } });
        setItems((res.data?.data?.requests || []).map((r: any) => mapCard(r, 'sent')));
      } else if (which === 'Pending') {
        res = await apiClient.get('/relationship/requests/pending', { params: { limit: 50 } });
        setItems((res.data?.data?.requests || []).map((r: any) => mapCard(r)));
      } else {
        // Accepted requests are represented by active connections.
        res = await apiClient.get('/relationship/connections/me', { params: { limit: 50 } });
        const conns = res.data?.data?.connections || res.data?.data?.items || [];
        setItems(conns.map((c: any) => mapCard(c, 'accepted')));
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

  const showAccessRequired = async (profile: any) => {
    const [accessResult, priceResult] = await Promise.allSettled([
      profile.profileId ? getProfileAccess(profile.profileId) : Promise.resolve(null),
      getUnlockPrice(),
    ]);

    setAccessPrompt({
      profile,
      access: accessResult.status === 'fulfilled' ? accessResult.value : null,
    });

    if (priceResult.status === 'fulfilled') {
      setUnlockPrice(priceResult.value?.amount || 99);
    }
  };

  const accept = async (profile: any) => {
    try {
      setActingId(profile.requestId);
      setActingAction('accept');
      await apiClient.patch(`/relationship/requests/${profile.requestId}/accept`);
      setItems((prev) => prev.filter((x) => x.requestId !== profile.requestId));
    } catch (err: any) {
      if (err?.response?.status === 402) {
        await showAccessRequired(profile);
        return;
      }
      Alert.alert('Error', err?.response?.data?.message || 'Could not accept');
    } finally {
      setActingId('');
      setActingAction('');
    }
  };
  const reject = async (id: string) => {
    try {
      setActingId(id);
      setActingAction('reject');
      await apiClient.patch(`/relationship/requests/${id}/reject`);
      setItems((prev) => prev.filter((x) => x.requestId !== id));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not reject');
    } finally {
      setActingId('');
      setActingAction('');
    }
  };
  const withdraw = async (id: string) => {
    try {
      setActingId(id);
      setActingAction('withdraw');
      await apiClient.patch(`/relationship/requests/${id}/withdraw`);
      setItems((prev) => prev.filter((x) => x.requestId !== id));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not withdraw');
    } finally {
      setActingId('');
      setActingAction('');
    }
  };

  const removeConnection = (connectionId: string, name?: string) => {
    Alert.alert(
      'Remove Connection',
      `Remove ${name || 'this profile'} from your accepted connections?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setActingId(connectionId);
              setActingAction('remove');
              await apiClient.patch(`/relationship/connections/${connectionId}/disconnect`, {});
              setItems((prev) => prev.filter((x) => x.connectionId !== connectionId));
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Could not remove connection');
            } finally {
              setActingId('');
              setActingAction('');
            }
          },
        },
      ],
    );
  };

  const unlockPromptProfile = async () => {
    const prompt = accessPrompt;
    if (!prompt?.profile?.profileId || !prompt?.profile?.requestId) return;

    try {
      setUnlockingRequestId(prompt.profile.requestId);
      const orderResult = await createProfileUnlockOrder(prompt.profile.profileId);
      if (!orderResult?.order?.gatewayOrderId || !orderResult?.keyId) {
        Alert.alert('Payment', 'Could not create payment order');
        return;
      }

      setAccessPrompt(null);
      setPendingPayment({
        orderResult,
        title: 'Profile Unlock',
        description: `Review the GST breakup before unlocking ${prompt.profile.name || 'this profile'}.`,
        itemLabel: 'Profile unlock fee',
        requestId: prompt.profile.requestId,
        profile: prompt.profile,
      });
    } catch (err: any) {
      const payload = err?.response?.data;
      Alert.alert(
        'Payment',
        payload?.code === 'SINGLE_PROFILE_UNLOCK_LIMIT_REACHED'
          ? getSingleProfileUnlockLimitMessage(payload)
          : payload?.message || 'Could not create payment order',
      );
    } finally {
      setUnlockingRequestId('');
    }
  };

  const closePaymentBreakup = () => {
    if (confirmingPayment) return;
    setPendingPayment(null);
  };

  const confirmUnlockPayment = async () => {
    const payment = pendingPayment;
    if (!payment) return;

    setConfirmingPayment(true);
    const result = await openRazorpayOrder(payment.orderResult, 'Unlock Profile Access', {
      name: payment.profile?.name,
    });
    setConfirmingPayment(false);
    setPendingPayment(null);

    if (!result.success) {
      Alert.alert('Payment', result.message || 'Payment failed');
      return;
    }

    try {
      await apiClient.patch(`/relationship/requests/${payment.requestId}/accept`);
      setItems((prev) => prev.filter((x) => x.requestId !== payment.requestId));
      Alert.alert('Accepted', 'Request accepted successfully');
    } catch (err: any) {
      Alert.alert(
        'Unlocked',
        err?.response?.data?.message ||
          'Profile unlocked, but the request could not be accepted. Please retry.',
      );
    }
  };

  const openProfile = (profileId: string) =>
    navigation.navigate('ProfileDetail', { profileId });

  const renderRequestItem = ({ item }: { item: any }) => {
    const isPendingTab = tab === 'Pending';
    const isReceivedRequest =
      tab === 'Received' || (isPendingTab && item.direction === 'received');
    const isAcceptedConnection = tab === 'Accepted';
    const requestBusy = actingId === item.requestId;
    const connectionBusy = actingId === item.connectionId;
    const metaLabel = isPendingTab
      ? item.direction === 'received'
        ? 'Received request'
        : 'Sent request'
      : undefined;

    if (isReceivedRequest) {
      return (
        <RequestCard
          profile={item}
          onAccept={() => accept(item)}
          onReject={() => reject(item.requestId)}
          onView={() => openProfile(item.profileId)}
          accepting={requestBusy && actingAction === 'accept'}
          rejecting={requestBusy && actingAction === 'reject'}
          metaLabel={metaLabel}
        />
      );
    }

    return (
      <SimpleCard
        profile={item}
        kind={isAcceptedConnection ? 'Accepted' : 'Sent'}
        onWithdraw={() => withdraw(item.requestId)}
        onRemove={() => removeConnection(item.connectionId, item.name)}
        onView={() => openProfile(item.profileId)}
        busy={isAcceptedConnection ? connectionBusy : requestBusy}
        metaLabel={metaLabel}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Requests</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Chips */}
      <ScrollView
        horizontal
        style={styles.chipScroller}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
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
      </ScrollView>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color="#D20236" style={styles.loader} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item, i) => item.requestId || item.profileId || String(i)}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={renderRequestItem}
            ListEmptyComponent={<Text style={styles.empty}>No {tab.toLowerCase()} requests</Text>}
          />
        )}
      </View>

      <UnlockAccessModal
        visible={Boolean(accessPrompt)}
        variant="accept"
        name={accessPrompt?.profile?.name}
        price={unlockPrice}
        access={accessPrompt?.access}
        loading={unlockingRequestId === accessPrompt?.profile?.requestId}
        onClose={() => setAccessPrompt(null)}
        onUnlock={unlockPromptProfile}
        onUpgrade={() => {
          const profileId = accessPrompt?.profile?.profileId;
          setAccessPrompt(null);
          navigation.navigate('Plans', profileId ? { profileId } : undefined);
        }}
      />
      <PaymentBreakupModal
        visible={Boolean(pendingPayment)}
        payment={pendingPayment}
        loading={confirmingPayment}
        onClose={closePaymentBreakup}
        onPurchase={confirmUnlockPayment}
      />
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
  headerSpacer: { width: 24 },
  chipScroller: { flexGrow: 0, marginBottom: 8 },
  chipRow: { flexDirection: 'row', paddingHorizontal: 16, paddingRight: 24, gap: 8 },
  chip: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 30, paddingVertical: 7, paddingHorizontal: 18 },
  chipActive: { borderColor: '#D20236', backgroundColor: '#D20236' },
  chipText: { fontSize: 13, color: '#333' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 20, flexGrow: 1 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  // SimpleCard
  card: {
    borderWidth: 1, borderColor: '#f0f0f0', borderRadius: 8, padding: 14, marginBottom: 14,
    backgroundColor: '#fff', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 12 },
  placeholder: { backgroundColor: '#eee' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 16, fontWeight: '700', color: '#000' },
  detail: { fontSize: 13, color: '#888', marginTop: 3 },
  directionText: {
    fontSize: 11,
    color: '#D20236',
    fontWeight: '700',
    marginTop: 5,
    textTransform: 'uppercase',
  },
  withdrawBtn: { backgroundColor: '#f0f0f0', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  withdrawText: { color: '#D20236', fontSize: 14, fontWeight: '700' },
  viewWrap: { alignItems: 'center', marginTop: 12 },
  viewText: { fontSize: 14, color: '#333', fontWeight: '600' },
  acceptedActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  profileBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  profileBtnText: { fontSize: 14, color: '#333', fontWeight: '700' },
  removeBtn: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabledBtn: { opacity: 0.6 },
  removeText: { color: '#D20236', fontSize: 14, fontWeight: '700' },
  content: { flex: 1 },
  loader: { marginTop: 40 },
});
