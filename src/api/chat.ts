import apiClient from './client';

// start (or get existing) direct chat with a user
export const startChat = async (receiverId: string) => {
  const res = await apiClient.post('/chat/start', { receiverId });
  return res.data?.data; // { chat, profileId }
};

// conversation list
export const getChatList = async (page = 1) => {
  const res = await apiClient.get('/chat/list', { params: { page, limit: 20 } });
  return res.data?.data || { chats: [], pagination: {} };
};

// message history for a chat
export const getMessages = async (chatId: string, page = 1) => {
  const res = await apiClient.get(`/chat/${chatId}/messages`, { params: { page, limit: 30 } });
  return res.data?.data || { messages: [], pagination: {} };
};

// send via REST (fallback / ensures persistence)
export const sendMessageApi = async (
  chatId: string,
  payload: { text: string; clientMessageId: string; messageType?: string }
) => {
  const res = await apiClient.post(`/chat/${chatId}/message`, {
    messageType: 'TEXT',
    ...payload,
  });
  return res.data?.data;
};

// mark chat read
export const markChatRead = async (chatId: string) => {
  try {
    await apiClient.patch(`/chat/${chatId}/read`);
  } catch {}
};

// block / unblock the other user
export const blockChatUser = async (chatId: string) => {
  const res = await apiClient.patch(`/chat/${chatId}/block-user`);
  return res.data?.data;
};
export const unblockChatUser = async (chatId: string) => {
  const res = await apiClient.patch(`/chat/${chatId}/unblock-user`);
  return res.data?.data;
};

// delete a message
export const deleteMessage = async (messageId: string) => {
  const res = await apiClient.delete(`/chat/message/${messageId}`);
  return res.data?.data;
};