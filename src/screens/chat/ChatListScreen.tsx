import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Search } from 'lucide-react-native';
import { getChatList } from '../../api/chat';
import { connectSocket } from '../../services/socket';
import { resolveImageUrl } from '../../utils/imageUrl';
import BottomNav from '../../components/BottomNav';

const timeAgo = (dateStr?: string) => {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
};

export default function ChatListScreen({ navigation, route }: any) {
  const pushed = route?.params?.pushed === true;
  const [chats, setChats] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<TextInput>(null);

  const load = useCallback(async () => {
    try {
      const data = await getChatList(1);
      setChats(data.chats || []);
    } catch {
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();

      let mounted = true;
      let cleanup: (() => void) | undefined;

      (async () => {
        const sock = await connectSocket();
        if (!sock || !mounted) return;

        sock.emit('join_user', {}, (res: any) => {
          if (res?.success && res.data?.onlineUserIds) {
            setOnlineIds(new Set(res.data.onlineUserIds.map(String)));
          }
        });

        const onOnline = (data: any) =>
          setOnlineIds((prev) => new Set(prev).add(String(data.userId)));
        const onOffline = (data: any) =>
          setOnlineIds((prev) => {
            const next = new Set(prev);
            next.delete(String(data.userId));
            return next;
          });

        sock.on('user_online', onOnline);
        sock.on('user_offline', onOffline);
        cleanup = () => {
          sock.off('user_online', onOnline);
          sock.off('user_offline', onOffline);
        };
      })();

      return () => {
        mounted = false;
        cleanup?.();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const filtered = chats.filter((c) => {
    if (!search.trim()) return true;
    const name = `${c.oppositeUser?.firstName || ''} ${c.oppositeUser?.lastName || ''}`.toLowerCase();
    return name.includes(search.trim().toLowerCase());
  });

  const openConversation = (item: any) => {
    navigation.navigate('Conversation', {
      chatId: item._id,
      name: `${item.oppositeUser?.firstName || ''} ${item.oppositeUser?.lastName || ''}`.trim(),
      photo: item.oppositeUser?.profilePhoto,
      receiverId: item.oppositeUser?._id,
      profileId: item.oppositeUser?.profileId,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        {pushed ? (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft color="#000" size={24} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <Text style={styles.headerTitle}>Chats</Text>
        <TouchableOpacity onPress={() => searchInputRef.current?.focus()}>
          <Search color="#000" size={22} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Search color="#999" size={16} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator color="#D20236" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isOnline = onlineIds.has(String(item.oppositeUser?._id));
            const name = `${item.oppositeUser?.firstName || ''} ${item.oppositeUser?.lastName || ''}`.trim();
            return (
              <TouchableOpacity style={styles.row} onPress={() => openConversation(item)}>
                <View style={styles.avatarWrap}>
                  {item.oppositeUser?.profilePhoto ? (
                    <Image
                      source={{ uri: resolveImageUrl(item.oppositeUser.profilePhoto) }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]} />
                  )}
                  {isOnline && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.name}>{name || 'User'}</Text>
                  <Text style={styles.lastMsg} numberOfLines={1}>
                    {item.lastMessageText || 'Say hello 👋'}
                  </Text>
                </View>
                <View style={styles.rowMeta}>
                  <Text style={styles.time}>{timeAgo(item.lastMessageAt)}</Text>
                  {item.unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>No conversations yet</Text>}
        />
      )}

      {pushed && <BottomNav active="ChatTab" />}
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
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f5f5f5', borderRadius: 10, marginHorizontal: 16, marginBottom: 10,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#000' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  avatarWrap: { position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { backgroundColor: '#eee' },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#2ecc71', borderWidth: 2, borderColor: '#fff',
  },
  rowContent: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '700', color: '#000' },
  lastMsg: { fontSize: 13, color: '#888', marginTop: 2 },
  rowMeta: { alignItems: 'flex-end', gap: 6 },
  time: { fontSize: 11, color: '#aaa' },
  badge: { backgroundColor: '#D20236', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});