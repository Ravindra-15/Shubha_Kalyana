import apiClient from './client';

export const getNotifications = async (page = 1) => {
  const res = await apiClient.get('/notifications', { params: { page, limit: 20 } });
  return res.data?.data || { notifications: [], pagination: {} };
};

export const getUnreadCount = async () => {
  try {
    const res = await apiClient.get('/notifications/unread-count');
    return res.data?.data?.unreadCount || 0;
  } catch {
    return 0;
  }
};

export const markNotificationRead = async (id: string) => {
  try {
    await apiClient.patch(`/notifications/${id}/read`);
  } catch {}
};

export const markAllNotificationsRead = async () => {
  try {
    await apiClient.patch('/notifications/read-all');
  } catch {}
};