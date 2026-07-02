import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft, BadgeCheck, Heart, UserPlus, CreditCard, MessageCircle, Bell, CheckCheck,
} from 'lucide-react-native';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/notification';

// icon + color per notification type
const typeConfig = (type: string) => {
  const t = (type || '').toUpperCase();
  if (t.includes('APPROVED') || t.includes('VERIFIED')) return { Icon: BadgeCheck, color: '#1a7f37' };
  if (t.includes('ACCEPTED')) return { Icon: BadgeCheck, color: '#1a7f37' };
  if (t.includes('REQUEST')) return { Icon: UserPlus, color: '#D20236' };
  if (t.includes('INTEREST')) return { Icon: Heart, color: '#D20236' };
  if (t.includes('PAYMENT') || t.includes('MEMBERSHIP')) return { Icon: CreditCard, color: '#b8860b' };
  if (t.includes('CHAT') || t.includes('MESSAGE')) return { Icon: MessageCircle, color: '#2b6cb0' };
  return { Icon: Bell, color: '#666' };
};

const timeAgo = (date: string) => {
  const d = new Date(date).getTime();
  const diff = Date.now() - d;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(date).toLocaleDateString('en-GB');
};

export default function NotificationScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications(1);
      setItems(data.notifications || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onTap = async (n: any) => {
    // mark read locally + backend
    if (!n.readAt) {
      setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, readAt: new Date().toISOString() } : x)));
      markNotificationRead(n._id);
    }
    // navigate if it references a profile
    const profileId = n.data?.profileId;
    if (profileId) {
      navigation.navigate('ProfileDetail', { profileId });
    }
  };

  const markAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, readAt: x.readAt || new Date().toISOString() })));
    markAllNotificationsRead();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAll}>
          <CheckCheck color="#D20236" size={22} />
        </TouchableOpacity>
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
            const { Icon, color } = typeConfig(item.type);
            const unread = !item.readAt;
            const hasProfile = !!item.data?.profileId;
            return (
              <TouchableOpacity
                style={[styles.card, unread && styles.cardUnread]}
                onPress={() => onTap(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
                  <Icon color={color} size={20} />
                </View>
                <View style={styles.body}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.desc}>{item.body}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                    {hasProfile && <Text style={styles.viewLink}>View Profile</Text>}
                  </View>
                </View>
                {unread && <View style={styles.dot} />}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>No notifications yet</Text>}
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
  list: { padding: 16, flexGrow: 1 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 14, borderRadius: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#f0f0f0', backgroundColor: '#fff',
  },
  cardUnread: { backgroundColor: '#fdf2f5', borderColor: '#f5d9e0' },
  iconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: '#000' },
  desc: { fontSize: 13, color: '#555', marginTop: 3, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  time: { fontSize: 11, color: '#999' },
  viewLink: { fontSize: 12, color: '#D20236', fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D20236', marginTop: 4 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});