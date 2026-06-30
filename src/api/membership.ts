import apiClient from './client';

export const getActiveMembership = async () => {
  try {
    const res = await apiClient.get('/membership/me/active');
    return res.data?.data || null;
  } catch {
    return null;
  }
};