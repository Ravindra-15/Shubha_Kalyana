import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Download } from 'lucide-react-native';
import { getMyPaymentOrders, PaymentOrder } from '../../api/payment';

const PURPOSE_LABELS: Record<string, string> = {
  MEMBERSHIP: 'Membership',
  PROFILE_UNLOCK: 'Profile Unlock',
};

const STATUS_STYLES: Record<string, { color: string; label: string }> = {
  PAID: { color: '#1a7f37', label: 'Completed' },
  CREATED: { color: '#b8860b', label: 'Pending' },
  FAILED: { color: '#D20236', label: 'Failed' },
  FULFILLMENT_FAILED: { color: '#D20236', label: 'Failed' },
  REFUND_PENDING: { color: '#b8860b', label: 'Refund Pending' },
  REFUNDED: { color: '#666', label: 'Refunded' },
  EXPIRED: { color: '#999', label: 'Expired' },
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const formatTitle = (order: PaymentOrder) => {
  return PURPOSE_LABELS[order.purpose] || order.purpose;
};

export default function PaymentHistoryScreen({ navigation }: any) {
  const [items, setItems] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleDownload = () => {
    // TODO: PDF invoice generation not implemented on backend yet
    // Placeholder until a PDF library (e.g. pdfkit) is added server-side
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
        <ActivityIndicator color="#D20236" style={{ marginTop: 40 }} />
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
                    {item.currency === 'INR' ? '₹' : item.currency} {item.amount}
                  </Text>
                </View>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                <View style={styles.cardBottomRow}>
                  <TouchableOpacity style={styles.downloadRow} onPress={handleDownload}>
                    <Download color="#D20236" size={14} />
                    <Text style={styles.downloadText}>Download Invoice</Text>
                  </TouchableOpacity>
                  <Text style={[styles.status, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>No payment history yet</Text>}
        />
      )}
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
  list: { padding: 16, paddingBottom: 30 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#f0f0f0',
    padding: 16, marginBottom: 14,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '700', color: '#000' },
  amount: { fontSize: 15, fontWeight: '700', color: '#000' },
  date: { fontSize: 12, color: '#999', marginBottom: 12 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  downloadRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  downloadText: { fontSize: 13, fontWeight: '600', color: '#D20236' },
  status: { fontSize: 13, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});