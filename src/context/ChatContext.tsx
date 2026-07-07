import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { getChatList } from '../api/chat';
import { connectSocket, getSocket } from '../services/socket';

type ChatContextType = {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
};

const ChatContext = createContext<ChatContextType>({} as ChatContextType);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  //   const refreshUnreadCount = useCallback(async () => {
  //     try {
  //       const data = await getChatList(1);
  //       const total = (data.chats || []).reduce(
  //         (sum: number, chat: any) => sum + (chat.unreadCount || 0),
  //         0
  //       );
  //       setUnreadCount(total);
  //     } catch {
  //       // ignore — keep previous count on failure
  //     }
  //   }, []);
  const refreshUnreadCount = useCallback(async () => {
    try {
      const data = await getChatList(1);
      const chatsWithUnread = (data.chats || []).filter(
        (chat: any) => (chat.unreadCount || 0) > 0,
      ).length;
      setUnreadCount(chatsWithUnread);
    } catch {
      // ignore — keep previous count on failure
    }
  }, []);
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    refreshUnreadCount();

    let mounted = true;
    (async () => {
      const sock = await connectSocket();
      if (!sock || !mounted) return;

      const onNewMessage = () => refreshUnreadCount();
      const onRead = () => refreshUnreadCount();

      sock.on('new_message', onNewMessage);
      sock.on('message_read', onRead);

      return () => {
        sock.off('new_message', onNewMessage);
        sock.off('message_read', onRead);
      };
    })();

    return () => {
      mounted = false;
    };
  }, [user, refreshUnreadCount]);

  return (
    <ChatContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
