import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = 'http://localhost:5000';

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket | null> {
  if (socket?.connected) return socket;

  const token = await AsyncStorage.getItem('token');
  if (!token) return null;

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    socket?.emit('join_user');
  });

  socket.on('connect_error', (err: any) => {
    console.log('SOCKET ERROR:', err.message, '| data:', JSON.stringify(err.data), '| type:', err.type);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function joinChat(chatId: string) {
  socket?.emit('join_chat', { chatId });
}

export function sendSocketMessage(payload: {
  chatId: string;
  text: string;
  clientMessageId: string;
  messageType?: string;
}) {
  socket?.emit('send_message', { messageType: 'TEXT', ...payload });
}

export function emitTyping(chatId: string) {
  socket?.emit('typing', { chatId });
}

export function emitStopTyping(chatId: string) {
  socket?.emit('stop_typing', { chatId });
}

export function emitMarkRead(chatId: string) {
  socket?.emit('mark_read', { chatId });
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}