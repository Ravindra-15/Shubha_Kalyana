import apiClient from './client';

export const getPublicVendors = async () => {
  try {
    const res = await apiClient.get('/vendor/public');
    return res.data?.data || [];
  } catch {
    return [];
  }
};