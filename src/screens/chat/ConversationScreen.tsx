import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MoreVertical,
  Send,
  Smile,
  Check,
  CheckCheck,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { getMessages, sendMessageApi, markChatRead } from '../../api/chat';
import {
  connectSocket,
  getSocket,
  joinChat,
  sendSocketMessage,
  emitTyping,
  emitStopTyping,
  emitMarkRead,
} from '../../services/socket';
import { resolveImageUrl } from '../../utils/imageUrl';
import ChatOptionsModal from '../../components/ChatOptionsModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import ReportUserModal from '../../components/ReportUserModal';
import ReportSubmittedModal from '../../components/ReportSubmittedModal';
import { blockChatUser } from '../../api/chat';
import { Alert } from 'react-native'; // add Alert if not already imported

const genClientId = () =>
  `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const fmtTime = (d?: string) => {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function ConversationScreen({ route, navigation }: any) {
  const { chatId, name, photo, receiverId, profileId } = route.params || {};
  const { user } = useAuth();
  const myId = String(user?._id || user?.id || '');
  console.log('MY ID:', myId, '| USER:', JSON.stringify(user));

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const listRef = useRef<FlatList>(null);
  const typingTimeout = useRef<any>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportSubmitted, setShowReportSubmitted] = useState(false);
  const [blocking, setBlocking] = useState(false);

  // load history + set up socket
  useEffect(() => {
    let mounted = true;
    (async () => {
      console.log('OPENING CHAT ID:', chatId);
      // history
      try {
        const data = await getMessages(chatId, 1);
        console.log('HISTORY:', JSON.stringify(data));
        if (mounted) {
          // newest last for inverted=false; we'll display normal order
          const msgs = data.messages || [];
          console.log('PARSED COUNT:', msgs.length);
          setMessages(msgs);
        }
      } catch {
      } finally {
        if (mounted) setLoading(false);
      }

      // socket
      const sock = await connectSocket();
      if (sock) {
        joinChat(chatId);
        emitMarkRead(chatId);
      }
      markChatRead(chatId);
    })();

    return () => {
      mounted = false;
    };
  }, [chatId]);

  // socket listeners
  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;

    const onNew = (payload: any) => {
      const msg = payload?.message || payload;
      if (String(msg.chatId) !== String(chatId)) return;
      setMessages(prev => {
        // already exists (by clientMessageId or _id) → merge, don't duplicate
        const exists = prev.some(
          m =>
            (msg.clientMessageId &&
              m.clientMessageId === msg.clientMessageId) ||
            (msg._id && m._id === msg._id),
        );
        if (exists) {
          return prev.map(m =>
            (msg.clientMessageId &&
              m.clientMessageId === msg.clientMessageId) ||
            (msg._id && m._id === msg._id)
              ? { ...m, ...msg }
              : m,
          );
        }
        return [...prev, msg];
      });
      emitMarkRead(chatId);
    };
    const onSent = (msg: any) => {
      setMessages(prev =>
        prev.map(m =>
          m.clientMessageId === msg.clientMessageId ? { ...m, ...msg } : m,
        ),
      );
    };
    const onDelivered = (data: any) => {
      if (String(data.chatId) !== String(chatId)) return;
      setMessages(prev =>
        prev.map(m =>
          m.senderId === myId ? { ...m, status: 'DELIVERED' } : m,
        ),
      );
    };
    const onRead = (data: any) => {
      if (String(data.chatId) !== String(chatId)) return;
      setMessages(prev =>
        prev.map(m => (m.senderId === myId ? { ...m, status: 'READ' } : m)),
      );
    };
    const onTyping = (data: any) => {
      if (String(data.chatId) === String(chatId)) setOtherTyping(true);
    };
    const onStopTyping = (data: any) => {
      if (String(data.chatId) === String(chatId)) setOtherTyping(false);
    };
    const onOnline = (data: any) => {
      if (String(data.userId) === String(receiverId)) setOnline(true);
    };
    const onOffline = (data: any) => {
      if (String(data.userId) === String(receiverId)) setOnline(false);
    };

    sock.on('new_message', onNew);
    sock.on('message_sent', onSent);
    sock.on('message_delivered', onDelivered);
    sock.on('message_read', onRead);
    sock.on('user_typing', onTyping);
    sock.on('user_stop_typing', onStopTyping);
    sock.on('user_online', onOnline);
    sock.on('user_offline', onOffline);

    return () => {
      sock.off('new_message', onNew);
      sock.off('message_sent', onSent);
      sock.off('message_delivered', onDelivered);
      sock.off('message_read', onRead);
      sock.off('user_typing', onTyping);
      sock.off('user_stop_typing', onStopTyping);
      sock.off('user_online', onOnline);
      sock.off('user_offline', onOffline);
    };
  }, [chatId, myId, receiverId]);

  // autoscroll on new messages
  useEffect(() => {
    if (messages.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleInput = (t: string) => {
    setInput(t);
    if (t.length > 0) {
      emitTyping(chatId);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => emitStopTyping(chatId), 1500);
    } else {
      emitStopTyping(chatId);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    const clientMessageId = genClientId();

    // optimistic message
    const optimistic = {
      _id: clientMessageId,
      clientMessageId,
      chatId,
      senderId: myId,
      receiverId,
      text,
      messageType: 'TEXT',
      status: 'SENT',
      createdAt: new Date().toISOString(),
      _pending: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setInput('');
    emitStopTyping(chatId);

    // send via socket + REST (REST ensures persistence + returns real _id)
    // send via REST (reliable). Socket send added once socket connects.
    try {
      const resp = await sendMessageApi(chatId, { text, clientMessageId });
      console.log('SEND RESP:', JSON.stringify(resp));
      const saved = resp?.message || resp;
      if (saved) {
        setMessages(prev =>
          prev.map(m =>
            m.clientMessageId === clientMessageId
              ? { ...saved, clientMessageId, _pending: false }
              : m,
          ),
        );
      }
    } catch (err: any) {
      console.log(
        'SEND FAILED:',
        err?.response?.status,
        err?.response?.data?.message || err?.message,
      );
      setMessages(prev =>
        prev.map(m =>
          m.clientMessageId === clientMessageId ? { ...m, _failed: true } : m,
        ),
      );
    }
  };

  const renderMessage = ({ item }: any) => {
    const mine = String(item.senderId?._id || item.senderId) === myId;
    return (
      <View style={[styles.bubbleRow, mine ? styles.rowRight : styles.rowLeft]}>
        <View
          style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}
        >
          <Text
            style={[
              styles.msgText,
              mine ? styles.msgTextMine : styles.msgTextOther,
            ]}
          >
            {item.text}
          </Text>
        </View>
        <View
          style={[styles.metaRow, mine ? styles.metaRight : styles.metaLeft]}
        >
          <Text style={styles.timeText}>{fmtTime(item.createdAt)}</Text>
          {mine &&
            (item.status === 'READ' ? (
              <CheckCheck color="#4a90d9" size={13} />
            ) : item.status === 'DELIVERED' ? (
              <CheckCheck color="#999" size={13} />
            ) : (
              <Check color="#999" size={13} />
            ))}
        </View>
      </View>
    );
  };

  const handleViewProfile = () => {
  setShowOptions(false);
  if (!profileId) {
    Alert.alert('Unavailable', 'This profile is no longer available.');
    return;
  }
  navigation.navigate('ProfileDetail', { profileId });
};

  const handleDeleteChat = () => {
    setShowOptions(false);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteChat = () => {
    // TODO: no backend endpoint exists yet for deleting a whole conversation.
    setShowDeleteConfirm(false);
    Alert.alert('Coming soon', 'Delete conversation will be available soon.');
  };

  const handleBlockAndReport = () => {
    setShowOptions(false);
    setShowBlockConfirm(true);
  };

  const confirmBlock = async () => {
    try {
      setBlocking(true);
      await blockChatUser(chatId);
      setShowBlockConfirm(false);
      setShowReportModal(true);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Could not block user',
      );
    } finally {
      setBlocking(false);
    }
  };

  const handleReportSubmitted = () => {
    setShowReportModal(false);
    setShowReportSubmitted(true);
  };

  const handleBackToChat = () => {
    setShowReportSubmitted(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ChatOptionsModal
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        onViewProfile={handleViewProfile}
        onDeleteChat={handleDeleteChat}
        onBlockAndReport={handleBlockAndReport}
      />
      <ConfirmDialog
        visible={showBlockConfirm}
        title="Block This User?"
        message="You will no longer receive messages or interactions from this profile."
        confirmLabel="Block User"
        loading={blocking}
        onClose={() => setShowBlockConfirm(false)}
        onConfirm={confirmBlock}
      />
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Conversation?"
        message="This action will remove the chat history from your account."
        confirmLabel="Delete"
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteChat}
      />
      <ReportUserModal
        visible={showReportModal}
        chatId={chatId}
        onClose={() => setShowReportModal(false)}
        onSubmitted={handleReportSubmitted}
      />
      <ReportSubmittedModal
        visible={showReportSubmitted}
        onBackToChat={handleBackToChat}
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        {photo ? (
          <Image
            source={{ uri: resolveImageUrl(photo) }}
            style={styles.headerAvatar}
          />
        ) : (
          <View style={[styles.headerAvatar, styles.avatarPlaceholder]} />
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{name || 'Chat'}</Text>
          <Text style={styles.headerStatus}>
            {otherTyping ? 'typing...' : online ? 'Online' : 'Offline'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowOptions(true)}>
          <MoreVertical color="#fff" size={22} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <ActivityIndicator color="#D20236" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item, index) =>
              String(item._id || item.clientMessageId || index) + '_' + index
            }
            renderItem={renderMessage}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={<Text style={styles.todayDivider}>Today</Text>}
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.emojiBtn}>
            <Smile color="#999" size={24} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            value={input}
            onChangeText={handleInput}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              input.trim() ? styles.sendBtnActive : styles.sendBtnInactive,
            ]}
            onPress={send}
            disabled={!input.trim()}
          >
            <Send color="#fff" size={18} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#D20236',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { backgroundColor: 'rgba(255,255,255,0.3)' },
  headerInfo: { flex: 1 },
  headerName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerStatus: { color: '#ffd5de', fontSize: 12, marginTop: 1 },
  list: { padding: 16, paddingBottom: 10 },
  todayDivider: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginBottom: 16,
  },
  bubbleRow: { marginBottom: 14, maxWidth: '80%' },
  rowLeft: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  rowRight: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleOther: { backgroundColor: '#f0f0f0', borderTopLeftRadius: 4 },
  bubbleMine: { backgroundColor: '#fdeaef', borderTopRightRadius: 4 },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgTextOther: { color: '#222' },
  msgTextMine: { color: '#222' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaLeft: { justifyContent: 'flex-start' },
  metaRight: { justifyContent: 'flex-end' },
  timeText: { fontSize: 11, color: '#999' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  emojiBtn: { padding: 4 },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: { backgroundColor: '#D20236' },
  sendBtnInactive: { backgroundColor: '#ccc' },
});
