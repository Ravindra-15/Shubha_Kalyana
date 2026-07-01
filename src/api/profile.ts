import apiClient from './client';

export const getPartnerProfile = async (id: string) => {
  const res = await apiClient.get(`/user/access-profile/${id}`);
  return res.data?.data || null;
};