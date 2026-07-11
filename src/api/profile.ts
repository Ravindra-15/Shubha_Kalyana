import apiClient from './client';

export const getPartnerProfile = async (id: string) => {
  const res = await apiClient.get(`/user/access-profile/${id}`);
  return res.data?.data || null;
};

export const getMyFullProfile = async () => {
  const res = await apiClient.get('/user/me/profile');
  return res.data?.data || null; // { user, profile, partnerPreference }
};

export const updateMyProfile = async (payload: any) => {
  const res = await apiClient.patch('/user/me/profile', payload);
  return res.data?.data || null;
};

export const updateMyPartnerPreference = async (payload: any) => {
  const res = await apiClient.put('/user/me/partner-preference', payload);
  return res.data?.data || null;
};

export const uploadMyProfilePhoto = async (photo: { uri: string; type: string; name: string }) => {
  const formData = new FormData();
  formData.append('profilePhoto', photo as any);
  const res = await apiClient.post('/user/me/profile-photo', formData);
  return res.data?.data || null;
};