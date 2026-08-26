import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Download } from 'lucide-react-native';
import BottomNav from '../../components/BottomNav';
import { getMyPaymentOrders, downloadAndShareReceipt, PaymentOrder } from '../../api/payment';

const PURPOSE_LABELS: Record<string, string> = {
  MEMBERSHIP: 'Membership',
  PROFILE_UNLOCK: 'Profile Unlock',
};

const STATUS_STYLES: Record<string, { color: string; label: string }> = {
  PAID: { color: '#1a7f37', label: 'Completed' },
  FAILED: { color: '#D20236', label: 'Failed' },
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const formatTitle = (order: PaymentOrder) => {
  if (order.purpose === 'MEMBERSHIP' && order.planId?.planName) {
    return order.planId.planName;
  }
  if (order.purpose === 'PROFILE_UNLOCK' && order.targetProfileId) {
    const basic = order.targetProfileId.basicInfo || {};
    const name = [basic.firstName, basic.lastName].filter(Boolean).join(' ');
    return name ? `Profile Unlock - ${name}` : 'Profile Unlock';
  }
  return PURPOSE_LABELS[order.purpose] || order.purpose;
};

export default function PaymentHistoryScreen({ navigation }: any) {
  const [items, setItems] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getMyPaymentOrders(1, 50);
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const handleDownload = async (orderId: string) => {
    if (downloadingId) return;
    try {
      setDownloadingId(orderId);
      await downloadAndShareReceipt(orderId);
    } catch {
      Alert.alert('Error', 'Could not download receipt. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment History</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1 }}>
          <ActivityIndicator color="#D20236" style={{ marginTop: 40 }} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const statusInfo = STATUS_STYLES[item.status] || { color: '#666', label: item.status };
            return (
              <View style={styles.card}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.title}>{formatTitle(item)}</Text>
                  <Text style={styles.amount}>
                    {item.currency === 'INR' ? '\u20B9' : item.currency} {item.amount}
                  </Text>
                </View>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                <View style={styles.cardBottomRow}>
                  {item.status === 'PAID' ? (
                    <TouchableOpacity
                      style={styles.downloadRow}
                      onPress={() => handleDownload(item._id)}
                      disabled={downloadingId === item._id}
                    >
                      {downloadingId === item._id ? (
                        <ActivityIndicator color="#D20236" size="small" />
                      ) : (
                        <Download color="#D20236" size={14} />
                      )}
                      <Text style={styles.downloadText}>Download Invoice</Text>
                    </TouchableOpacity>
                  ) : (
                    <View />
                  )}
                  <Text style={[styles.status, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>No payment history yet</Text>}
        />
      )}

      <BottomNav active="ProfileTab" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontFamily: 'Outfit-Bold', color: '#000' },
  list: { padding: 16, paddingBottom: 30 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#f0f0f0',
    padding: 16, marginBottom: 14,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 15, fontFamily: 'Outfit-Bold', color: '#000' },
  amount: { fontSize: 15, fontFamily: 'Outfit-Bold', color: '#000' },
  date: { fontSize: 12, color: '#999', marginBottom: 12 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  downloadRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  downloadText: { fontSize: 13, fontFamily: 'Outfit-SemiBold', color: '#D20236' },
  status: { fontSize: 13, fontFamily: 'Outfit-Bold' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});
