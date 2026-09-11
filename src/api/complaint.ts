import apiClient from './client';

export const CHAT_REPORT_REASONS = [
  'Obscene/Fake/Misleading Profile',
  'Inappropriate/Unacceptable behaviour',
  'I know this person',
  'Photo related',
  'Other Reason',
] as const;

export type ChatReportReason = typeof CHAT_REPORT_REASONS[number];
const genIdempotencyKey = () =>
  `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;

export const reportChatUser = async (
  chatId: string,
  payload: { reason: ChatReportReason; description?: string; blockUser?: boolean }
) => {
  const res = await apiClient.post(`/complaints/chat/${chatId}/report`, {
    ...payload,
    idempotencyKey: genIdempotencyKey(),
  });
  return res.data?.data;
};

export const reportProfileUser = async (
  userId: string,
  payload: { reason: ChatReportReason; description?: string; blockUser?: boolean }
) => {
  const res = await apiClient.post(`/complaints/user/${userId}/report`, {
    ...payload,
    idempotencyKey: genIdempotencyKey(),
  });
  return res.data?.data;
};

export const raiseComplaint = async (payload: { type: string; description?: string }) => {
  const res = await apiClient.post('/complaints', payload);
  return res.data?.data;
};